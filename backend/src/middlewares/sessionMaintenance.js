// Session maintenance middleware to prevent session corruption
module.exports = (req, res, next) => {
  try {
    // Only apply to admin routes
    if (req.url.includes('/admin/') && req.session) {
      console.log('🔧 Session maintenance for admin route:', req.url);
      
      // Ensure session is properly maintained
      req.session.touch(); // Mark session as modified
      req.session.lastAccess = new Date(); // Update last access time
      
      // Add session health check
      if (!req.session.userId) {
        console.log('❌ Session corrupted - no userId found');
        return res.status(401).json({ 
          message: "Session corrupted - please log in again",
          code: "SESSION_CORRUPTED"
        });
      }
      
      // Ensure admin session integrity
      if (req.session.userId === 'admin' && !req.session.isAdmin) {
        console.log('🔧 Fixing admin session - setting isAdmin flag');
        req.session.isAdmin = true;
      }
      
      console.log('✅ Session maintained successfully');
    }
    
    next();
  } catch (error) {
    console.error('Session maintenance error:', error);
    next(); // Continue even if maintenance fails
  }
};
