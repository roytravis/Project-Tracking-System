const db = require('../db');
const { v4: uuidv4 } = require('uuid');

/**
 * Valid status values and their allowed transitions.
 * Matches the original spec exactly:
 *   active    → on_hold, completed
 *   on_hold   → active, completed
 *   completed → (none — terminal state)
 */
const STATUS_TRANSITIONS = {
    active: ['on_hold', 'completed'],
    on_hold: ['active', 'completed'],
    completed: [],
};

const VALID_STATUSES = Object.keys(STATUS_TRANSITIONS);

/**
 * Create a new project.
 * Validates that endDate >= startDate when both are provided.
 */
function create({ name, clientName, startDate, endDate }) {
    // Backend validation: endDate >= startDate
    if (startDate && endDate && endDate < startDate) {
        throw Object.assign(
            new Error('endDate must be greater than or equal to startDate'),
            { statusCode: 400 }
        );
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
    INSERT INTO projects (id, name, clientName, status, startDate, endDate, createdAt, updatedAt)
    VALUES (?, ?, ?, 'active', ?, ?, ?, ?)
  `);

    stmt.run(id, name, clientName, startDate || null, endDate || null, now, now);

    return findById(id);
}

/**
 * Find all projects (excluding soft-deleted) with optional filtering, search, sorting, and pagination.
 */
function findAll({ status, search, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = {}) {
    const conditions = ['deletedAt IS NULL'];
    const params = [];

    if (status && VALID_STATUSES.includes(status)) {
        conditions.push('status = ?');
        params.push(status);
    }

    if (search) {
        conditions.push('(name LIKE ? OR clientName LIKE ?)');
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Whitelist sortable columns to prevent SQL injection
    const allowedSortColumns = ['name', 'clientName', 'status', 'startDate', 'endDate', 'createdAt', 'updatedAt'];
    const safeSort = allowedSortColumns.includes(sortBy) ? sortBy : 'createdAt';
    const safeOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // Count total results
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM projects ${whereClause}`);
    const { total } = countStmt.get(...params);

    // Calculate pagination
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);

    // Fetch page of results
    const dataStmt = db.prepare(`
    SELECT * FROM projects ${whereClause}
    ORDER BY ${safeSort} ${safeOrder}
    LIMIT ? OFFSET ?
  `);

    const data = dataStmt.all(...params, limit, offset);

    return {
        data,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
}

/**
 * Find a single project by ID (excluding soft-deleted).
 */
function findById(id) {
    const stmt = db.prepare('SELECT * FROM projects WHERE id = ? AND deletedAt IS NULL');
    return stmt.get(id) || null;
}

/**
 * Update project fields (name, clientName, startDate, endDate).
 * Validates that endDate >= startDate when both are provided.
 */
function update(id, fields) {
    const project = findById(id);
    if (!project) return null;

    const allowedFields = ['name', 'clientName', 'startDate', 'endDate'];
    const updates = [];
    const params = [];

    for (const field of allowedFields) {
        if (fields[field] !== undefined) {
            updates.push(`${field} = ?`);
            params.push(fields[field]);
        }
    }

    if (updates.length === 0) return project;

    // Determine effective startDate and endDate for validation
    const effectiveStartDate = fields.startDate !== undefined ? fields.startDate : project.startDate;
    const effectiveEndDate = fields.endDate !== undefined ? fields.endDate : project.endDate;

    if (effectiveStartDate && effectiveEndDate && effectiveEndDate < effectiveStartDate) {
        throw Object.assign(
            new Error('endDate must be greater than or equal to startDate'),
            { statusCode: 400 }
        );
    }

    updates.push("updatedAt = datetime('now')");
    params.push(id);

    const stmt = db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`);
    stmt.run(...params);

    return findById(id);
}

/**
 * Update project status with transition validation.
 * Returns { success, project, error } object.
 */
function updateStatus(id, newStatus) {
    const project = findById(id);
    if (!project) {
        return { success: false, error: 'Project not found' };
    }

    const currentStatus = project.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus];

    if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        return {
            success: false,
            error: `Cannot transition from '${currentStatus}' to '${newStatus}'. Allowed transitions: ${allowedTransitions.length > 0 ? allowedTransitions.join(', ') : 'none (terminal state)'}`,
        };
    }

    const stmt = db.prepare("UPDATE projects SET status = ?, updatedAt = datetime('now') WHERE id = ?");
    stmt.run(newStatus, id);

    return { success: true, project: findById(id) };
}

/**
 * Soft delete a project by setting deletedAt timestamp.
 */
function softDelete(id) {
    const project = findById(id);
    if (!project) return false;

    const stmt = db.prepare("UPDATE projects SET deletedAt = datetime('now'), updatedAt = datetime('now') WHERE id = ?");
    stmt.run(id);
    return true;
}

module.exports = {
    create,
    findAll,
    findById,
    update,
    updateStatus,
    softDelete,
    VALID_STATUSES,
    STATUS_TRANSITIONS,
};
