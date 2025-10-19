const Joi = require('joi');

// Factory to create a validator middleware for a request part
// part can be one of: 'body', 'query', 'params', 'headers'
function validate(part, schema) {
  if (!['body', 'query', 'params', 'headers'].includes(part)) {
    throw new Error(`Unsupported validation part: ${part}`);
  }
  if (!Joi.isSchema(schema)) {
    throw new Error('validate() requires a Joi schema');
  }
  return (req, res, next) => {
    const { error, value } = schema.validate(req[part], {
      abortEarly: false,
      stripUnknown: true,
      convert: true,
    });
    if (error) {
      const details = error.details.map((d) => ({ message: d.message, path: d.path }));
      return res.status(400).json({ error: 'Validation failed', details });
    }
    // assign sanitized value back
    req[part] = value;
    return next();
  };
}

module.exports = { validate, Joi };
