const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters'],
    match: [/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  realDebridApiKey: {
    type: String,
    required: function() {
      return this.role !== 'admin';
    },
    trim: true
  },
  downloadQuota: {
    daily: {
      type: Number,
      default: 50,
      min: [0, 'Daily quota cannot be negative'],
      max: [1000, 'Daily quota cannot exceed 1000']
    },
    used: {
      type: Number,
      default: 0,
      min: 0
    },
    resetAt: {
      type: Date,
      default: () => new Date().setHours(24, 0, 0, 0)
    }
  },
  settings: {
    autoCategory: {
      type: Boolean,
      default: true
    },
    notifications: {
      email: {
        type: Boolean,
        default: false
      },
      downloadComplete: {
        type: Boolean,
        default: true
      },
      downloadError: {
        type: Boolean,
        default: true
      }
    },
    defaultCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category'
    }
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true
});

// Virtual for lock status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1, isActive: 1 });

// Pre-save hook to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Reset quota if needed
userSchema.pre('save', function(next) {
  if (this.downloadQuota.resetAt <= new Date()) {
    this.downloadQuota.used = 0;
    this.downloadQuota.resetAt = new Date().setHours(24, 0, 0, 0);
  }
  next();
});

// Methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw error;
  }
};

userSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 attempts for 2 hours
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0, lastLogin: new Date() },
    $unset: { lockUntil: 1 }
  });
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.realDebridApiKey;
  delete obj.loginAttempts;
  delete obj.lockUntil;
  delete obj.__v;
  return obj;
};

userSchema.methods.canDownload = function() {
  // Check if quota needs reset
  if (this.downloadQuota.resetAt <= new Date()) {
    this.downloadQuota.used = 0;
    this.downloadQuota.resetAt = new Date().setHours(24, 0, 0, 0);
    return true;
  }
  
  return this.downloadQuota.used < this.downloadQuota.daily;
};

module.exports = mongoose.model('User', userSchema);