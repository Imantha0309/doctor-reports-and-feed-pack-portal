const mongoose = require('mongoose');

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
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
    required: false // Make optional for general feedbacks
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  text: {
    type: String,
    required: false // Make optional, we'll use 'about' field
  },
  about: {
    type: String,
    required: [true, 'Feedback content is required'],
    minlength: [10, 'Feedback content must be at least 10 characters'],
    maxlength: [1000, 'Feedback content cannot exceed 1000 characters']
  },
  sickness: {
    type: String,
    required: false
  },
  date: {
    type: Date,
    default: Date.now,
    validate: {
      validator: function(value) {
        return value <= new Date();
      },
      message: 'Date cannot be in the future'
    }
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved'
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional for public feedbacks
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for formatted date
feedbackSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for star rating
feedbackSchema.virtual('starRating').get(function() {
  return '★'.repeat(this.rating) + '☆'.repeat(5 - this.rating);
});

// Indexes
feedbackSchema.index({ patientName: 1 });
feedbackSchema.index({ doctor: 1 });
feedbackSchema.index({ rating: 1 });
feedbackSchema.index({ date: -1 });
feedbackSchema.index({ status: 1 });
feedbackSchema.index({ createdBy: 1 });
feedbackSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Feedback', feedbackSchema);
