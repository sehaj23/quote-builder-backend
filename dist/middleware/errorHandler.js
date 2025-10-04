export const errorHandler = (error, req, res, _next) => {
    console.error('Global error handler:', {
        message: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
    });
    const response = {
        success: false,
        error: process.env['NODE_ENV'] === 'development'
            ? error.message
            : 'An internal server error occurred'
    };
    res.status(500).json(response);
};
export const notFoundHandler = (req, res, _next) => {
    const response = {
        success: false,
        error: `Route ${req.method} ${req.url} not found`
    };
    res.status(404).json(response);
};
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
//# sourceMappingURL=errorHandler.js.map