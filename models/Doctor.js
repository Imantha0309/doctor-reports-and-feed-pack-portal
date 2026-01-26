const mongoose = require('mongoose');

// Doctor Schema
const doctorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Doctor name is required'],
    trim: true,
    minlength: [2, 'Doctor name must be at least 2 characters'],
    maxlength: [50, 'Doctor name cannot exceed 50 characters']
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [25, 'Age must be at least 25'],
    max: [80, 'Age cannot exceed 80']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  specialization: {
    type: String,
    required: [true, 'Specialization is required'],
    enum: [
      'cardiology', 'neurology', 'pediatrics', 'orthopedics', 
      'dermatology', 'psychiatry', 'internal-medicine', 'surgery', 
      'radiology', 'anesthesiology'
    ]
  },
  summary: {
    type: String,
    required: [true, 'Professional summary is required'],
    minlength: [50, 'Professional summary must be at least 50 characters'],
    maxlength: [1000, 'Professional summary cannot exceed 1000 characters']
  },
  licenses: {
    type: String,
    required: [true, 'Licenses/Registrations information is required'],
    maxlength: [2000, 'Licenses information cannot exceed 2000 characters']
  },
  clinicalFocus: {
    type: String,
    required: [true, 'Clinical focus is required'],
    maxlength: [2000, 'Clinical focus cannot exceed 2000 characters']
  },
  affiliations: {
    type: String,
    required: [true, 'Hospital/Clinic affiliations are required'],
    maxlength: [2000, 'Affiliations cannot exceed 2000 characters']
  },
  languages: {
    type: String,
    required: [true, 'Languages are required'],
    maxlength: [500, 'Languages cannot exceed 500 characters']
  },
  contact: {
    type: String,
    required: [true, 'Contact & availability information is required'],
    maxlength: [2000, 'Contact information cannot exceed 2000 characters']
  },
  ratings: {
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0
    }
  },
  profileImage: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for ratings snapshot
doctorSchema.virtual('ratingsSnapshot').get(function() {
  if (this.ratings.totalReviews === 0) {
    return 'No ratings yet';
  }
  return `${this.ratings.averageRating.toFixed(1)}/5.0 (${this.ratings.totalReviews} reviews)`;
});

// Indexes
doctorSchema.index({ specialization: 1 });
doctorSchema.index({ name: 1 });
doctorSchema.index({ email: 1 });
doctorSchema.index({ 'ratings.averageRating': -1 });
doctorSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Doctor', doctorSchema);
