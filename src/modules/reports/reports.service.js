const prisma = require('../../config/db');

exports.generate = async (userId, body) => {
  const { title, category, start_date, end_date } = body;
  const cat = String(category || '').toLowerCase();

  const whereDate = {
    gte: new Date(start_date),
    lte: new Date(end_date)
  };

  const reportData = {
    leads: 0,
    matters: 0,
    revenue: 0,
    hours: 0
  };

  if (cat === 'financial') {
    // Revenue only
    const paidInvoices = await prisma.invoice.findMany({
      where: {
        status: 'paid',
        updated_at: whereDate
      },
      select: { amount: true }
    });
    reportData.revenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
  } 
  else if (cat === 'operational') {
    // Matters + Hours
    const mattersCount = await prisma.matter.count({
      where: { created_at: whereDate }
    });

    const timers = await prisma.timeEntry.findMany({
      where: {
        start_time: whereDate,
        is_running: false
      },
      select: { duration_minutes: true }
    });

    const totalMinutes = timers.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);
    
    reportData.matters = mattersCount;
    reportData.hours = Number((totalMinutes / 60).toFixed(2));
  } 
  else if (cat === 'marketing') {
    // Leads only
    const leadsCount = await prisma.lead.count({
      where: { created_at: whereDate }
    });
    reportData.leads = leadsCount;
  } 
  else {
    // Fallback: All data
    const leadsCount = await prisma.lead.count({ where: { created_at: whereDate } });
    const mattersCount = await prisma.matter.count({ where: { created_at: whereDate } });
    const paidInvoices = await prisma.invoice.findMany({
      where: { status: 'paid', updated_at: whereDate },
      select: { amount: true }
    });
    const timers = await prisma.timeEntry.findMany({
      where: { start_time: whereDate, is_running: false },
      select: { duration_minutes: true }
    });

    const totalMinutes = timers.reduce((sum, t) => sum + (t.duration_minutes || 0), 0);

    reportData.leads = leadsCount;
    reportData.matters = mattersCount;
    reportData.revenue = paidInvoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);
    reportData.hours = Number((totalMinutes / 60).toFixed(2));
  }

  const report = await prisma.report.create({
    data: {
      title,
      category,
      start_date: new Date(start_date),
      end_date: new Date(end_date),
      data: reportData,
      created_by: userId
    }
  });

  return report;
};

exports.list = async () => {
  return await prisma.report.findMany({
    orderBy: { created_at: 'desc' }
  });
};

exports.getById = async (id) => {
  const numericId = Number(id);
  if (!numericId || Number.isNaN(numericId)) return null;
  return await prisma.report.findUnique({
    where: { id: numericId }
  });
};

exports.getMarketingStats = async () => {
  // Leads
  const totalLeads = await prisma.lead.count();

  // Clients
  const totalClients = await prisma.client.count();

  // Conversion Rate
  const conversionRate = totalLeads === 0
    ? 0
    : ((totalClients / totalLeads) * 100).toFixed(1);

  // Revenue (Paid Invoices Total)
  const payments = await prisma.invoice.findMany({
    where: { status: 'paid' },
    select: { amount: true }
  });

  const revenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

  // Leads by source
  const leadsBySource = await prisma.lead.groupBy({
    by: ['source'],
    _count: { id: true }
  });

  // Map to UI friendly sources with percentages
  const totalBySources = leadsBySource.reduce((sum, item) => sum + item._count.id, 0);
  const formattedSources = leadsBySource.map(item => ({
    name: item.source || 'Other',
    value: totalBySources === 0 ? 0 : Math.round((item._count.id / totalBySources) * 100),
    count: item._count.id,
    color: item.source === 'Google' ? 'bg-blue-500' :
           item.source === 'Referral' ? 'bg-amber-500' :
           item.source === 'Social' ? 'bg-emerald-500' : 'bg-slate-400'
  }));

  return {
    visitors: totalLeads, // using leads as proxy for visitors in this simplified model
    leads: totalLeads,
    clients: totalClients,
    conversionRate,
    revenue,
    leadsBySource: formattedSources
  };
};

exports.getReferralAnalytics = async () => {
  const matters = await prisma.matter.findMany({
    include: {
      invoices: {
        where: { status: 'paid' },
        select: { amount: true }
      },
      client: true
    }
  });

  const sourceMap = {};
  const outstandingPayouts = [];
  let totalReferralMatters = 0;
  let totalReferralRevenue = 0;
  let totalPendingPayoutsAmount = 0;
  let crpcCompliantMattersCount = 0;

  for (const m of matters) {
    const intake = typeof m.intake_answers === 'string' ? (JSON.parse(m.intake_answers) || {}) : (m.intake_answers || {});
    const refSource = intake.referral_source || intake.referral_contact_name || m.lead_source || 'Direct / Non-Referral';
    const isReferral = refSource && refSource !== 'Direct / Non-Referral' && refSource !== 'Direct Intake';

    const paidRev = m.invoices.reduce((sum, inv) => sum + Number(inv.amount || 0), 0);

    if (isReferral) {
      totalReferralMatters++;
      totalReferralRevenue += paidRev;

      if (intake.crpc_151_consent_obtained) {
        crpcCompliantMattersCount++;
      }

      if (!sourceMap[refSource]) {
        sourceMap[refSource] = {
          name: refSource,
          category: intake.referral_category || 'Attorney',
          agreement_on_file: !!intake.referral_agreement_on_file,
          agreement_doc_url: intake.referral_agreement_doc_url || null,
          fee_terms: intake.referral_fee_type === 'percentage' 
            ? `${intake.referral_fee_value || 25}% Fee Split` 
            : intake.referral_fee_type === 'flat' 
            ? `$${intake.referral_fee_value || 0} Flat` 
            : 'Comped',
          matters_count: 0,
          total_revenue: 0,
          crpc_consent_count: 0
        };
      }

      sourceMap[refSource].matters_count += 1;
      sourceMap[refSource].total_revenue += paidRev;
      if (intake.crpc_151_consent_obtained) {
        sourceMap[refSource].crpc_consent_count += 1;
      }
    }

    // Collect payouts
    if (Array.isArray(intake.referral_payouts)) {
      for (const p of intake.referral_payouts) {
        if (p.status === 'pending') {
          totalPendingPayoutsAmount += Number(p.amount || 0);
          outstandingPayouts.push({
            ...p,
            matter_id: m.id,
            matter_number: m.matter_number,
            matter_title: m.title,
            client_name: m.client?.full_name || 'N/A',
            referral_source: refSource
          });
        }
      }
    }
  }

  const sourcesList = Object.values(sourceMap).sort((a, b) => b.total_revenue - a.total_revenue);

  return {
    total_referral_matters: totalReferralMatters,
    total_referral_revenue: totalReferralRevenue,
    total_pending_payouts_amount: totalPendingPayoutsAmount,
    crpc_compliance_rate: totalReferralMatters > 0 ? Math.round((crpcCompliantMattersCount / totalReferralMatters) * 100) : 100,
    sources: sourcesList,
    outstanding_payouts: outstandingPayouts
  };
};
