// Session recovery middleware for handling session issues
module.exports = (req, res, next) => {
  // If this is an admin request and session exists but no userId, try to recover
  if (req.url.includes('/admin/') && req.session && !req.session.userId) {
    console.log('🔧 SESSION RECOVERY: Attempting to recover admin session...');
    
    // Check if this might be a valid admin session that got corrupted
    if (req.session.isAdmin === true || req.session.sessionId) {
      console.log('🔧 SESSION RECOVERY: Found potential admin session data, attempting recovery...');
      
      // Try to restore admin session data
      req.session.userId = 'admin';
      req.session.isAdmin = true;
      
      // Save the recovered session
      req.session.save((err) => {
        if (err) {
          console.error('❌ SESSION RECOVERY FAILED:', err);
        } else {
          console.log('✅ SESSION RECOVERY SUCCESS: Admin session restored');
        }
      });
    }
  }
  
  next();
};
