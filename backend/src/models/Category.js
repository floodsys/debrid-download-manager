const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    unique: true,
    trim: true,
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    maxlength: [200, 'Description cannot exceed 200 characters'],
    trim: true
  },
  icon: {
    type: String,
    default: 'folder',
    trim: true
  },
  color: {
    type: String,
    default: '#667eea',
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Please provide a valid hex color']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  autoMatch: {
    enabled: {
      type: Boolean,
      default: false
    },
    patterns: [{
      type: String,
      trim: true
    }],
    priority: {
      type: Number,
      default: 0
    }
  },
  stats: {
    totalDownloads: {
      type: Number,
      default: 0
    },
    totalSize: {
      type: Number,
      default: 0
    },
    lastUsed: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1 });
categorySchema.index({ 'autoMatch.enabled': 1, 'autoMatch.priority': -1 });

// Pre-save middleware
categorySchema.pre('save', function(next) {
  // Generate slug from name if not provided
  if (this.isModified('name') && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-')     // Replace spaces with hyphens
      .replace(/-+/g, '-')      // Replace multiple hyphens with single hyphen
      .trim();
  }
  next();
});

// Methods
categorySchema.methods.matchesFile = function(filename) {
  if (!this.autoMatch.enabled || !this.autoMatch.patterns.length) {
    return false;
  }
  
  const lowerFilename = filename.toLowerCase();
  
  return this.autoMatch.patterns.some(pattern => {
    try {
      const regex = new RegExp(pattern, 'i');
      return regex.test(lowerFilename);
    } catch (error) {
      // Invalid regex pattern
      console.error(`Invalid regex pattern in category ${this.name}: ${pattern}`);
      return false;
    }
  });
};

categorySchema.methods.incrementStats = function(size = 0) {
  this.stats.totalDownloads += 1;
  this.stats.totalSize += size;
  this.stats.lastUsed = new Date();
  return this.save();
};

// Static methods
categorySchema.statics.findBySlug = function(slug) {
  return this.findOne({ slug: slug.toLowerCase(), isActive: true });
};

categorySchema.statics.getDefaultCategory = function() {
  return this.findOne({ isDefault: true, isActive: true });
};

categorySchema.statics.autoDetectCategory = async function(filename) {
  // Find all active categories with auto-match enabled
  const categories = await this.find({
    isActive: true,
    'autoMatch.enabled': true
  }).sort({ 'autoMatch.priority': -1 });
  
  // Check each category's patterns
  for (const category of categories) {
    if (category.matchesFile(filename)) {
      return category;
    }
  }
  
  // Return default category if no match
  return this.getDefaultCategory();
};

categorySchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $match: { isActive: true }
    },
    {
      $lookup: {
        from: 'downloads',
        localField: '_id',
        foreignField: 'category',
        as: 'downloads'
      }
    },
    {
      $project: {
        name: 1,
        slug: 1,
        color: 1,
        icon: 1,
        downloadCount: { $size: '$downloads' },
        totalSize: {
          $sum: '$downloads.size'
        }
      }
    },
    {
      $sort: { downloadCount: -1 }
    }
  ]);
  
  return stats;
};

// Virtual properties
categorySchema.virtual('downloadCount').get(function() {
  return this.stats.totalDownloads || 0;
});

module.exports = mongoose.model('Category', categorySchema);