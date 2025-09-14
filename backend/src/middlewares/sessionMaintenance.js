// Session maintenance middleware to prevent session corruption
module.exports = (req, res, next) => {
  try {
    // Only apply to admin routes that require authentication (not login/check routes)
    const isAdminRoute = req.url.includes('/admin/');
    const isLoginRoute = req.url.includes('/admin/login');
    const isCheckRoute = req.url.includes('/admin/check');
    const isAuthRoute = isLoginRoute || isCheckRoute;
    
    if (isAdminRoute && !isAuthRoute && req.session && req.session.userId) {
      console.log('🔧 Session maintenance for admin route:', req.url);
      
      // Ensure session is properly maintained
      req.session.touch(); // Mark session as modified
      req.session.lastAccess = new Date(); // Update last access time
      
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
