const express = require('express');
const { check, validationResult } = require('express-validator');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/appointments
// @desc    Get all appointments
// @access  Private (Admin/Doctor)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, doctor, date } = req.query;
    const query = {};

    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      query.appointmentDate = { $gte: startDate, $lt: endDate };
    }

    const appointments = await Appointment.find(query)
      .populate('doctor', 'name specialization email')
      .sort({ appointmentDate: 1, appointmentTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Appointment.countDocuments(query);

    res.json({
      success: true,
      data: appointments,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private (Admin/Doctor/Patient)
router.get('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctor', 'name specialization email');

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    res.json({ success: true, data: appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   POST /api/appointments
// @desc    Create new appointment
// @access  Private (Admin/Doctor) or Public (Patient booking)
router.post('/', [
  check('patient.name', 'Patient name is required').not().isEmpty(),
  check('patient.email', 'Please include a valid email').isEmail(),
  check('patient.phone', 'Phone number is required').not().isEmpty(),
  check('patient.age', 'Age is required').isInt({ min: 0, max: 120 }),
  check('patient.gender', 'Gender is required').isIn(['male', 'female', 'other']),
  check('doctor', 'Doctor ID is required').isMongoId(),
  check('appointmentDate', 'Appointment date is required').isISO8601().toDate(),
  check('appointmentTime', 'Appointment time is required').not().isEmpty(),
  check('reason', 'Reason for appointment is required').not().isEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const {
    patient,
    doctor,
    appointmentDate,
    appointmentTime,
    duration,
    appointmentType,
    reason,
    notes
  } = req.body;

  try {
    // Check if doctor exists
    const doctorExists = await Doctor.findById(doctor);
    if (!doctorExists) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    // Check for conflicting appointments
    const conflictingAppointment = await Appointment.findOne({
      doctor,
      appointmentDate,
      appointmentTime,
      status: { $in: ['scheduled', 'confirmed'] }
    });

    if (conflictingAppointment) {
      return res.status(400).json({ 
        success: false, 
        message: 'Time slot is already booked. Please choose another time.' 
      });
    }

    const newAppointment = new Appointment({
      patient,
      doctor,
      appointmentDate,
      appointmentTime,
      duration: duration || 30,
      appointmentType: appointmentType || 'consultation',
      reason,
      notes
    });

    await newAppointment.save();
    await newAppointment.populate('doctor', 'name specialization email');

    res.status(201).json({ 
      success: true, 
      message: 'Appointment scheduled successfully', 
      data: newAppointment 
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   PUT /api/appointments/:id
// @desc    Update appointment
// @access  Private (Admin/Doctor)
router.put('/:id', auth, async (req, res) => {
  const {
    patient,
    appointmentDate,
    appointmentTime,
    duration,
    status,
    appointmentType,
    reason,
    notes,
    prescription,
    diagnosis,
    followUpRequired,
    followUpDate
  } = req.body;

  const appointmentFields = {};
  if (patient) appointmentFields.patient = patient;
  if (appointmentDate) appointmentFields.appointmentDate = appointmentDate;
  if (appointmentTime) appointmentFields.appointmentTime = appointmentTime;
  if (duration) appointmentFields.duration = duration;
  if (status) appointmentFields.status = status;
  if (appointmentType) appointmentFields.appointmentType = appointmentType;
  if (reason) appointmentFields.reason = reason;
  if (notes) appointmentFields.notes = notes;
  if (prescription) appointmentFields.prescription = prescription;
  if (diagnosis) appointmentFields.diagnosis = diagnosis;
  if (followUpRequired !== undefined) appointmentFields.followUpRequired = followUpRequired;
  if (followUpDate) appointmentFields.followUpDate = followUpDate;

  try {
    let appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { $set: appointmentFields },
      { new: true, runValidators: true }
    ).populate('doctor', 'name specialization email');

    res.json({ success: true, message: 'Appointment updated successfully', data: appointment });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   DELETE /api/appointments/:id
// @desc    Delete appointment
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Appointment deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/appointments/doctor/:doctorId/availability
// @desc    Get doctor availability for a specific date
// @access  Public
router.get('/doctor/:doctorId/availability', async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date parameter is required' });
    }

    const appointmentDate = new Date(date);
    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const bookedSlots = await Appointment.find({
      doctor: doctorId,
      appointmentDate: { $gte: startOfDay, $lte: endOfDay },
      status: { $in: ['scheduled', 'confirmed'] }
    }).select('appointmentTime');

    // Generate available time slots (9 AM to 5 PM, 30-minute intervals)
    const availableSlots = [];
    const startHour = 9;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const isBooked = bookedSlots.some(slot => slot.appointmentTime === timeString);
        
        if (!isBooked) {
          availableSlots.push(timeString);
        }
      }
    }

    res.json({ success: true, data: availableSlots });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/appointments/stats
// @desc    Get appointment statistics
// @access  Private (Admin/Dashboard)
router.get('/stats', auth, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    let startDate = new Date();
    if (period === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (period === '90d') {
      startDate.setDate(startDate.getDate() - 90);
    }

    const stats = await Appointment.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          scheduledAppointments: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
          confirmedAppointments: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          completedAppointments: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelledAppointments: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      totalAppointments: 0,
      scheduledAppointments: 0,
      confirmedAppointments: 0,
      completedAppointments: 0,
      cancelledAppointments: 0
    };

    res.json({ success: true, data: result });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
