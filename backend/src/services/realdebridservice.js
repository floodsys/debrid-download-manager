const axios = require('axios');

class RealDebridService {
  constructor(apiKey) {
    if (!apiKey) {
      throw new Error('Real-Debrid API key is required');
    }
    
    this.apiKey = apiKey;
    this.baseURL = 'https://api.real-debrid.com/rest/1.0';
    
    // Create axios instance with default config
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds timeout
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error)
    );
  }
  
  // User Methods
  async getUserInfo() {
    const response = await this.client.get('/user');
    return response.data;
  }
  
  // Torrent Methods
  async addMagnet(magnetLink, host = null) {
    const data = new URLSearchParams();
    data.append('magnet', magnetLink);
    
    if (host) {
      data.append('host', host);
    }
    
    const response = await this.client.post('/torrents/addMagnet', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  }
  
  async getTorrentInfo(torrentId) {
    const response = await this.client.get(`/torrents/info/${torrentId}`);
    return response.data;
  }
  
  async getTorrents(offset = 0, limit = 100, filter = null) {
    const params = { offset, limit };
    
    if (filter) {
      params.filter = filter;
    }
    
    const response = await this.client.get('/torrents', { params });
    return response.data;
  }
  
  async selectFiles(torrentId, fileIds = 'all') {
    const data = new URLSearchParams();
    data.append('files', fileIds);
    
    const response = await this.client.post(`/torrents/selectFiles/${torrentId}`, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  }
  
  async deleteTorrent(torrentId) {
    await this.client.delete(`/torrents/delete/${torrentId}`);
    return { success: true };
  }
  
  // Unrestrict Methods
  async unrestrictLink(link, password = null, remote = null) {
    const data = new URLSearchParams();
    data.append('link', link);
    
    if (password) {
      data.append('password', password);
    }
    
    if (remote) {
      data.append('remote', remote);
    }
    
    const response = await this.client.post('/unrestrict/link', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  }
  
  async checkLink(link, password = null) {
    const data = new URLSearchParams();
    data.append('link', link);
    
    if (password) {
      data.append('password', password);
    }
    
    const response = await this.client.post('/unrestrict/check', data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    return response.data;
  }
  
  // Download Methods
  async getDownloads(offset = 0, limit = 100) {
    const response = await this.client.get('/downloads', {
      params: { offset, limit }
    });
    
    return response.data;
  }
  
  async deleteDownload(downloadId) {
    await this.client.delete(`/downloads/delete/${downloadId}`);
    return { success: true };
  }
  
  // Hosts Methods
  async getHosts() {
    const response = await this.client.get('/hosts');
    return response.data;
  }
  
  async getHostsStatus() {
    const response = await this.client.get('/hosts/status');
    return response.data;
  }
  
  async getHostsRegex() {
    const response = await this.client.get('/hosts/regex');
    return response.data;
  }
  
  async getHostsRegexFolder() {
    const response = await this.client.get('/hosts/regexFolder');
    return response.data;
  }
  
  // Traffic Methods
  async getTrafficInfo() {
    const response = await this.client.get('/traffic');
    return response.data;
  }
  
  async getTrafficDetails(start = null, end = null) {
    const params = {};
    
    if (start) {
      params.start = start;
    }
    
    if (end) {
      params.end = end;
    }
    
    const response = await this.client.get('/traffic/details', { params });
    return response.data;
  }
  
  // Streaming Methods
  async getStreamingTranscode(id) {
    const response = await this.client.get(`/streaming/transcode/${id}`);
    return response.data;
  }
  
  async getStreamingMediaInfos(id) {
    const response = await this.client.get(`/streaming/mediaInfos/${id}`);
    return response.data;
  }
  
  // Settings Methods
  async getSettings() {
    const response = await this.client.get('/settings');
    return response.data;
  }
  
  async updateSettings(settings) {
    const response = await this.client.post('/settings/update', settings);
    return response.data;
  }
  
  async convertPoints() {
    const response = await this.client.post('/settings/convertPoints');
    return response.data;
  }
  
  async changePassword(password) {
    const response = await this.client.post('/settings/changePassword', { password });
    return response.data;
  }
  
  async disableAccount() {
    const response = await this.client.post('/disable_access_token');
    return response.data;
  }
  
  // Error handling
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      let errorMessage = 'Real-Debrid API error';
      let errorCode = 'UNKNOWN_ERROR';
      
      // Handle specific error codes
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.error) {
          errorMessage = data.error;
          errorCode = data.error_code || errorCode;
        }
      }
      
      // Map common error codes
      switch (status) {
        case 401:
          errorCode = 'AUTH_ERROR';
          errorMessage = 'Invalid API key or authentication failed';
          break;
        case 403:
          errorCode = 'FORBIDDEN';
          errorMessage = 'Access forbidden - check your account permissions';
          break;
        case 404:
          errorCode = 'NOT_FOUND';
          errorMessage = 'Resource not found';
          break;
        case 429:
          errorCode = 'RATE_LIMIT';
          errorMessage = 'Too many requests - rate limit exceeded';
          break;
        case 503:
          errorCode = 'SERVICE_UNAVAILABLE';
          errorMessage = 'Real-Debrid service is temporarily unavailable';
          break;
      }
      
      const customError = new Error(errorMessage);
      customError.status = status;
      customError.code = errorCode;
      customError.details = data;
      
      throw customError;
    } else if (error.request) {
      // Request was made but no response received
      const customError = new Error('No response from Real-Debrid API');
      customError.code = 'NO_RESPONSE';
      customError.status = 500;
      throw customError;
    } else {
      // Something else happened
      throw error;
    }
  }
  
  // Helper method to check if API key is valid
  async validateApiKey() {
    try {
      await this.getUserInfo();
      return true;
    } catch (error) {
      if (error.code === 'AUTH_ERROR') {
        return false;
      }
      throw error;
    }
  }
  
  // Helper method to get torrent status string
  static getTorrentStatusString(status) {
    const statusMap = {
      'magnet_error': 'Magnet Error',
      'magnet_conversion': 'Converting Magnet',
      'waiting_files_selection': 'Waiting for File Selection',
      'queued': 'Queued',
      'downloading': 'Downloading',
      'downloaded': 'Downloaded',
      'error': 'Error',
      'virus': 'Virus Detected',
      'compressing': 'Compressing',
      'uploading': 'Uploading',
      'dead': 'Dead Torrent'
    };
    
    return statusMap[status] || status;
  }
}

module.exports = RealDebridService;