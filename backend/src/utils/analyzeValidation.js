import Joi from 'joi';

// Schema for /analyze/headers endpoint
export const headersSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.empty': 'url is required',
      'any.required': 'url parameter is required',
      'string.uri': 'url must be a valid HTTP or HTTPS URL'
    })
});

// Schema for /analyze/url endpoint
export const urlSchema = Joi.object({
  url: Joi.string()
    .uri({ scheme: ['http', 'https'] })
    .required()
    .messages({
      'string.empty': 'url is required',
      'any.required': 'url parameter is required',
      'string.uri': 'url must be a valid HTTP or HTTPS URL'
    }),
  timeout: Joi.number()
    .integer()
    .min(1000)
    .max(30000)
    .default(5000)
    .messages({
      'number.base': 'timeout must be a number',
      'number.integer': 'timeout must be an integer',
      'number.min': 'timeout must be at least 1000ms',
      'number.max': 'timeout cannot exceed 30000ms'
    })
});