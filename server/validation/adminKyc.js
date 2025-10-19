const { Joi } = require('../middleware/validate');

const submissionsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(200).default(50),
});

const signedParams = Joi.object({
  submissionId: Joi.string().min(1).required(),
});

const decisionBody = Joi.object({
  submissionId: Joi.string().min(1).required(),
  decision: Joi.string().valid('approved', 'rejected').required(),
  note: Joi.string().max(1000).allow('', null),
});

module.exports = { submissionsQuery, signedParams, decisionBody };
