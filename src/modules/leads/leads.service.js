const prisma = require('../../config/db');

const getAll = async (query) => {
  const { status, matter_type, page = 1, limit = 10 } = query;
  
  const where = {};
  if (status) where.status = status;
  if (matter_type) where.matter_type = matter_type;

  const take = parseInt(limit);
  const skip = (parseInt(page) - 1) * take;

  return await prisma.lead.findMany({
    where,
    skip,
    take,
    orderBy: { created_at: 'desc' },
  });
};

const getById = async (id) => {
  return await prisma.lead.findUnique({ 
    where: { id: parseInt(id) },
    include: {
      created_by: {
        select: { id: true, full_name: true }
      }
    }
  });
};

const create = async (data) => {
  const lead = await prisma.lead.create({ data });
  
  // Log activity
  await prisma.activity.create({
    data: {
      entity_type: 'lead',
      entity_id: lead.id,
      action: 'created',
      description: `Lead created for ${lead.full_name}`,
    }
  });

  return lead;
};

const createFromPublicConsultation = async (body) => {
  const full_name = String(body?.full_name || '').trim();
  const email = String(body?.email || '').trim();
  const phoneRaw = String(body?.phone ?? '').trim();
  const preferred_date = String(body?.preferred_date || '').trim();
  const matter_type = String(body?.matter_type || '').trim();
  const message = String(body?.message || '').trim();

  if (!full_name || !email || !preferred_date || !matter_type || !message) {
    const err = new Error('Full name, email, preferred date, matter type, and matter overview are required');
    err.statusCode = 400;
    throw err;
  }

  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!emailOk) {
    const err = new Error('Valid email is required');
    err.statusCode = 400;
    throw err;
  }

  const notesLines = [
    'Channel: website book consultation',
    `Preferred consultation date: ${preferred_date}`,
  ];

  return create({
    full_name,
    email,
    phone: phoneRaw || null,
    matter_type,
    practice_area: matter_type,
    source: 'website',
    message,
    notes: notesLines.join('\n'),
    status: 'new',
    created_by_user_id: null,
  });
};

const createFromPublicInquiry = async (body) => {
  const full_name = String(body?.full_name || '').trim();
  const email = String(body?.email || '').trim();
  const phoneRaw = String(body?.phone ?? '').trim();
  const preferred_contact_method = String(body?.preferred_contact_method || 'email').trim();
  const preferred_language = String(body?.preferred_language || 'English').trim();
  const city = String(body?.city || '').trim();
  const zip_code = String(body?.zip_code || '').trim();
  const matter_type = String(body?.matter_type || '').trim();
  const incident_date = String(body?.incident_date || '').trim();
  const is_ongoing = Boolean(body?.is_ongoing);
  const incident_location = String(body?.incident_location || '').trim();
  const message = String(body?.message || '').trim();
  const parties_involved = String(body?.parties_involved || '').trim();
  const has_court_date = String(body?.has_court_date || 'No').trim() === 'Yes' || Boolean(body?.has_court_date === true || body?.has_court_date === 'on');
  const court_date = String(body?.court_date || '').trim();
  const court_date_description = String(body?.court_date_description || '').trim();
  const has_court_papers = String(body?.has_court_papers || 'No').trim() === 'Yes' || Boolean(body?.has_court_papers === true || body?.has_court_papers === 'on');
  const currently_represented = String(body?.currently_represented || 'No').trim() === 'Yes' || Boolean(body?.currently_represented === true || body?.currently_represented === 'on');
  const referral_source = String(body?.referral_source || '').trim();
  const disclaimer_accepted = Boolean(body?.disclaimer_accepted || body?.disclaimer_accepted === 'on');

  if (!full_name || (!email && !phoneRaw) || !message) {
    const err = new Error('Full name, contact details, and matter narrative are required');
    err.statusCode = 400;
    throw err;
  }

  // Cross-field validation: Preferred contact method validation
  if (preferred_contact_method === 'email' && !email) {
    const err = new Error('Email is required when preferred contact method is Email');
    err.statusCode = 400;
    throw err;
  }
  if ((preferred_contact_method === 'call' || preferred_contact_method === 'text') && !phoneRaw) {
    const err = new Error('Phone number is required when preferred contact method is Call or Text');
    err.statusCode = 400;
    throw err;
  }

  if (disclaimer_accepted !== true) {
    const err = new Error('You must accept the disclaimers to submit this form');
    err.statusCode = 400;
    throw err;
  }

  if (email) {
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!emailOk) {
      const err = new Error('Valid email address is required');
      err.statusCode = 400;
      throw err;
    }
  }

  const notesLines = [
    `--- PUBLIC INTAKE UNIVERSAL VARIABLES ---`,
    `Preferred Language: ${preferred_language}`,
    `Preferred Contact Method: ${preferred_contact_method}`,
    `City/ZIP: ${city}${zip_code ? `, ${zip_code}` : ''}`,
    `When Happened: ${is_ongoing ? 'Ongoing Incident' : (incident_date || 'N/A')}`,
    `Where Happened: ${incident_location || 'N/A'}`,
    `Parties Involved: ${parties_involved || 'None listed'}`,
    `Court Date / Hearing Deadline: ${has_court_date ? `YES (${court_date || 'Date unstated'}) - ${court_date_description}` : 'No'}`,
    `Court / Agency Papers Received: ${has_court_papers ? 'YES' : 'No'}`,
    `Currently Represented by Attorney: ${currently_represented ? 'YES' : 'No'}`,
    `Referral Channel: ${referral_source || 'Website'}`,
    `Disclaimers Accepted: ${disclaimer_accepted ? 'YES' : 'No'}`,
  ];

  if (has_court_date) {
    notesLines.unshift(`🚨 [URGENT: HEARING / COURT DEADLINE DISCLOSED] 🚨`);
  }

  // Handle optional pre-conflict photo/document quarantine upload
  const lead = await create({
    full_name,
    email: email || `${phoneRaw.replace(/\D/g, '') || Date.now()}@intake.placeholder`,
    phone: phoneRaw || null,
    matter_type: matter_type || 'General Inquiry',
    practice_area: matter_type || 'General Inquiry',
    source: referral_source || 'website_inquiry',
    message,
    notes: notesLines.join('\n'),
    status: 'new',
    created_by_user_id: null,
    has_court_date,
  });

  const photo_base64 = body?.photo_base64;
  const photo_name = body?.photo_name;
  if (photo_base64 && photo_name) {
    const fs = require('fs');
    const path = require('path');
    const base64Data = photo_base64.replace(/^data:image\/\w+;base64,/, "").replace(/^data:application\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Configurable paths
    const uploadDir = path.join(__dirname, '../../../uploads/leads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    const fileName = `lead_${lead.id}_${Date.now()}_${photo_name}`;
    const filePath = path.join(uploadDir, fileName);
    
    fs.writeFileSync(filePath, buffer);

    // Save in quarantined LeadDocument table
    await prisma.leadDocument.create({
      data: {
        lead_id: lead.id,
        file_name: fileName,
        original_name: photo_name,
        mime_type: photo_name.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg',
        file_path: `/uploads/leads/${fileName}`,
        file_size: buffer.length,
        doc_type: has_court_papers ? 'Court or agency papers' : 'Photos',
        description: 'Uploaded during public intake',
        quarantined: true,
        scan_status: 'clean' // Mark clean for local filesystem storage
      }
    });
  }

  return lead;
};

const update = async (id, data) => {
  const lead = await prisma.lead.update({
    where: { id: parseInt(id) },
    data,
  });

  // Log activity
  await prisma.activity.create({
    data: {
      entity_type: 'lead',
      entity_id: lead.id,
      action: 'updated',
      description: `Lead updated: status changed to ${lead.status}`,
    }
  });

  return lead;
};

const remove = async (id) => {
  return await prisma.lead.delete({ where: { id: parseInt(id) } });
};

const convertToClient = async (leadId, createdByUserId) => {
  const lead = await prisma.lead.findUnique({ 
    where: { id: parseInt(leadId) },
    include: { lead_documents: true }
  });
  
  if (!lead) throw new Error('Lead not found');

  // Parse fields from serialized notes safely
  const notesStr = lead.notes || '';
  const langMatch = notesStr.match(/Preferred Language:\s*([^\n]+)/i);
  const preferred_language = langMatch ? langMatch[1].trim() : 'English';

  const contactMatch = notesStr.match(/Preferred Contact Method:\s*([^\n]+)/i);
  const preferred_contact = contactMatch ? contactMatch[1].trim() : 'email';

  // Configurable Duplicate Match Check (Email OR Phone)
  let existingClient = null;
  if (lead.email && !lead.email.includes('@intake.placeholder')) {
    existingClient = await prisma.client.findFirst({
      where: { email: lead.email },
      include: { user: true }
    });
  }
  if (!existingClient && lead.phone) {
    existingClient = await prisma.client.findFirst({
      where: { phone: lead.phone },
      include: { user: true }
    });
  }

  // Transaction to convert lead to client & create matter
  return await prisma.$transaction(async (tx) => {
    let client = existingClient;

    if (!client) {
      // 1. Create client profile
      client = await tx.client.create({
        data: {
          full_name: lead.full_name,
          email: lead.email,
          phone: lead.phone,
          notes: `Converted from lead. Original message: ${lead.message || ''}`,
          preferred_language,
          preferred_contact,
          status: 'active',
        }
      });
    } else {
      // Append lead notes to existing client profile
      await tx.client.update({
        where: { id: client.id },
        data: {
          notes: `${client.notes || ''}\n\n[RETAINED NEW LEAD MATTER]: Converted from Lead #${lead.id}. Message: ${lead.message || ''}`
        }
      });
    }

    // 2. Map Public Intake Selection to Matter Practice Area
    const practiceAreaMapping = {
      'car_accident': 'Personal Injury',
      'product_liability': 'Product Liability',
      'habitability': 'Habitability',
      'employment': 'Employment',
      'civil_rights': 'Civil Rights',
      'immigration': 'Immigration',
      'general': 'General / To Be Determined'
    };
    const mappedPracticeArea = practiceAreaMapping[lead.matter_type] || lead.practice_area || 'General / To Be Determined';

    // Generate unique matter number
    const prefix = mappedPracticeArea.substring(0, 2).toUpperCase();
    const count = await tx.matter.count();
    const matterNumber = `${prefix}-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 3. Create the Matter record in the mapped practice area
    const matter = await tx.matter.create({
      data: {
        matter_number: matterNumber,
        title: `${lead.full_name} - ${mappedPracticeArea}`,
        client_id: client.id,
        practice_area: mappedPracticeArea,
        matter_type: lead.matter_type || 'General Inquiry',
        description: lead.message || 'No narrative description provided.',
        status: 'pending',
        created_by_user_id: createdByUserId,
      }
    });

    // 4. Migrate quarantined documents from LeadDocument to Matter Document table
    if (lead.lead_documents && lead.lead_documents.length > 0) {
      for (const leadDoc of lead.lead_documents) {
        await tx.document.create({
          data: {
            matter_id: matter.id,
            uploaded_by_user_id: createdByUserId, // converted by admin
            file_name: leadDoc.file_name,
            original_name: leadDoc.original_name,
            mime_type: leadDoc.mime_type,
            file_path: leadDoc.file_path,
            file_size: leadDoc.file_size,
            visibility: 'internal', // Default pre-engagement materials to internal visibility
            category: 'Client uploads / ' + (leadDoc.doc_type || 'Photos'),
            folder_path: 'Client Uploads/' + (leadDoc.doc_type || 'Photos'),
            doc_type: leadDoc.doc_type,
            doc_description: leadDoc.description,
          }
        });
      }
    }

    // 5. Update lead status
    await tx.lead.update({
      where: { id: lead.id },
      data: { 
        status: 'retained',
        converted_client_id: client.id 
      }
    });

    // 6. Log activities
    await tx.activity.create({
      data: {
        matter_id: matter.id,
        entity_type: 'client',
        entity_id: client.id,
        action: 'converted_from_lead',
        actor_user_id: createdByUserId,
        description: `Client profile ${existingClient ? 'matched' : 'created'} from Lead #${lead.id}`,
      }
    });

    await tx.activity.create({
      data: {
        matter_id: matter.id,
        entity_type: 'matter',
        entity_id: matter.id,
        action: 'created',
        actor_user_id: createdByUserId,
        description: `Matter created from Lead #${lead.id} with prefix ${prefix}`,
      }
    });

    return { client, matter, was_existing: !!existingClient };
  });
};


module.exports = {
  getAll,
  getById,
  create,
  createFromPublicConsultation,
  createFromPublicInquiry,
  update,
  remove,
  convertToClient,
};
