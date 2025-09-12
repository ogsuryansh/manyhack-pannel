const { getDeviceInfo } = require('../utils/deviceUtils');

exports.adminLogin = async (req, res) => {
  try {
    console.log('=== ADMIN LOGIN DEBUG ===');
    console.log('Request body:', req.body);
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    console.log('Session ID:', req.sessionID);
    console.log('Session exists:', !!req.session);
    console.log('Environment ADMIN_USERNAME:', process.env.ADMIN_USERNAME);
    console.log('Environment ADMIN_PASSWORD:', process.env.ADMIN_PASSWORD ? 'SET' : 'NOT SET');
    console.log('Session secret:', process.env.SESSION_SECRET ? 'SET' : 'NOT SET');
    console.log('========================');
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ message: "Username and password are required" });
    }
    
    console.log('Checking credentials...');
    console.log('Provided username:', username);
    console.log('Expected username:', process.env.ADMIN_USERNAME);
    console.log('Provided password length:', password ? password.length : 0);
    console.log('Expected password length:', process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.length : 0);
    console.log('Credentials match:', username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD);
    
    // Temporary hardcoded check for debugging
    const hardcodedMatch = username === 'manyhack' && password === 'manyhack_123';
    console.log('Hardcoded credentials match:', hardcodedMatch);
    
    if (
      (username === process.env.ADMIN_USERNAME && password === process.env.ADMIN_PASSWORD) ||
      (username === 'manyhack' && password === 'manyhack_123') // Temporary bypass for debugging
    ) {
      // Get device information
      console.log('Getting device info...');
      const deviceInfo = getDeviceInfo(req);
      console.log('Device info:', deviceInfo);
      
      // Note: We don't need to create a custom Session model entry
      // The express-session store will handle the session storage
      console.log('Using express-session store for session management');

      // Store admin info in session
      console.log('\n=== SESSION CREATION DEBUG ===');
      console.log('Session ID before setting data:', req.sessionID);
      console.log('Session exists before setting data:', !!req.session);
      console.log('Session keys before setting data:', req.session ? Object.keys(req.session) : 'No session');
      console.log('Session store exists:', !!req.sessionStore);
      
      console.log('Storing admin info in session...');
      req.session.userId = 'admin';
      req.session.sessionId = deviceInfo.sessionId;
      req.session.deviceFingerprint = deviceInfo.deviceFingerprint;
      req.session.isAdmin = true;
      
      console.log('Session data after setting:', {
        userId: req.session.userId,
        sessionId: req.session.sessionId,
        deviceFingerprint: req.session.deviceFingerprint,
        isAdmin: req.session.isAdmin
      });
      
      // Force session to be marked as modified
      req.session.touch();
      
      // Force session save and wait for completion
      console.log('Saving session to MongoDB...');
      console.log('Session ID before save:', req.sessionID);
      console.log('Session data before save:', JSON.stringify(req.session, null, 2));
      
      // Ensure session is marked as modified
      req.session.regenerate((err) => {
        if (err) {
          console.error('❌ Session regenerate error:', err);
          return res.status(500).json({ message: "Session error" });
        }
        
        // Set session data again after regeneration
        req.session.userId = 'admin';
        req.session.sessionId = deviceInfo.sessionId;
        req.session.deviceFingerprint = deviceInfo.deviceFingerprint;
        req.session.isAdmin = true;
        
        console.log('Session regenerated, data set again:', {
          userId: req.session.userId,
          isAdmin: req.session.isAdmin
        });
        
        // Save the regenerated session
        req.session.save((err) => {
          if (err) {
            console.error('❌ Session save error:', err);
            console.error('Error details:', err.message, err.stack);
            return res.status(500).json({ message: "Session save error" });
          } else {
            console.log('✅ Session saved successfully to MongoDB');
            console.log('Session ID after save:', req.sessionID);
            console.log('Session data after save:', JSON.stringify(req.session, null, 2));
            
            // Send success response
            res.json({
              message: "Admin login successful",
              admin: { 
                id: 'admin',
                username, 
                isAdmin: true 
              }
            });
          }
        });
      });
      
      // Note: Response is sent from within the session.save callback above
    }
    console.log('Invalid credentials - username or password mismatch');
    return res.status(401).json({ message: "Invalid admin credentials" });
  } catch (err) {
    console.error('=== ADMIN LOGIN ERROR ===');
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    console.error('Request body:', req.body);
    console.error('Session ID:', req.sessionID);
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