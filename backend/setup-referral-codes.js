require("dotenv").config();
const mongoose = require("mongoose");
const ReferralCode = require("./src/models/ReferralCode");
const User = require("./src/models/User");

async function setupReferralCodes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find an admin user to be the creator
    const adminUser = await User.findOne({ isAdmin: true });
    if (!adminUser) {
      console.log("No admin user found. Please create an admin user first.");
      return;
    }

    // Create some sample referral codes
    const sampleCodes = [
      {
        code: "WELCOME2024",
        description: "Welcome code for new users",
        maxUsage: 100,
        isActive: true,
        createdBy: adminUser._id
      },
      {
        code: "GAMING",
        description: "Gaming community referral",
        maxUsage: 50,
        isActive: true,
        createdBy: adminUser._id
      },
      {
        code: "VIP",
        description: "VIP member referral",
        maxUsage: 25,
        isActive: true,
        createdBy: adminUser._id
      },
      {
        code: "BETA",
        description: "Beta tester referral",
        maxUsage: null, // unlimited
        isActive: true,
        createdBy: adminUser._id
      }
    ];

    // Check if codes already exist
    for (const codeData of sampleCodes) {
      const existing = await ReferralCode.findOne({ code: codeData.code });
      if (!existing) {
        await ReferralCode.create(codeData);
        console.log(`Created referral code: ${codeData.code}`);
      } else {
        console.log(`Referral code already exists: ${codeData.code}`);
      }
    }

    console.log("Referral codes setup completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error setting up referral codes:", error);
    process.exit(1);
  }
}

setupReferralCodes();
