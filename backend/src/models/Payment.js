const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema({
  // User Information
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  
  // Product Information (for buy_key type)
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  productName: { type: String, default: "N/A" },
  duration: { type: String, default: "N/A" },
  quantity: { type: Number, default: 1 },
  
  // Financial Information
  amount: { type: Number, required: true },
  unitPrice: { type: Number, default: 0 },
  totalPrice: { type: Number, default: 0 },
  
  // Payment Details
  utr: { type: String, default: "N/A" },
  payerName: { type: String, default: "N/A" },
  paymentMethod: { type: String, default: "N/A" },
  
  // Status and Type
  status: { 
    type: String, 
    enum: ["pending", "approved", "rejected"], 
    default: "pending" 
  },
  type: { 
    type: String, 
    enum: ["add_money", "deduct_money", "buy_key", "topup"], 
    required: true 
  },
  
  // Additional Information
  description: { type: String, default: "N/A" },
  notes: { type: String, default: "N/A" },
  
  // Admin Information
  processedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    default: null 
  },
  processedAt: { type: Date },
  
  // Metadata for additional details
  meta: {
    // For buy_key type
    assignedKeyIds: [mongoose.Schema.Types.ObjectId],
    keyExpiryDate: Date,
    
    // For add_money type
    planId: mongoose.Schema.Types.ObjectId,
    credited: Number,
    offer: Object,
    bonus: Number,
    
    // For admin actions
    source: String, // "admin", "user", "system"
    adminId: mongoose.Schema.Types.Mixed, // Can be ObjectId or string for admin
    adminAction: String,
    timestamp: String,
    
    // For topup type
    topupPlan: Object,
    
    // General metadata
    ipAddress: String,
    userAgent: String,
    referrer: String
  },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt field before saving
paymentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Index for better query performance
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ type: 1, status: 1 });
paymentSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Payment", paymentSchema);