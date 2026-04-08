const mongoose = require('mongoose');

// Velox Report Model
// Stores generated reports and aggregation snapshots

const reportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  generatedBy: {
    type: String,
    required: true
  },
  filters: {
    startDate: String,
    endDate: String,
    department: String,
    status: String
  },
  data: {
    type: mongoose.Schema.Types.Mixed
  },
  summary: {
    totalUsers: Number,
    totalTransactions: Number,
    totalRevenue: Number
  },
  status: {
    type: String,
    default: 'draft'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Report', reportSchema);
