/**
 * Request Validation Middleware
 * Uses Zod schemas to validate req.body, req.query, or req.params.
 * 
 * Usage: router.post('/path', validate(schema), controller.method)
 */
const validate = (schema) => (req, res, next) => {
  try {
    // If schema has body/query/params keys, validate the full request object
    if (schema.shape && (schema.shape.body || schema.shape.query || schema.shape.params)) {
      const validated = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      req.body = validated.body || req.body;
      req.query = validated.query || req.query;
      req.params = validated.params || req.params;
    } else {
      // Otherwise assume it's validating req.body by default
      req.body = schema.parse(req.body);
    }

    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
  }
};

module.exports = validate;
