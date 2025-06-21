const mongoose = require('mongoose');

const downloadSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  magnetLink: {
    type: String,
    required: [true, 'Magnet link is required'],
    trim: true
  },
  torrentId: {
    type: String,
    index: true,
    sparse: true
  },
  name: {
    type: String,
    required: [true, 'Download name is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  status: {
    type: String,
    enum: ['queued', 'downloading', 'completed', 'error', 'unrestricting', 'paused', 'cancelled'],
    default: 'queued',
    index: true
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  size: {
    type: Number,
    default: 0,
    min: 0
  },
  downloadSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  uploadSpeed: {
    type: Number,
    default: 0,
    min: 0
  },
  seeders: {
    type: Number,
    default: 0,
    min: 0
  },
  peers: {
    type: Number,
    default: 0,
    min: 0
  },
  eta: {
    type: Number, // Estimated time of arrival in seconds
    default: 0
  },
  realDebridData: {
    id: {
      type: String,
      sparse: true
    },
    hash: String,
    links: [{
      type: String
    }],
    unrestrictedLinks: [{
      original: String,
      download: String,
      filename: String,
      filesize: Number,
      mimeType: String,
      host: String,
      chunks: Number,
      crc: Number,
      streamable: Boolean
    }],
    files: [{
      id: Number,
      path: String,
      bytes: Number,
      selected: Boolean
    }],
    originalFilename: String,
    host: String,
    split: Number,
    progress: Number,
    status: String,
    added: Date,
    ended: Date
  },
  error: {
    message: String,
    code: String,
    timestamp: Date,
    details: mongoose.Schema.Types.Mixed
  },
  startedAt: Date,
  completedAt: Date,
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  metadata: {
    source: String,
    quality: String,
    codec: String,
    resolution: String,
    language: String,
    subtitles: [String],
    imdbId: String,
    tmdbId: String,
    year: Number
  },
  stats: {
    downloadTime: Number, // Total download time in seconds
    averageSpeed: Number, // Average download speed in bytes/sec
    peakSpeed: Number,    // Peak download speed in bytes/sec
    retries: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes for performance
downloadSchema.index({ user: 1, status: 1 });
downloadSchema.index({ user: 1, category: 1 });
downloadSchema.index({ user: 1, createdAt: -1 });
downloadSchema.index({ status: 1, createdAt: -1 });
downloadSchema.index({ 'realDebridData.id': 1 });
downloadSchema.index({ completedAt: -1 });

// Virtual properties
downloadSchema.virtual('isActive').get(function() {
  return ['downloading', 'unrestricting'].includes(this.status);
});

downloadSchema.virtual('canRetry').get(function() {
  return ['error', 'cancelled'].includes(this.status);
});

downloadSchema.virtual('humanSize').get(function() {
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  if (this.size === 0) return '0 B';
  const i = Math.floor(Math.log(this.size) / Math.log(1024));
  return (this.size / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
});

// Methods
downloadSchema.methods.updateProgress = function(data) {
  this.progress = data.progress || this.progress;
  this.downloadSpeed = data.speed || 0;
  this.seeders = data.seeders || 0;
  this.peers = data.peers || 0;
  this.eta = data.eta || 0;
  
  if (data.status) {
    this.status = data.status;
  }
  
  return this.save();
};

downloadSchema.methods.markAsError = function(error) {
  this.status = 'error';
  this.error = {
    message: error.message || 'Unknown error',
    code: error.code || 'UNKNOWN',
    timestamp: new Date(),
    details: error.details || {}
  };
  
  if (this.stats) {
    this.stats.retries = (this.stats.retries || 0) + 1;
  }
  
  return this.save();
};

downloadSchema.methods.markAsCompleted = function(links) {
  this.status = 'completed';
  this.progress = 100;
  this.completedAt = new Date();
  
  if (links) {
    this.realDebridData.unrestrictedLinks = links;
  }
  
  // Calculate stats
  if (this.startedAt) {
    const downloadTime = (this.completedAt - this.startedAt) / 1000; // in seconds
    this.stats.downloadTime = downloadTime;
    
    if (this.size && downloadTime > 0) {
      this.stats.averageSpeed = Math.round(this.size / downloadTime);
    }
  }
  
  return this.save();
};

// Middleware
downloadSchema.pre('save', function(next) {
  // Update startedAt when download begins
  if (this.isModified('status') && this.status === 'downloading' && !this.startedAt) {
    this.startedAt = new Date();
  }
  
  // Track peak speed
  if (this.downloadSpeed > 0 && (!this.stats.peakSpeed || this.downloadSpeed > this.stats.peakSpeed)) {
    this.stats.peakSpeed = this.downloadSpeed;
  }
  
  next();
});

// Static methods
downloadSchema.statics.getActiveDownloads = function(userId) {
  return this.find({
    user: userId,
    status: { $in: ['downloading', 'unrestricting'] }
  }).populate('category');
};

downloadSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalSize: { $sum: '$size' }
      }
    }
  ]);
  
  const result = {
    total: 0,
    byStatus: {},
    totalSize: 0
  };
  
  stats.forEach(stat => {
    result.byStatus[stat._id] = stat.count;
    result.total += stat.count;
    result.totalSize += stat.totalSize;
  });
  
  return result;
};

module.exports = mongoose.model('Download', downloadSchema);