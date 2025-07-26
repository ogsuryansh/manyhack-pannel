const mongoose = require("mongoose");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const Key = require("./src/models/Key");

async function fixKeys() {
  try {
    console.log("🔍 Checking for keys with missing assignedTo field...");
    
    // Find keys where assignedTo field is missing or undefined
    const keysToFix = await Key.find({
      $or: [
        { assignedTo: { $exists: false } },
        { assignedTo: undefined }
      ]
    });
    
    console.log(`📊 Found ${keysToFix.length} keys that need fixing`);
    
    if (keysToFix.length === 0) {
      console.log("✅ All keys are properly configured!");
      return;
    }
    
    // Update all keys to have assignedTo: null
    const result = await Key.updateMany(
      {
        $or: [
          { assignedTo: { $exists: false } },
          { assignedTo: undefined }
        ]
      },
      { $set: { assignedTo: null } }
    );
    
    console.log(`✅ Fixed ${result.modifiedCount} keys`);
    console.log("🎉 All keys should now be properly available for purchase!");
    
  } catch (error) {
    console.error("❌ Error fixing keys:", error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the fix
fixKeys(); 