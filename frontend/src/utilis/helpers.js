// Sort array of objects by key
export const sortByKey = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}; (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    
    try {
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch (error) {
      document.body.removeChild(textArea);
      return false;
    }
  }
};

// Get file extension
export const getFileExtension = (filename) => {
  const parts = filename.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

// Check if file is video
export const isVideoFile = (filename) => {
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'mpg', 'mpeg'];
  const ext = getFileExtension(filename);
  return videoExtensions.includes(ext);
};

// Check if file is audio
export const isAudioFile = (filename) => {
  const audioExtensions = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'wma', 'm4a', 'opus'];
  const ext = getFileExtension(filename);
  return audioExtensions.includes(ext);
};

// Truncate text with ellipsis
export const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Sort array of objects by key
export const sortByKey = (array, key, order = 'asc') => {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Format download speed
export const formatSpeed = (bytesPerSecond) => {
  if (!bytesPerSecond || bytesPerSecond === 0) return '0 B/s';
  return `${formatSize(bytesPerSecond)}/s`;
};

// Format time duration in seconds to human-readable format
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

// Extract filename from magnet link
export const extractNameFromMagnet = (magnetLink) => {
  try {
    const match = magnetLink.match(/dn=([^&]+)/);
    if (match) {
      return decodeURIComponent(match[1].replace(/\+/g, ' '));
    }
  } catch (error) {
    console.error('Error extracting name from magnet:', error);
  }
  return 'Unknown';
};

// Validate magnet link format
export const isValidMagnetLink = (magnetLink) => {
  return /^magnet:\?xt=urn:btih:[a-fA-F0-9]{40}/.test(magnetLink);
};

// Generate color from string (for user avatars, etc.)
export const stringToColor = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 50%)`;
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.// Format file size from bytes to human-readable format
export const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
};

// Format download speed
export const formatSpeed = (bytesPerSecond) => {
  if (!bytesPerSecond || bytesPerSecond === 0) return '0 B/s';
  return `${formatSize(bytesPerSecond)}/s`;
};

// Format time duration in seconds to human-readable format
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0s';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);
  
  return parts.join(' ');
};

// Extract filename from magnet link
export const extractNameFromMagnet = (magnetLink) => {
  try {
    const match// Format file size from bytes to human-readable format
export const formatSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${(bytes / Math.pow(1024, i