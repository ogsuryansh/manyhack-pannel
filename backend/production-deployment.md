# Production Deployment Configuration

## Environment Variables Required

Set these environment variables in your production environment:

```bash
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/manyhackpanel

# Session Secret (generate a strong random string)
SESSION_SECRET=your-super-secret-session-key-here

# Frontend URL
FRONTEND_URL=https://gaminggarage.store

# Admin Credentials
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-admin-password

# Environment
NODE_ENV=production
```

## CORS Configuration

The backend is configured to allow:
- `https://gaminggarage.store`
- `https://www.gaminggarage.store`
- `http://localhost:3000` (for development)

## Session Configuration

- Sessions are stored in MongoDB
- Cookies are secure in production
- SameSite is set to 'none' for cross-origin cookies
- Sessions expire after 7 days

## Security Features

1. **Device-based Security**: Users can only be logged in on one device at a time
2. **Session Management**: Server-side session storage with automatic cleanup
3. **CORS Protection**: Configured for your specific domains
4. **Secure Cookies**: HttpOnly, secure, same-site protection

## Deployment Checklist

- [ ] Set all environment variables
- [ ] Ensure MongoDB is accessible
- [ ] Verify CORS origins match your domains
- [ ] Test admin login functionality
- [ ] Test user registration and login
- [ ] Verify device security works (login from different devices)









