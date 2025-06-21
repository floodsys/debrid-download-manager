const Joi = require('joi');

// Auth validators
exports.validateLogin = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .min(3)
      .max(50)
      .required()
      .messages({
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 50 characters',
        'any.required': 'Username is required'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'any.required': 'Password is required'
      })
  });
  
  return schema.validate(data);
};

exports.validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string()
      .required()
      .messages({
        'any.required': 'Current password is required'
      }),
    newPassword: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'New password must be at least 6 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
        'any.required': 'New password is required'
      })
  });
  
  return schema.validate(data);
};

// User validators
exports.validateUserCreation = (data) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': 'Username can only contain letters and numbers',
        'string.min': 'Username must be at least 3 characters',
        'string.max': 'Username cannot exceed 30 characters',
        'any.required': 'Username is required'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email is required'
      }),
    password: Joi.string()
      .min(6)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .required()
      .messages({
        'string.min': 'Password must be at least 6 characters',
        'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
        'any.required': 'Password is required'
      }),
    realDebridApiKey: Joi.string()
      .when('role', {
        is: 'admin',
        then: Joi.optional(),
        otherwise: Joi.required()
      })
      .messages({
        'any.required': 'Real-Debrid API key is required for regular users'
      }),
    role: Joi.string()
      .valid('user', 'admin')
      .default('user'),
    downloadQuota: Joi.object({
      daily: Joi.number()
        .positive()
        .max(1000)
        .messages({
          'number.positive': 'Daily quota must be positive',
          'number.max': 'Daily quota cannot exceed 1000'
        })
    }).optional(),
    settings: Joi.object({
      autoCategory: Joi.boolean(),
      notifications: Joi.object({
        email: Joi.boolean(),
        downloadComplete: Joi.boolean(),
        downloadError: Joi.boolean()
      }),
      defaultCategory: Joi.string().hex().length(24)
    }).optional()
  });
  
  return schema.validate(data);
};

exports.validateUserUpdate = (data) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .optional()
      .messages({
        'string.email': 'Please provide a valid email address'
      }),
    isActive: Joi.boolean().optional(),
    realDebridApiKey: Joi.string().optional(),
    downloadQuota: Joi.object({
      daily: Joi.number()
        .positive()
        .max(1000)
        .messages({
          'number.positive': 'Daily quota must be positive',
          'number.max': 'Daily quota cannot exceed 1000'
        })
    }).optional(),
    settings: Joi.object({
      autoCategory: Joi.boolean(),
      notifications: Joi.object({
        email: Joi.boolean(),
        downloadComplete: Joi.boolean(),
        downloadError: Joi.boolean()
      }),
      defaultCategory: Joi.string().hex().length(24)
    }).optional(),
    role: Joi.string()
      .valid('user', 'admin')
      .optional()
  });
  
  return schema.validate(data);
};

// Download validators
exports.validateAddDownload = (data) => {
  const schema = Joi.object({
    magnetLink: Joi.string()
      .pattern(/^magnet:\?xt=urn:btih:[a-fA-F0-9]{40}/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid magnet link format',
        'any.required': 'Magnet link is required'
      }),
    categoryId: Joi.string()
      .hex()
      .length(24)
      .optional()
      .messages({
        'string.hex': 'Invalid category ID format',
        'string.length': 'Invalid category ID format'
      })
  });
  
  return schema.validate(data);
};

// Category validators
exports.validateCategory = (data, isUpdate = false) => {
  const schema = Joi.object({
    name: isUpdate 
      ? Joi.string().min(1).max(50).optional()
      : Joi.string().min(1).max(50).required()
        .messages({
          'string.min': 'Category name cannot be empty',
          'string.max': 'Category name cannot exceed 50 characters',
          'any.required': 'Category name is required'
        }),
    description: Joi.string()
      .max(200)
      .allow('')
      .optional()
      .messages({
        'string.max': 'Description cannot exceed 200 characters'
      }),
    icon: Joi.string()
      .max(50)
      .optional()
      .default('folder'),
    color: Joi.string()
      .pattern(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
      .optional()
      .default('#667eea')
      .messages({
        'string.pattern.base': 'Color must be a valid hex code'
      }),
    autoMatch: Joi.object({
      enabled: Joi.boolean().default(false),
      patterns: Joi.array()
        .items(Joi.string())
        .messages({
          'array.base': 'Patterns must be an array of strings'
        }),
      priority: Joi.number()
        .integer()
        .min(0)
        .max(100)
        .default(0)
    }).optional(),
    isDefault: Joi.boolean()
      .optional()
      .default(false),
    isActive: Joi.boolean()
      .optional()
      .default(true)
  });
  
  return schema.validate(data);
};

// Helper validators
exports.validateObjectId = (id) => {
  return Joi.string().hex().length(24).validate(id);
};

exports.validatePagination = (data) => {
  const schema = Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20),
    sort: Joi.string()
      .pattern(/^-?\w+$/)
      .default('-createdAt')
  });
  
  return schema.validate(data);
};