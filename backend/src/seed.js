const db = require('./db');
const { v4: uuidv4 } = require('uuid');

const sampleProjects = [
    {
        name: 'E-Commerce Platform Redesign',
        clientName: 'PT Tokopedia Digital',
        status: 'active',
        startDate: '2026-01-15',
        endDate: '2026-06-30',
    },
    {
        name: 'Mobile Banking App',
        clientName: 'Bank Mandiri',
        status: 'active',
        startDate: '2026-01-01',
        endDate: '2026-08-31',
    },
    {
        name: 'Inventory Management System',
        clientName: 'PT Gudang Garam',
        status: 'active',
        startDate: '2026-02-10',
        endDate: '2026-04-15',
    },
    {
        name: 'Company Website Revamp',
        clientName: 'CV Kreatif Studio',
        status: 'completed',
        startDate: '2025-10-01',
        endDate: '2025-12-31',
    },
    {
        name: 'CRM Integration Project',
        clientName: 'PT Astra Internasional',
        status: 'on_hold',
        startDate: '2026-02-01',
        endDate: '2026-05-30',
    },
    {
        name: 'Data Analytics Dashboard',
        clientName: 'PT Telkom Indonesia',
        status: 'active',
        startDate: '2026-01-20',
        endDate: '2026-04-30',
    },
    {
        name: 'HR Management System',
        clientName: 'PT Pertamina',
        status: 'active',
        startDate: null,
        endDate: '2026-07-01',
    },
    {
        name: 'Legacy System Migration',
        clientName: 'PT Indofood',
        status: 'on_hold',
        startDate: '2025-11-01',
        endDate: '2026-03-31',
    },
    {
        name: 'IoT Monitoring Platform',
        clientName: 'PT PLN',
        status: 'active',
        startDate: null,
        endDate: '2026-09-30',
    },
    {
        name: 'Supply Chain Optimization',
        clientName: 'PT Unilever Indonesia',
        status: 'completed',
        startDate: '2025-08-01',
        endDate: '2025-12-15',
    },
];

// Clear existing data
db.exec('DELETE FROM projects');

const stmt = db.prepare(`
  INSERT INTO projects (id, name, clientName, status, startDate, endDate, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((projects) => {
    for (const p of projects) {
        const now = new Date().toISOString();
        stmt.run(uuidv4(), p.name, p.clientName, p.status, p.startDate, p.endDate, now, now);
    }
});

insertMany(sampleProjects);

console.log(`✅ Seeded ${sampleProjects.length} sample projects`);
process.exit(0);
