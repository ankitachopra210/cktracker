const { sendError } = require('../utils/helpers');

const validateBody = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return sendError(res, 'Validation Error', 400, messages);
    }

    req.body = value;
    next();
  };
};

module.exports = {
  validateBody,
};
