const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/manyhackpanel');

async function clearSessions() {
  try {
    // Wait for connection
    await mongoose.connection.asPromise();
    
    // Clear all sessions
    const result = await mongoose.connection.db.collection('sessions').deleteMany({});
    console.log('Cleared sessions:', result.deletedCount);
    
    // Also clear any sessions with null sessionId
    const nullResult = await mongoose.connection.db.collection('sessions').deleteMany({ sessionId: null });
    console.log('Cleared null sessionId sessions:', nullResult.deletedCount);
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing sessions:', error);
    process.exit(1);
  }
}

clearSessions();
