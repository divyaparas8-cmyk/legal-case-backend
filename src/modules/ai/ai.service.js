const OpenAI = require('openai');
const prisma = require('../../config/db');

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not configured in backend environment.');
  }
  return new OpenAI({ apiKey });
}

/**
 * Builds contextual dossier of active case for AI prompt grounding
 */
async function buildMatterDossier(matterId) {
  if (!matterId) return null;
  const mId = parseInt(matterId, 10);
  if (!Number.isFinite(mId)) return null;

  const matter = await prisma.matter.findUnique({
    where: { id: mId },
    include: {
      client: true,
      assigned_lawyer: { select: { id: true, full_name: true, email: true } },
      documents: {
        select: { id: true, file_name: true, original_name: true, category: true, created_at: true },
        take: 8,
        orderBy: { created_at: 'desc' }
      },
      invoices: {
        select: { id: true, invoice_number: true, amount: true, status: true, due_date: true },
        take: 5,
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!matter) return null;

  // Extract intake and party summaries
  const parties = Array.isArray(matter.parties_data) ? matter.parties_data : [];
  const partiesSummary = parties.map(p => 
    `- [${p.party_role || 'Party'}]: ${p.full_name || p.company_name || 'Unnamed'} | Phone: ${p.phone || 'N/A'} | Claim/Policy: ${p.claim_number || p.policy_number || 'N/A'}`
  ).join('\n');

  const intake = matter.intake_answers && typeof matter.intake_answers === 'object'
    ? Object.entries(matter.intake_answers).map(([k, v]) => `  * ${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`).join('\n')
    : 'No additional intake questionnaire records.';

  const docsList = matter.documents.length > 0
    ? matter.documents.map(d => `  * ${d.original_name || d.file_name || 'Document'} (${d.category || 'General'})`).join('\n')
    : '  * No documents uploaded yet.';

  const invoicesList = matter.invoices.length > 0
    ? matter.invoices.map(i => `  * ${i.invoice_number}: $${i.amount} [Status: ${i.status}]`).join('\n')
    : '  * No statements on file.';

  return `
================ ACTIVE CASE FILE DOSSIER ================
• Matter File Number: ${matter.matter_number}
• Case Title: ${matter.title}
• Practice Area / Discipline: ${matter.practice_area || matter.matter_type || 'General Legal Practice'}
• Primary Retaining Client: ${matter.client?.full_name || matter.retaining_client_name || 'N/A'} (Email: ${matter.client?.email || matter.retaining_client_email || 'N/A'}, Phone: ${matter.client?.phone || matter.retaining_client_phone || 'N/A'})
• Client Address: ${matter.client?.address_line_1 || matter.client?.home_address || matter.retaining_client_address || 'N/A'}
• Lead Attorney: ${matter.assigned_lawyer?.full_name || 'Victoria Tulsidas, Esq.'}
• Jurisdiction / Court: ${matter.court_name || 'Superior Court of California'} (${matter.court_type || 'State Court'})
• Docket / Case Number: ${matter.case_number || 'Pre-Litigation / Investigation'}
• Assigned Judge: ${matter.judge_name || 'Unassigned / Pre-Filing'}
• Date of Loss / Incident: ${matter.date_of_loss || 'Not specified'}
• Initial Filing Date: ${matter.initial_filing_date || matter.opened_at ? new Date(matter.opened_at).toLocaleDateString() : 'N/A'}
• Statute of Limitations (SOL): Term = ${matter.sol_term || '2 Years'}, Deadline Date = ${matter.sol_date ? new Date(matter.sol_date).toLocaleDateString() : 'Active Calculation Pending'}
• Case Valuation: ${matter.case_value ? `$${matter.case_value}` : 'Under Evaluation'}
• Opposing Party Entity: ${matter.opposing_party_name || 'Under Investigation'}
• Opposing Law Firm / Counsel: ${matter.opposing_law_firm || matter.opposing_counsel_name || 'None on record'}
• Case Description & Background:
${matter.description || matter.client?.notes || 'No extended synopsis provided.'}

• Involved Parties & Roles:
${partiesSummary || '  * Single retaining client recorded.'}

• Structured Intake Answers & Facts:
${intake}

• Associated Case Documents:
${docsList}

• Case Invoices & Financials:
${invoicesList}
==========================================================`;
}

/**
 * Builds an overview of all active matters in the firm for firm-wide intelligence & workflow tracking
 */
async function buildFirmOverview(user) {
  try {
    const matters = await prisma.matter.findMany({
      where: {
        status: { notIn: ['closed', 'archived'] }
      },
      select: {
        id: true,
        matter_number: true,
        title: true,
        status: true,
        priority: true,
        practice_area: true,
        sol_date: true,
        sol_term: true,
        client: { select: { id: true, full_name: true, phone: true } },
        assigned_lawyer: { select: { id: true, full_name: true } },
        updated_at: true,
      },
      orderBy: { updated_at: 'desc' },
      take: 40
    });

    if (!matters || matters.length === 0) {
      return `[FIRM WORKFLOW CONTEXT: No active matters currently recorded in the system.]`;
    }

    const lines = [
      `==========================================================`,
      `=== FIRM-WIDE ACTIVE CASES & WORKFLOW REGISTRY ===`,
      `Total Currently Running Matters: ${matters.length}`,
      ``,
      `Below is the authoritative list of active cases currently running in the firm (Victoria Tulsidas Law, APLC):`
    ];

    matters.forEach((m, idx) => {
      const clientName = m.client?.full_name || 'N/A';
      const lawyer = m.assigned_lawyer?.full_name || 'Victoria Tulsidas, Esq.';
      const practice = m.practice_area || 'General';
      const status = m.status || 'Active';
      const priorityStr = m.priority ? ` [Priority: ${m.priority}]` : '';
      const sol = m.sol_date;
      const solStr = sol ? ` | SOL Deadline: ${new Date(sol).toLocaleDateString()}` : '';

      lines.push(`${idx + 1}. [Case ID: ${m.id}] ${m.matter_number} — "${m.title}"`);
      lines.push(`   • Retaining Client: ${clientName}`);
      lines.push(`   • Practice Area: ${practice} | Status: ${status}${priorityStr} | Lead Counsel: ${lawyer}${solStr}`);
    });

    lines.push(``);
    lines.push(`OPERATIONAL INSTRUCTION FOR FIRM WORKFLOW:`);
    lines.push(`- You have direct, authoritative visibility over all active matters listed above.`);
    lines.push(`- When the attorney asks "give me the list of matters currently running", "what cases do we have?", "summarize active workflow", or asks about specific cases, provide a clear, professional, executive briefing directly from this registry.`);
    lines.push(`- If the attorney mentions any specific case by title or client, you know its current status and can offer strategic assistance.`);
    lines.push(`==========================================================`);

    return lines.join('\n');
  } catch (err) {
    console.warn('[AI Service] Failed to build firm overview:', err);
    return null;
  }
}

/**
 * Detects if the user's prompt specifically mentions a known matter number or client name
 */
async function findMatterByQuery(text) {
  if (!text || typeof text !== 'string') return null;
  const clean = text.trim().toLowerCase();

  // If query is a broad inquiry for all matters, don't pin to a single case
  if (
    clean.includes('list of') ||
    clean.includes('all matters') ||
    clean.includes('all cases') ||
    clean.includes('running matters') ||
    clean.includes('currently running') ||
    clean.includes('active cases')
  ) {
    return null;
  }

  try {
    const candidates = await prisma.matter.findMany({
      where: { status: { notIn: ['closed', 'archived'] } },
      select: {
        id: true,
        matter_number: true,
        title: true,
        client: { select: { full_name: true } }
      },
      take: 60
    });

    for (const m of candidates) {
      if (m.matter_number && clean.includes(m.matter_number.toLowerCase())) {
        return m.id;
      }
      if (m.client?.full_name) {
        const parts = m.client.full_name.toLowerCase().split(/\s+/).filter(p => p.length >= 3);
        if (parts.length > 0 && parts.every(part => clean.includes(part))) {
          return m.id;
        }
      }
    }
  } catch (err) {
    console.warn('[AI Service] findMatterByQuery error:', err);
  }
  return null;
}

/**
 * Builds the specialized legal intelligence system prompt
 */
function buildSystemPrompt(matterDossier, workflowMode = 'general', firmOverview = null) {
  let prompt = `You are "LexCore AI", an elite Senior Legal Research Specialist and Litigation Intelligence Analyst at Victoria Tulsidas Law, APLC (the VkTori Legal System).

You operate at the intersection of Claude's comprehensive analytical drafting and LexisNexis's rigorous statutory and judicial research standards.

CORE OPERATIONAL BEHAVIORS:
1. WARM, POLITE & PROFESSIONAL GREETINGS:
   - When the user starts with greetings like "hi", "hello", "hey", or asks how you are, respond warmly, courteously, and respectfully as an expert legal assistant.
   - Example greeting: "Hello! I am your VkTori Legal AI Specialist. I am ready to assist you with in-depth legal research, case workflow tracking, statutory analysis, or litigation drafting. How can I assist you today?"
   - Mention the active case if one is loaded, offering quick ways to dive into the case file.

2. LEXISNEXIS & CLAUDE CALIBER LEGAL SPECIALIST:
   - Format legal assessments using the IRAC method (Issue, Rule, Application, Conclusion) where appropriate.
   - Accurately reference California legal authorities (e.g., California Civil Code, Code of Civil Procedure [CCP], California Evidence Code, California Rules of Court) and Federal authorities (FRCP, FRE) relevant to the dispute.
   - When asked to conduct research, cite relevant doctrines, standards of review, elements of claims, affirmative defenses, and burden of proof.
   - Maintain objective legal rigor: highlight both strengths and procedural vulnerabilities.

3. CASE WORKFLOW & FACT GROUNDING:
   - When an Active Case File Dossier is provided below, treat those facts as authoritative truth for this conversation. Ground all discovery questions, demand arguments, injury evaluations, and timeline checks directly in the case specifics.
   - Track key litigation deadlines: Statute of Limitations (SOL), 30-day discovery responses under CCP § 2030, expert witness designations, and mandatory settlement conferences.

4. LITIGATION ARTIFACT GENERATION:
   - You can draft high-caliber litigation deliverables on demand:
     * Formal Demand Letters & Settlement Statements
     * Form & Special Interrogatories
     * Requests for Production of Documents
     * Deposition Outlines & Examination Questions
     * Case Chronologies & Witness Prep Summaries
   - Use clean, structured Markdown with bold headers, bullet lists, and clear legal styling.`;

  if (workflowMode === 'discovery_drafter') {
    prompt += `\n\nSPECIALIZED FOCUS: You are operating in Discovery Drafting Mode. Focus on targeted California CCP § 2030 / § 2031 discovery requests tailored to the active matter facts.`;
  } else if (workflowMode === 'sol_checker') {
    prompt += `\n\nSPECIALIZED FOCUS: You are operating in Statute of Limitations & Deadlines Mode. Rigorously analyze applicable claim accrual dates, statutory tolling provisions, and emergency filing deadlines.`;
  } else if (workflowMode === 'document_summary') {
    prompt += `\n\nSPECIALIZED FOCUS: You are operating in Document Synthesis Mode. Synthesize medical bills, police reports, and pleadings into crisp executive legal memos.`;
  }

  if (matterDossier) {
    prompt += `\n\n${matterDossier}\n\nUse the above case file dossier to personalize and substantiate every analysis requested by the attorney.`;
  } else if (firmOverview) {
    prompt += `\n\n${firmOverview}\n\nWhen the attorney asks for the list of matters, current cases, firm workflow, or case status, provide a well-structured, professional executive briefing directly referencing these live records.`;
  } else {
    prompt += `\n\n[NOTE: No specific matter file is currently focused. You are operating as the firm-wide general legal specialist ready to assist with California jurisprudence, statutory interpretation, litigation strategy, or client communication.]`;
  }

  return prompt;
}

/**
 * Executes chat completion with OpenAI
 */
async function chat({ messages = [], matterId = null, workflowMode = 'general', user = null }) {
  const openai = getOpenAIClient();

  // Validate user messages array
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('At least one user message is required.');
  }

  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.content || '';

  // 1. Resolve matter: explicit matterId or auto-detected from user inquiry
  let resolvedMatterId = matterId ? parseInt(matterId, 10) : null;
  if (!resolvedMatterId && lastUserMsg) {
    resolvedMatterId = await findMatterByQuery(lastUserMsg);
  }

  let matterDossier = null;
  let firmOverview = null;

  if (resolvedMatterId) {
    matterDossier = await buildMatterDossier(resolvedMatterId);
  } else {
    firmOverview = await buildFirmOverview(user);
  }

  // 2. Build master system prompt
  const systemPrompt = buildSystemPrompt(matterDossier, workflowMode, firmOverview);

  // 3. Format OpenAI messages payload
  const formattedMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.slice(-15).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').trim()
    }))
  ];

  // 4. Model selection: default to gpt-4o, fallback to gpt-4o-mini
  const model = process.env.OPENAI_MODEL || 'gpt-4o';

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: formattedMessages,
      temperature: 0.3,
      max_tokens: 2500,
    });

    const reply = response.choices?.[0]?.message?.content || 'I am ready to assist with your legal research.';
    return {
      reply,
      model,
      matterId: resolvedMatterId || null,
      hasMatterContext: Boolean(matterDossier || firmOverview),
      usage: response.usage || null,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    // If gpt-4o is rate-limited or unavailable, attempt seamless fallback to gpt-4o-mini
    if (model !== 'gpt-4o-mini' && (err.status === 404 || err.status === 429)) {
      console.warn(`[AI Service] Primary model ${model} failed (${err.message}). Retrying with gpt-4o-mini...`);
      const fallbackResponse = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: formattedMessages,
        temperature: 0.3,
        max_tokens: 2500,
      });
      const reply = fallbackResponse.choices?.[0]?.message?.content || '';
      return {
        reply,
        model: 'gpt-4o-mini',
        matterId: matterId ? parseInt(matterId, 10) : null,
        hasMatterContext: Boolean(matterDossier),
        usage: fallbackResponse.usage || null,
        timestamp: new Date().toISOString()
      };
    }
    throw err;
  }
}

/**
 * Checks AI health and configuration status
 */
async function checkStatus() {
  const hasKey = Boolean(process.env.OPENAI_API_KEY);
  return {
    configured: hasKey,
    model: process.env.OPENAI_MODEL || 'gpt-4o',
    systemName: 'VkTori LexCore AI Specialist',
    provider: 'OpenAI'
  };
}

module.exports = {
  chat,
  checkStatus,
  getStatus: checkStatus,
  buildMatterDossier
};
