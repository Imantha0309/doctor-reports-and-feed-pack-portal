const mongoose = require('mongoose');

// Report Schema
const reportSchema = new mongoose.Schema({
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true,
    minlength: [2, 'Patient name must be at least 2 characters'],
    maxlength: [50, 'Patient name cannot exceed 50 characters']
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: [true, 'Doctor is required']
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    minlength: [5, 'Report title must be at least 5 characters'],
    maxlength: [100, 'Report title cannot exceed 100 characters']
  },
  summary: {
    type: String,
    required: [true, 'Summary is required'],
    minlength: [20, 'Summary must be at least 20 characters'],
    maxlength: [2000, 'Summary cannot exceed 2000 characters']
  },
  dateTime: {
    type: Date,
    required: [true, 'Date and time is required'],
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  attachment: {
    filename: {
      type: String,
      default: null
    },
    originalName: {
      type: String,
      default: null
    },
    mimeType: {
      type: String,
      default: null
    },
    size: {
      type: Number,
      default: null
    },
    path: {
      type: String,
      default: null
    }
  },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'completed'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
reportSchema.virtual('formattedDate').get(function() {
  return this.dateTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

// Indexes
reportSchema.index({ patientName: 1 });
reportSchema.index({ doctor: 1 });
reportSchema.index({ dateTime: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ createdBy: 1 });
reportSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema);
