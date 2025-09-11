const { getDeviceInfo } = require('../utils/deviceUtils');

exports.adminLogin = async (req, res) => {
  try {
    console.log('=== ADMIN LOGIN DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Environment ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
    console.log('Environment ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET');
    console.log('Session secret:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');
    console.log('========================');
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    if (
      username === process.env.ADMIN_USERNAME &&
      password === process.env.ADMIN_PASSWORD
    ) {
      // Get device information
      console.log('Getting device info...');
      const deviceInfo = getDeviceInfo(req);
      console.log('Device info:', deviceInfo);
      
      // Note: We don't need to create a custom Session model entry
      // The express-session store will handle the session storage
      console.log('Using express-session store for session management');

      // Store admin info in session
      console.log('Storing admin info in session...');
      req.session.userId = 'admin';
      req.session.sessionId = deviceInfo.sessionId;
      req.session.deviceFingerprint = deviceInfo.deviceFingerprint;
      req.session.isAdmin = true;
      
      // Force session save
      req.session.save((err) => {
        if (err) {
          console.error('Session save error:', err);
        } else {
          console.log('Session saved successfully in production');
        }
      });
      
      console.log('Session stored:', req.session);
      
      console.log('Sending success response...');
      return res.json({
        message: "Admin login successful",
        admin: { 
          id: 'admin',
          username, 
          isAdmin: true 
        }
      });
    }
    console.log('Invalid credentials - username or password mismatch');
    return res.status(401).json({ message: "Invalid admin credentials" });
  } catch (err) {
    console.error('=== ADMIN LOGIN ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('========================');
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