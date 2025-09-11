const crypto = require('crypto');

/**
 * Generate a device fingerprint based on user agent and IP
 * @param {string} userAgent - User agent string
 * @param {string} ipAddress - IP address
 * @returns {string} - Device fingerprint
 */
function generateDeviceFingerprint(userAgent, ipAddress) {
  const combined = `${userAgent}-${ipAddress}`;
  return crypto.createHash('sha256').update(combined).digest('hex').substring(0, 32);
}

/**
 * Generate a unique session ID
 * @returns {string} - Session ID
 */
function generateSessionId() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Extract IP address from request
 * @param {Object} req - Express request object
 * @returns {string} - IP address
 */
function getClientIP(req) {
  return req.ip || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress ||
         (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
         req.headers['x-forwarded-for']?.split(',')[0] ||
         '127.0.0.1';
}

/**
 * Get device information from request
 * @param {Object} req - Express request object
 * @returns {Object} - Device information
 */
function getDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress = getClientIP(req);
  const deviceFingerprint = generateDeviceFingerprint(userAgent, ipAddress);
  const sessionId = generateSessionId();
  
  return {
    sessionId,
    deviceFingerprint,
    userAgent,
    ipAddress
  };
}

module.exports = {
  generateDeviceFingerprint,
  generateSessionId,
  getClientIP,
  getDeviceInfo
};
