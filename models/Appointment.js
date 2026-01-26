const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  patient: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ['male', 'female', 'other'], required: true }
  },
  doctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Doctor', 
    required: true 
  },
  appointmentDate: { 
    type: Date, 
    required: true 
  },
  appointmentTime: { 
    type: String, 
    required: true 
  },
  duration: { 
    type: Number, 
    default: 30 
  },
  status: { 
    type: String, 
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'], 
    default: 'scheduled' 
  },
  appointmentType: { 
    type: String, 
    enum: ['consultation', 'follow-up', 'emergency', 'routine-checkup'], 
    default: 'consultation' 
  },
  reason: { 
    type: String, 
    required: true 
  },
  notes: { 
    type: String 
  },
  prescription: { 
    type: String 
  },
  diagnosis: { 
    type: String 
  },
  followUpRequired: { 
    type: Boolean, 
    default: false 
  },
  followUpDate: { 
    type: Date 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Update the updatedAt field before saving
AppointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
AppointmentSchema.index({ doctor: 1, appointmentDate: 1 });
AppointmentSchema.index({ 'patient.email': 1 });
AppointmentSchema.index({ status: 1 });

module.exports = mongoose.model('Appointment', AppointmentSchema);
