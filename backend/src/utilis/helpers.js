const Category = require('../models/Category');

// Extract name from magnet link
exports.extractNameFromMagnet = (magnetLink) => {
  try {
    const match = magnetLink.match(/dn=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
  } catch (error) {
    console.error('Error extracting name from magnet:', error);
  }
  return 'Unknown Download';
};

// Auto-detect category based on filename
exports.autoDetectCategory = async (filename) => {
  try {
    // Check categories with auto-match enabled
    const categories = await Category.find({ 
      'autoMatch.enabled': true,
      isActive: true 
    }).sort({ 'autoMatch.priority': -1 });
    
    for (const category of categories) {
      if (category.autoMatch.patterns && category.autoMatch.patterns.length > 0) {
        for (const pattern of category.autoMatch.patterns) {
          try {
            const regex = new RegExp(pattern, 'i');
            if (regex.test(filename)) {
              return category._id;
            }
          } catch (error) {
            console.error(`Invalid regex pattern in category ${category.name}: ${pattern}`);
          }
        }
      }
    }
    
    // If no match found, try default patterns
    const lowerName = filename.toLowerCase();
    
    // Movies
    if (lowerName.match(/\.(mkv|mp4|avi|mov|wmv|flv|webm)$/i) || 
        lowerName.includes('1080p') || lowerName.includes('720p') ||
        lowerName.includes('bluray') || lowerName.includes('dvdrip') ||
        lowerName.includes('webrip') || lowerName.includes('brrip')) {
      const movieCat = await Category.findOne({ slug: 'movies' });
      if (movieCat) return movieCat._id;
    }
    
    // TV Shows
    if (lowerName.match(/s\d{2}e\d{2}/i) || lowerName.match(/\dx\d{2}/i) ||
        lowerName.includes('season') || lowerName.includes('episode') ||
        lowerName.includes('complete.series')) {
      const tvCat = await Category.findOne({ slug: 'tv-shows' });
      if (tvCat) return tvCat._id;
    }
    
    // Music
    if (lowerName.match(/\.(mp3|flac|wav|aac|ogg|wma|m4a)$/i) ||
        lowerName.includes('album') || lowerName.includes('discography') ||
        lowerName.includes('soundtrack')) {
      const musicCat = await Category.findOne({ slug: 'music' });
      if (musicCat) return musicCat._id;
    }
    
    // Software
    if (lowerName.match(/\.(exe|msi|dmg|pkg|deb|rpm|appimage)$/i) ||
        lowerName.includes('setup') || lowerName.includes('installer') ||
        lowerName.includes('portable')) {
      const softwareCat = await Category.findOne({ slug: 'software' });
      if (softwareCat) return softwareCat._id;
    }
    
    // Games
    if (lowerName.match(/\.(iso|rar|7z)$/i) && 
        (lowerName.includes('game') || lowerName.includes('goty') || 
         lowerName.includes('repack') || lowerName.includes('codex') ||
         lowerName.includes('plaza') || lowerName.includes('fitgirl'))) {
      const gamesCat = await Category.findOne({ slug: 'games' });
      if (gamesCat) return gamesCat._id;
    }
    
    // Default to 'other' category
    const otherCat = await Category.findOne({ slug: 'other' });
    return otherCat ? otherCat._id : null;
    
  } catch (error) {
    console.error('Error in autoDetectCategory:', error);
    return null;
  }
};

// Format bytes to human readable size
exports.formatBytes = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// Generate random string
exports.generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Sleep helper for async operations
exports.sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// Sanitize filename for safe storage
exports.sanitizeFilename = (filename) => {
  return filename
    .replace(/[^a-z0-9.\-_ ]/gi, '') // Remove special characters
    .replace(/\s+/g, '_')             // Replace spaces with underscores
    .replace(/_{2,}/g, '_')           // Replace multiple underscores with single
    .toLowerCase();
};

// Parse torrent info from Real-Debrid
exports.parseTorrentInfo = (torrentData) => {
  return {
    id: torrentData.id,
    filename: torrentData.filename || torrentData.original_filename,
    size: torrentData.bytes || 0,
    status: torrentData.status,
    progress: torrentData.progress || 0,
    seeders: torrentData.seeders || 0,
    speed: torrentData.speed || 0,
    files: torrentData.files || [],
    links: torrentData.links || [],
    ended: torrentData.ended,
    error: torrentData.error
  };
};