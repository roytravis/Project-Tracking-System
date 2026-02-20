/**
 * Centralized error handling middleware.
 * Catches errors thrown in route handlers and returns consistent JSON responses.
 */
function errorHandler(err, req, res, _next) {
    console.error('[Error]', err.message);

    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({
            success: false,
            error: 'Invalid JSON in request body',
        });
    }

    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: err.message || 'Internal server error',
    });
}

/**
 * 404 handler for undefined routes.
 */
function notFoundHandler(req, res) {
    res.status(404).json({
        success: false,
        error: `Route ${req.method} ${req.originalUrl} not found`,
    });
}

module.exports = { errorHandler, notFoundHandler };
