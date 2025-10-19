import Joi from 'joi';

const chatSchema = Joi.object({
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('user', 'model', 'system').required().messages({
        'any.only': 'Invalid role value',
      }),
      content: Joi.string().required().messages({
        'any.required': 'Content is required',
      }),
    })
  ).min(1).required().messages({
    'array.min': 'At least one message is required',
    'any.required': 'Messages field is required',
  }),
});

export function chatValidate(req, res, next) {
  const { error } = chatSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: false,
      code: 400,
      message: 'Invalid request body',
      errors: error.details[0].message,
    });
  }
  next();
}

