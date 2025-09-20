const rateLimit = require('express-rate-limit');

// Rate limiter for device reset endpoint
const deviceResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many device reset attempts, please try again later.",
    code: "RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    console.log(`[SECURITY] Rate limit exceeded for device reset from IP: ${req.ip || req.connection.remoteAddress}`);
    res.status(429).json({
      error: "Too many device reset attempts, please try again later.",
      code: "RATE_LIMIT_EXCEEDED"
    });
  }
});

// Rate limiter for login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    error: "Too many login attempts, please try again later.",
    code: "LOGIN_RATE_LIMIT_EXCEEDED"
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`[SECURITY] Login rate limit exceeded from IP: ${req.ip || req.connection.remoteAddress}`);
    res.status(429).json({
      error: "Too many login attempts, please try again later.",
      code: "LOGIN_RATE_LIMIT_EXCEEDED"
    });
  }
});

module.exports = {
  deviceResetLimiter,
  loginLimiter
};
