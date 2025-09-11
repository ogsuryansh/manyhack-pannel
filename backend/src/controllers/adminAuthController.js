const { getDeviceInfo } = require('../utils/deviceUtils');
const Session = require('../models/Session');

exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Get device information
      const deviceInfo = getDeviceInfo(req);
      
      // Create admin session
      const newSession = new Session({
        sessionId: deviceInfo.sessionId,
        userId: 'admin', // Special admin user ID
        deviceFingerprint: deviceInfo.deviceFingerprint,
        userAgent: deviceInfo.userAgent,
        ipAddress: deviceInfo.ipAddress
      });
      await newSession.save();

      // Store admin info in session
      req.session.userId = 'admin';
      req.session.sessionId = deviceInfo.sessionId;
      req.session.deviceFingerprint = deviceInfo.deviceFingerprint;
      req.session.isAdmin = true;
      
      return res.json({
        message: "Admin login successful",
        admin: { 
          id: 'admin',
          username, 
          isAdmin: true 
        }
      });
    }
    return res.status(401).json({ message: "Invalid admin credentials" });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: "Server error" });
  }
};

// Admin logout
exports.adminLogout = async (req, res) => {
  try {
    const sessionId = req.session.sessionId;
    
    if (sessionId) {
      // Mark session as inactive
      await Session.findOneAndUpdate(
        { sessionId: sessionId },
        { isActive: false, logoutTime: new Date() }
      );
    }
    
    // Destroy session
    req.session.destroy((err) => {
      if (err) {
        console.error('Admin session destruction error:', err);
        return res.status(500).json({ message: "Server error" });
      }
      res.json({ message: "Admin logged out successfully" });
    });
  } catch (err) {
    console.error('Admin logout error:', err);
    res.status(500).json({ message: "Server error" });
  }
};