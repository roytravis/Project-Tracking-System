const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const Project = require('../models/project');

const router = express.Router();

/**
 * Helper to extract validation errors and return 400 if any.
 */
function handleValidation(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, errors: errors.array() });
        return false;
    }
    return true;
}

/**
 * POST /api/projects
 * Create a new project.
 */
router.post(
    '/',
    [
        body('name').trim().notEmpty().withMessage('Project name is required'),
        body('clientName').trim().notEmpty().withMessage('Client name is required'),
        body('startDate').optional({ values: 'null' }).isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
        body('endDate').optional({ values: 'null' }).isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
    ],
    (req, res, next) => {
        if (!handleValidation(req, res)) return;

        try {
            const project = Project.create(req.body);
            res.status(201).json({ success: true, data: project });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * GET /api/projects
 * List projects with optional filtering, search, pagination, and sorting.
 */
router.get(
    '/',
    [
        query('status').optional().isIn(Project.VALID_STATUSES).withMessage(`status must be one of: ${Project.VALID_STATUSES.join(', ')}`),
        query('search').optional().isString(),
        query('page').optional().isInt({ min: 1 }).toInt(),
        query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
        query('sortBy').optional().isString(),
        query('order').optional().isIn(['asc', 'desc']),
    ],
    (req, res) => {
        if (!handleValidation(req, res)) return;

        const { status, search, page, limit, sortBy, order } = req.query;
        const result = Project.findAll({ status, search, page, limit, sortBy, order });

        res.json({ success: true, ...result });
    }
);

/**
 * GET /api/projects/:id
 * Retrieve a single project by ID.
 */
router.get('/:id', param('id').isUUID().withMessage('Invalid project ID'), (req, res) => {
    if (!handleValidation(req, res)) return;

    const project = Project.findById(req.params.id);
    if (!project) {
        return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, data: project });
});

/**
 * PUT /api/projects/:id
 * Update project fields (name, clientName, startDate, endDate).
 */
router.put(
    '/:id',
    [
        param('id').isUUID().withMessage('Invalid project ID'),
        body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
        body('clientName').optional().trim().notEmpty().withMessage('Client name cannot be empty'),
        body('startDate').optional({ values: 'null' }).isISO8601().withMessage('startDate must be a valid ISO 8601 date'),
        body('endDate').optional({ values: 'null' }).isISO8601().withMessage('endDate must be a valid ISO 8601 date'),
    ],
    (req, res, next) => {
        if (!handleValidation(req, res)) return;

        try {
            const project = Project.update(req.params.id, req.body);
            if (!project) {
                return res.status(404).json({ success: false, error: 'Project not found' });
            }

            res.json({ success: true, data: project });
        } catch (err) {
            next(err);
        }
    }
);

/**
 * PATCH /api/projects/:id/status
 * Update project status with transition rule validation.
 */
router.patch(
    '/:id/status',
    [
        param('id').isUUID().withMessage('Invalid project ID'),
        body('status')
            .trim()
            .notEmpty()
            .withMessage('Status is required')
            .isIn(Project.VALID_STATUSES)
            .withMessage(`status must be one of: ${Project.VALID_STATUSES.join(', ')}`),
    ],
    (req, res) => {
        if (!handleValidation(req, res)) return;

        const result = Project.updateStatus(req.params.id, req.body.status);

        if (!result.success) {
            const statusCode = result.error === 'Project not found' ? 404 : 400;
            return res.status(statusCode).json({ success: false, error: result.error });
        }

        res.json({ success: true, data: result.project });
    }
);

/**
 * DELETE /api/projects/:id
 * Soft delete a project.
 */
router.delete('/:id', param('id').isUUID().withMessage('Invalid project ID'), (req, res) => {
    if (!handleValidation(req, res)) return;

    const deleted = Project.softDelete(req.params.id);
    if (!deleted) {
        return res.status(404).json({ success: false, error: 'Project not found' });
    }

    res.json({ success: true, message: 'Project deleted successfully' });
});

module.exports = router;
