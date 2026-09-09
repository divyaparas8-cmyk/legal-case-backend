const prisma = require('../../config/db');

let tablesInitialized = false;

const CORE_MODULES = [
  { key: 'vehicle', title: 'Vehicle Information', description: 'Track vehicles involved in incident', icon: '', category: 'Vehicle', display_order: 1 },
  { key: 'passenger', title: 'Passenger & Seating Info', description: 'Track passengers and seating positions', icon: '', category: 'Vehicle', display_order: 2 },
  { key: 'medical', title: 'Medical & Treatment', description: 'Record physician details, hospital & treatment', icon: '', category: 'Injury', display_order: 3 },
  { key: 'insurance', title: 'Insurance Adjuster & Policy', description: 'Record policy limits, claim numbers & adjusters', icon: '', category: 'Insurance', display_order: 4 },
  { key: 'witness', title: 'Eyewitness Management', description: 'Record eyewitness statements & contact info', icon: '', category: 'Evidence', display_order: 5 },
  { key: 'employer', title: 'Employer & Lost Wage', description: 'Track employment details & wage verification', icon: '', category: 'Injury', display_order: 6 },
  { key: 'property_damage', title: 'Property Damage', description: 'Record damaged property & repair estimates', icon: '', category: 'Property', display_order: 7 },
  { key: 'police', title: 'Police & Investigation', description: 'Track police reports & officer badge numbers', icon: '', category: 'Evidence', display_order: 8 },
];

async function ensureTablesExist() {
  if (tablesInitialized) return;
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS intake_module_definitions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(100) NOT NULL UNIQUE,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        icon VARCHAR(50) DEFAULT '📋',
        category VARCHAR(100) DEFAULT 'General',
        is_core TINYINT(1) DEFAULT 0,
        is_enabled TINYINT(1) DEFAULT 1,
        display_order INT DEFAULT 0,
        practice_area VARCHAR(100) DEFAULT 'All',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_order (display_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS intake_module_field_definitions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_id INT NOT NULL,
        field_key VARCHAR(100) NOT NULL,
        field_label VARCHAR(255) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        placeholder VARCHAR(255) NULL,
        default_value TEXT NULL,
        help_text VARCHAR(255) NULL,
        options JSON NULL,
        is_required TINYINT(1) DEFAULT 0,
        min_length INT NULL,
        max_length INT NULL,
        min_value DOUBLE NULL,
        max_value DOUBLE NULL,
        display_order INT DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (module_id) REFERENCES intake_module_definitions(id) ON DELETE CASCADE,
        INDEX idx_module (module_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Seed core modules if none exist
    const countRes = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as cnt FROM intake_module_definitions`);
    const count = Number(countRes[0]?.cnt || 0);

    if (count === 0) {
      for (const cm of CORE_MODULES) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO intake_module_definitions (\`key\`, title, description, icon, category, is_core, is_enabled, display_order)
          VALUES ('${cm.key}', '${cm.title.replace(/'/g, "''")}', '${cm.description.replace(/'/g, "''")}', '${cm.icon}', '${cm.category}', 1, 1, ${cm.display_order})
        `);
      }
    }

    tablesInitialized = true;
  } catch (err) {
    console.error('Failed to initialize intake_module tables:', err);
  }
}

async function getAll() {
  await ensureTablesExist();
  const modules = await prisma.$queryRawUnsafe(`
    SELECT * FROM intake_module_definitions ORDER BY display_order ASC, id ASC
  `);

  const fields = await prisma.$queryRawUnsafe(`
    SELECT * FROM intake_module_field_definitions ORDER BY display_order ASC, id ASC
  `);

  return modules.map(m => ({
    ...m,
    is_core: Boolean(m.is_core),
    is_enabled: Boolean(m.is_enabled),
    fields: fields.filter(f => f.module_id === m.id).map(f => ({
      ...f,
      is_required: Boolean(f.is_required),
      options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options
    }))
  }));
}

async function getEnabled() {
  await ensureTablesExist();
  const modules = await prisma.$queryRawUnsafe(`
    SELECT * FROM intake_module_definitions WHERE is_enabled = 1 ORDER BY display_order ASC, id ASC
  `);

  const fields = await prisma.$queryRawUnsafe(`
    SELECT * FROM intake_module_field_definitions ORDER BY display_order ASC, id ASC
  `);

  return modules.map(m => ({
    ...m,
    is_core: Boolean(m.is_core),
    is_enabled: Boolean(m.is_enabled),
    fields: fields.filter(f => f.module_id === m.id).map(f => ({
      ...f,
      is_required: Boolean(f.is_required),
      options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options
    }))
  }));
}

async function createModule(data) {
  await ensureTablesExist();
  const { title, description, icon = '📋', category = 'General', practice_area = 'All', fields = [] } = data;
  
  if (!title || !title.trim()) {
    const err = new Error('Module title is required');
    err.statusCode = 400;
    throw err;
  }

  const key = (data.key || title).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  
  // Check key uniqueness
  const existing = await prisma.$queryRawUnsafe(`SELECT id FROM intake_module_definitions WHERE \`key\` = '${key}'`);
  if (existing.length > 0) {
    const err = new Error(`A module with key "${key}" already exists`);
    err.statusCode = 409;
    throw err;
  }

  // Get next display order
  const maxOrderRes = await prisma.$queryRawUnsafe(`SELECT MAX(display_order) as max_ord FROM intake_module_definitions`);
  const nextOrder = Number(maxOrderRes[0]?.max_ord || 0) + 1;

  await prisma.$executeRawUnsafe(`
    INSERT INTO intake_module_definitions (\`key\`, title, description, icon, category, is_core, is_enabled, display_order, practice_area)
    VALUES ('${key}', '${title.trim().replace(/'/g, "''")}', ${description ? `'${description.trim().replace(/'/g, "''")}'` : 'NULL'}, '${icon}', '${category}', 0, 1, ${nextOrder}, '${practice_area}')
  `);

  const createdRes = await prisma.$queryRawUnsafe(`SELECT * FROM intake_module_definitions WHERE \`key\` = '${key}'`);
  const createdModule = createdRes[0];

  // Insert fields if provided
  if (Array.isArray(fields) && fields.length > 0) {
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const fKey = (f.field_key || f.field_label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!fKey) continue;
      const optsJson = f.options ? JSON.stringify(f.options).replace(/'/g, "''") : 'NULL';
      await prisma.$executeRawUnsafe(`
        INSERT INTO intake_module_field_definitions 
        (module_id, field_key, field_label, field_type, placeholder, default_value, help_text, options, is_required, display_order)
        VALUES (
          ${createdModule.id},
          '${fKey}',
          '${(f.field_label || fKey).replace(/'/g, "''")}',
          '${f.field_type || 'text'}',
          ${f.placeholder ? `'${f.placeholder.replace(/'/g, "''")}'` : 'NULL'},
          ${f.default_value ? `'${f.default_value.replace(/'/g, "''")}'` : 'NULL'},
          ${f.help_text ? `'${f.help_text.replace(/'/g, "''")}'` : 'NULL'},
          ${optsJson === 'NULL' ? 'NULL' : `'${optsJson}'`},
          ${f.is_required ? 1 : 0},
          ${f.display_order || (i + 1)}
        )
      `);
    }
  }

  return await getModuleById(createdModule.id);
}

async function getModuleById(id) {
  await ensureTablesExist();
  const res = await prisma.$queryRawUnsafe(`SELECT * FROM intake_module_definitions WHERE id = ${parseInt(id, 10)}`);
  if (!res || res.length === 0) return null;
  const mod = res[0];
  const fields = await prisma.$queryRawUnsafe(`SELECT * FROM intake_module_field_definitions WHERE module_id = ${mod.id} ORDER BY display_order ASC, id ASC`);
  return {
    ...mod,
    is_core: Boolean(mod.is_core),
    is_enabled: Boolean(mod.is_enabled),
    fields: fields.map(f => ({
      ...f,
      is_required: Boolean(f.is_required),
      options: typeof f.options === 'string' ? JSON.parse(f.options) : f.options
    }))
  };
}

async function updateModule(id, data) {
  await ensureTablesExist();
  const modId = parseInt(id, 10);
  const existing = await getModuleById(modId);
  if (!existing) {
    const err = new Error('Module not found');
    err.statusCode = 404;
    throw err;
  }

  const { title, description, icon, category, is_enabled, display_order, practice_area, fields } = data;

  let titleVal = existing.title;
  if (title !== undefined && title.trim()) {
    if (existing.is_core && title.trim() !== existing.title) {
      const err = new Error('Core module title cannot be renamed');
      err.statusCode = 400;
      throw err;
    }
    titleVal = title.trim();
  }

  const descVal = description !== undefined ? description : existing.description;
  const iconVal = icon !== undefined ? icon : existing.icon;
  const catVal = category !== undefined ? category : existing.category;
  const enabledVal = is_enabled !== undefined ? (is_enabled ? 1 : 0) : (existing.is_enabled ? 1 : 0);
  const orderVal = display_order !== undefined ? parseInt(display_order, 10) : existing.display_order;
  const paVal = practice_area !== undefined ? practice_area : existing.practice_area;

  await prisma.$executeRawUnsafe(`
    UPDATE intake_module_definitions
    SET title = '${titleVal.replace(/'/g, "''")}',
        description = ${descVal ? `'${descVal.replace(/'/g, "''")}'` : 'NULL'},
        icon = '${iconVal}',
        category = '${catVal}',
        is_enabled = ${enabledVal},
        display_order = ${orderVal},
        practice_area = '${paVal}'
    WHERE id = ${modId}
  `);

  if (Array.isArray(fields)) {
    await prisma.$executeRawUnsafe(`DELETE FROM intake_module_field_definitions WHERE module_id = ${modId}`);
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      const fKey = (f.field_key || f.field_label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
      if (!fKey) continue;
      const optsJson = f.options ? JSON.stringify(f.options).replace(/'/g, "''") : 'NULL';
      await prisma.$executeRawUnsafe(`
        INSERT INTO intake_module_field_definitions 
        (module_id, field_key, field_label, field_type, placeholder, default_value, help_text, options, is_required, display_order)
        VALUES (
          ${modId},
          '${fKey}',
          '${(f.field_label || fKey).replace(/'/g, "''")}',
          '${f.field_type || 'text'}',
          ${f.placeholder ? `'${f.placeholder.replace(/'/g, "''")}'` : 'NULL'},
          ${f.default_value ? `'${f.default_value.replace(/'/g, "''")}'` : 'NULL'},
          ${f.help_text ? `'${f.help_text.replace(/'/g, "''")}'` : 'NULL'},
          ${optsJson === 'NULL' ? 'NULL' : `'${optsJson}'`},
          ${f.is_required ? 1 : 0},
          ${f.display_order || (i + 1)}
        )
      `);
    }
  }

  return await getModuleById(modId);
}

async function deleteModule(id) {
  await ensureTablesExist();
  const modId = parseInt(id, 10);
  const existing = await getModuleById(modId);
  if (!existing) {
    const err = new Error('Module not found');
    err.statusCode = 404;
    throw err;
  }
  if (existing.is_core) {
    const err = new Error('Core modules cannot be deleted. You can disable them instead.');
    err.statusCode = 400;
    throw err;
  }

  await prisma.$executeRawUnsafe(`DELETE FROM intake_module_definitions WHERE id = ${modId}`);
  return { success: true, deleted_id: modId };
}

async function reorderModules(orderList) {
  await ensureTablesExist();
  if (!Array.isArray(orderList)) return await getAll();
  for (const item of orderList) {
    const mId = parseInt(item.id, 10);
    const ord = parseInt(item.display_order, 10);
    if (Number.isFinite(mId) && Number.isFinite(ord)) {
      await prisma.$executeRawUnsafe(`UPDATE intake_module_definitions SET display_order = ${ord} WHERE id = ${mId}`);
    }
  }
  return await getAll();
}

module.exports = {
  getAll,
  getEnabled,
  createModule,
  getModuleById,
  updateModule,
  deleteModule,
  reorderModules
};
