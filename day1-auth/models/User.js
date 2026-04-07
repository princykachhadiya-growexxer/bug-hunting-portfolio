const mongoose = require('mongoose');

// Velox User Model
// Created by AI assistant - reviewed by dev team

const addressSchema = new mongoose.Schema({
  street: { type: String },
  city: { type: String },
  country: { type: String, default: 'IN' },
  pincode: { type: String }
});

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    default: 'user'
  },
  phone: {
    type: String
  },
  address: addressSchema,
  isActive: {
    type: Boolean,
    default: true
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  resetToken: {
    type: String
  },
  resetTokenExpiry: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: String,
    default: new Date().toISOString()
  }
});

// Instance method to check password
userSchema.methods.comparePassword = function (candidatePassword) {
  return this.password === candidatePassword;
};

// Instance method to get safe user object
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    password: this.password
  };
};

// Static method to find active users
userSchema.statics.findActive = function () {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', userSchema);
