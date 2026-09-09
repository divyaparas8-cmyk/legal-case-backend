const prisma = require('../../config/db');
const { formatPSTDate } = require('../../utils/dateUtils');

const formatUSPhone = (value) => {
  if (!value) return '';
  const clean = value.replace(/[^\d]/g, '');
  const length = clean.length;
  if (length === 0) return value;
  if (length === 10) {
    return `(${clean.slice(0, 3)}) ${clean.slice(3, 6)}-${clean.slice(6, 10)}`;
  }
  return value;
};

const getAll = async (query, user) => {
  const { category, page = 1, limit = 50 } = query;
  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  const where = {};
  if (category) where.category = category;
  if (user?.role !== 'admin') where.is_active = true;

  return await prisma.template.findMany({
    where,
    skip,
    take,
    include: {
      created_by: { select: { id: true, full_name: true } }
    },
    orderBy: { created_at: 'desc' },
  });
};

const getById = async (id, user) => {
  const template = await prisma.template.findUnique({
    where: { id: parseInt(id) },
    include: {
      created_by: { select: { id: true, full_name: true } }
    }
  });
  if (!template) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }
  return template;
};

const create = async (data, user) => {
  if (user?.role === 'client') {
    const err = new Error('Client cannot create templates');
    err.statusCode = 403;
    throw err;
  }
  data.created_by_user_id = user.id;
  return await prisma.template.create({ data });
};

const update = async (id, data, user) => {
  if (user?.role === 'client') {
    const err = new Error('Client cannot update templates');
    err.statusCode = 403;
    throw err;
  }
  return await prisma.template.update({
    where: { id: parseInt(id) },
    data,
  });
};

const remove = async (id, user) => {
  if (user?.role === 'client') {
    const err = new Error('Client cannot delete templates');
    err.statusCode = 403;
    throw err;
  }
  return await prisma.template.delete({ where: { id: parseInt(id) } });
};

const cloneToMatter = async (templateId, matterId, user, extraData = {}) => {
  if (user?.role === 'client') {
    const err = new Error('Client cannot clone templates');
    err.statusCode = 403;
    throw err;
  }

  const parsedTemplateId = parseInt(templateId, 10);
  const parsedMatterId = parseInt(matterId, 10);

  return await prisma.$transaction(async (tx) => {
    let template = null;

    if (!isNaN(parsedTemplateId)) {
      template = await tx.template.findUnique({
        where: { id: parsedTemplateId }
      });
    }

    if (!template && (extraData.title || extraData.name)) {
      const searchTitle = extraData.title || extraData.name;
      template = await tx.template.findFirst({
        where: { title: { contains: String(searchTitle) } }
      });
    }

    if (!template) {
      template = await tx.template.findFirst({
        orderBy: { id: 'asc' }
      });
    }

    if (!template) {
      template = await tx.template.create({
        data: {
          title: extraData.title || 'Standard Retainer & Legal Document Template',
          category: extraData.category || 'General',
          content: extraData.content || `RETAINER AGREEMENT\n\nClient Name: {{client_name}}\nMatter Name: {{matter_title}}\nDate: {{today_date}}\n\nThis Retainer Agreement is entered into between {{client_name}} and the Firm regarding {{matter_title}} (Case #{{matter_number}}).\n\nAttorneys Assigned: {{assigned_lawyer_name}}\n\nParty Information:\n{{all_parties_summary}}\n\nTerms & Scope of Services:\n- Representation for {{matter_type}}\n- Hourly Fee / Retainer Terms apply as set forth by counsel.\n\nSignatures:\nClient Signature: ____________________\nDate: ____________________`,
          created_by_user_id: user?.id || null
        }
      });
    }

    const matter = await tx.matter.findUnique({
      where: { id: parsedMatterId },
      include: {
        client: true,
        assigned_lawyer: true
      }
    });

    if (!matter) {
      const err = new Error('Matter not found');
      err.statusCode = 404;
      throw err;
    }

    // Parse nested matter data
    let parties = [];
    if (matter.parties_data) {
      try {
        parties = Array.isArray(matter.parties_data) ? matter.parties_data : JSON.parse(matter.parties_data);
      } catch (e) {}
    }

    let vehicles = [];
    if (matter.vehicles_data) {
      try {
        vehicles = Array.isArray(matter.vehicles_data) ? matter.vehicles_data : JSON.parse(matter.vehicles_data);
      } catch (e) {}
    }

    const intake = matter.intake_answers || {};
    const defendantParty = parties.find(p => (p.role || '').toLowerCase().includes('defendant') || (p.role || '').toLowerCase().includes('opposing')) || parties[0] || {};
    const firstVehicle = vehicles[0] || {};

    let content = template.content || '';

    // Standard Client & Matter Tags
    content = content.replace(/{{client\.name}}/g, matter.client?.full_name || '');
    content = content.replace(/{{client_name}}/g, matter.client?.full_name || '');
    content = content.replace(/{{client\.address}}/g, matter.client?.home_address || matter.client?.address || '');
    content = content.replace(/{{client\.phone}}/g, formatUSPhone(matter.client?.phone || ''));
    content = content.replace(/{{client\.email}}/g, matter.client?.email || '');

    // Opposing Party & Counsel Tags
    content = content.replace(/{{opposing_party\.name}}/g, defendantParty.full_name || defendantParty.name || matter.opposing_party || 'Opposing Party');
    content = content.replace(/{{opposing_party}}/g, defendantParty.full_name || defendantParty.name || matter.opposing_party || 'Opposing Party');
    content = content.replace(/{{opposing_counsel\.name}}/g, intake.opposing_counsel_name || 'Opposing Counsel');

    // Insurance & Claims Tags
    content = content.replace(/{{insurance\.company}}/g, intake.insurance_company || 'Insurance Carrier');
    content = content.replace(/{{insurance\.claim_no}}/g, intake.claim_number || intake.insurance_claim_no || 'CLM-PENDING');
    content = content.replace(/{{insurance\.policy_no}}/g, intake.policy_number || 'POL-PENDING');

    // Vehicles & Incidents Tags
    content = content.replace(/{{vehicle\.make_model}}/g, firstVehicle.make ? `${firstVehicle.year || ''} ${firstVehicle.make} ${firstVehicle.model}` : 'Vehicle');
    content = content.replace(/{{vehicle\.vin}}/g, firstVehicle.vin || 'VIN-PENDING');
    content = content.replace(/{{vehicle\.license_plate}}/g, firstVehicle.license_plate || 'PLATE-PENDING');
    content = content.replace(/{{incident\.date}}/g, matter.date_of_loss ? formatPSTDate(matter.date_of_loss) : 'Date of Loss');

    // Matter Info Tags
    content = content.replace(/{{matter\.no}}/g, matter.matter_number || '');
    content = content.replace(/{{matter_number}}/g, matter.matter_number || '');
    content = content.replace(/{{case_number}}/g, matter.matter_number || '');
    content = content.replace(/{{matter_title}}/g, matter.title || '');
    content = content.replace(/{{lawyer_name}}/g, matter.assigned_lawyer?.full_name || '');
    content = content.replace(/{{date}}/g, formatPSTDate(new Date()));
    content = content.replace(/{{current_date}}/g, formatPSTDate(new Date()));

    const company = await tx.companyProfile.findFirst() || {};
    content = content.replace(/{{firm_name}}/g, company.company_name || '');
    content = content.replace(/{{firm_address}}/g, company.address || '');
    content = content.replace(/{{firm_phone}}/g, formatUSPhone(company.phone || ''));
    content = content.replace(/{{firm_email}}/g, company.email || '');
    content = content.replace(/{{firm_logo}}/g, company.logo_url ? `<img src="${company.logo_url}" alt="Firm Logo" style="max-width:200px;" />` : '');

    const draft = await tx.draft.create({
      data: {
        matter_id: matter.id,
        title: template.title,
        content: content,
        category: template.category,
        created_by_user_id: user.id,
        last_updated_by_user_id: user.id,
        status: 'draft'
      }
    });

    return draft;
  });
};

const duplicate = async (id, user) => {
  if (user?.role === 'client') {
    const err = new Error('Client cannot duplicate templates');
    err.statusCode = 403;
    throw err;
  }
  const original = await getById(id, user);
  if (!original) {
    const err = new Error('Template not found');
    err.statusCode = 404;
    throw err;
  }

  return await prisma.template.create({
    data: {
      title: `${original.title} (Copy)`,
      content: original.content,
      category: original.category,
      practice_area: original.practice_area,
      matter_type: original.matter_type,
      description: original.description,
      is_active: original.is_active,
      created_by_user_id: user.id
    }
  });
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  cloneToMatter,
  duplicate
};
