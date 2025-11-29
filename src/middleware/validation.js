import Joi from 'joi';

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      convert: true // Automatically convert string numbers to numbers
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return res.status(400).json({ errors });
    }
    
    // Replace req.body with validated and converted values
    req.body = value;
    
    next();
  };
};

export const schemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    name: Joi.string().min(2).required(),
    locale: Joi.string().valid('fr', 'en').default('fr')
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  deposit: Joi.object({
    accountId: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(512).optional()
  }),
  
  withdraw: Joi.object({
    accountId: Joi.number().integer().required(),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(512).optional()
  }),
  
  transfer: Joi.object({
    fromAccountId: Joi.number().integer().required(),
    toEmail: Joi.string().email().optional().allow(null, ''),
    toAccountId: Joi.number().integer().optional().allow(null),
    toAccountNumber: Joi.string().max(34).optional().allow(null, ''),
    amount: Joi.number().positive().required(),
    description: Joi.string().max(512).optional().allow(null, '')
  }).or('toEmail', 'toAccountId', 'toAccountNumber'),
  
  createCard: Joi.object({
    accountId: Joi.number().integer().required(),
    label: Joi.string().max(255).optional()
  }),

    updateUser: Joi.object({
      name: Joi.string().min(2).optional(),
      locale: Joi.string().valid('fr', 'en').optional(),
      phone: Joi.string().max(50).optional().allow('', null),
      address: Joi.string().max(512).optional().allow('', null),
      city: Joi.string().max(100).optional().allow('', null),
      state: Joi.string().max(100).optional().allow('', null),
      zip_code: Joi.string().max(20).optional().allow('', null),
      country: Joi.string().max(100).optional().allow('', null),
      currency: Joi.string().max(10).optional(),
      apple_pay: Joi.boolean().optional(),
      google_pay: Joi.boolean().optional()
    }),

    adminUpdateUser: Joi.object({
      name: Joi.string().min(2).optional(),
      email: Joi.string().email().optional(),
      phone: Joi.string().max(50).optional().allow('', null),
      address: Joi.string().max(512).optional().allow('', null),
      city: Joi.string().max(100).optional().allow('', null),
      state: Joi.string().max(100).optional().allow('', null),
      zip_code: Joi.string().max(20).optional().allow('', null),
      country: Joi.string().max(100).optional().allow('', null),
      locale: Joi.string().valid('fr', 'en').optional(),
      role: Joi.string().valid('user', 'admin').optional()
    }),

    resetPassword: Joi.object({
      newPassword: Joi.string().min(8).required()
    }),

    adminUpdateAccount: Joi.object({
      balance: Joi.number().optional(),
      label: Joi.string().max(255).optional().allow('', null),
      type: Joi.string().valid('current', 'savings').optional()
    }),

    adminCreateAccount: Joi.object({
      userId: Joi.number().integer().required(),
      type: Joi.string().valid('current', 'savings').default('current'),
      label: Joi.string().max(255).optional().allow('', null),
      initialBalance: Joi.number().min(0).default(0)
    }),

    sendNotification: Joi.object({
      userId: Joi.number().integer().required(),
      type: Joi.string().required(),
      title: Joi.string().required(),
      body: Joi.string().required(),
      data: Joi.object().optional()
    }),

    createTransferAdmin: Joi.object({
      fromAccountId: Joi.number().integer().required(),
      toAccountId: Joi.number().integer().required(),
      amount: Joi.number().positive().required(),
      description: Joi.string().max(512).optional().allow('', null)
    }),

    forgotPassword: Joi.object({
      email: Joi.string().email().required()
    }),

    resetPassword: Joi.object({
      email: Joi.string().email().required(),
      code: Joi.string().length(6).pattern(/^[A-Z0-9]+$/).required(),
      newPassword: Joi.string().min(8).required()
    }),

    changePassword: Joi.object({
      currentPassword: Joi.string().required(),
      newPassword: Joi.string().min(8).required()
    })
  };
