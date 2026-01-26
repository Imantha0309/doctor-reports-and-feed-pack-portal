const express = require('express');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Report = require('../models/Report');
const Feedback = require('../models/Feedback');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/search/global
// @desc    Global search across all entities
// @access  Private
router.get('/global', auth, async (req, res) => {
  try {
    const { q, type, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        success: false, 
        message: 'Search query must be at least 2 characters long' 
      });
    }

    const searchQuery = q.trim();
    const results = {
      users: [],
      doctors: [],
      reports: [],
      feedbacks: [],
      appointments: []
    };

    // Search Users
    if (!type || type === 'users') {
      const users = await User.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { phone: { $regex: searchQuery, $options: 'i' } }
        ],
        isActive: true
      })
      .select('-password')
      .limit(parseInt(limit))
      .sort({ name: 1 });
      
      results.users = users;
    }

    // Search Doctors
    if (!type || type === 'doctors') {
      const doctors = await Doctor.find({
        $or: [
          { name: { $regex: searchQuery, $options: 'i' } },
          { specialization: { $regex: searchQuery, $options: 'i' } },
          { email: { $regex: searchQuery, $options: 'i' } },
          { professionalSummary: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .limit(parseInt(limit))
      .sort({ name: 1 });
      
      results.doctors = doctors;
    }

    // Search Reports
    if (!type || type === 'reports') {
      const reports = await Report.find({
        $or: [
          { patientName: { $regex: searchQuery, $options: 'i' } },
          { reportTitle: { $regex: searchQuery, $options: 'i' } },
          { summary: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .populate('doctor', 'name specialization')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
      results.reports = reports;
    }

    // Search Feedbacks
    if (!type || type === 'feedbacks') {
      const feedbacks = await Feedback.find({
        $or: [
          { patientName: { $regex: searchQuery, $options: 'i' } },
          { about: { $regex: searchQuery, $options: 'i' } },
          { sickness: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .populate('doctor', 'name specialization')
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
      
      results.feedbacks = feedbacks;
    }

    // Search Appointments
    if (!type || type === 'appointments') {
      const appointments = await Appointment.find({
        $or: [
          { 'patient.name': { $regex: searchQuery, $options: 'i' } },
          { 'patient.email': { $regex: searchQuery, $options: 'i' } },
          { reason: { $regex: searchQuery, $options: 'i' } },
          { notes: { $regex: searchQuery, $options: 'i' } }
        ]
      })
      .populate('doctor', 'name specialization')
      .limit(parseInt(limit))
      .sort({ appointmentDate: -1 });
      
      results.appointments = appointments;
    }

    // Calculate total results
    const totalResults = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);

    res.json({
      success: true,
      query: searchQuery,
      totalResults,
      results
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// @route   GET /api/search/advanced
// @desc    Advanced search with filters
// @access  Private
router.get('/advanced', auth, async (req, res) => {
  try {
    const {
      entity,
      searchTerm,
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10
    } = req.query;

    if (!entity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Entity type is required' 
      });
    }

    const parsedFilters = typeof filters === 'string' ? JSON.parse(filters) : filters;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = {};
    let model;
    let populateFields = '';

    // Build query based on entity type
    switch (entity) {
      case 'users':
        model = User;
        query = buildUserQuery(searchTerm, parsedFilters);
        break;
      case 'doctors':
        model = Doctor;
        query = buildDoctorQuery(searchTerm, parsedFilters);
        break;
      case 'reports':
        model = Report;
        query = buildReportQuery(searchTerm, parsedFilters);
        populateFields = 'doctor';
        break;
      case 'feedbacks':
        model = Feedback;
        query = buildFeedbackQuery(searchTerm, parsedFilters);
        populateFields = 'doctor';
        break;
      case 'appointments':
        model = Appointment;
        query = buildAppointmentQuery(searchTerm, parsedFilters);
        populateFields = 'doctor';
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid entity type' 
        });
    }

    // Execute search
    let queryBuilder = model.find(query);
    
    if (populateFields) {
      queryBuilder = queryBuilder.populate(populateFields, 'name specialization email');
    }

    const results = await queryBuilder
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await model.countDocuments(query);

    res.json({
      success: true,
      data: results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit)
      },
      filters: parsedFilters,
      sortBy,
      sortOrder
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// Helper functions to build queries
function buildUserQuery(searchTerm, filters) {
  const query = { isActive: true };

  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { phone: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  if (filters.userType) {
    query.userType = filters.userType;
  }

  if (filters.isEmailVerified !== undefined) {
    query.isEmailVerified = filters.isEmailVerified;
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    query.createdAt = {
      $gte: new Date(start),
      $lte: new Date(end)
    };
  }

  return query;
}

function buildDoctorQuery(searchTerm, filters) {
  const query = {};

  if (searchTerm) {
    query.$or = [
      { name: { $regex: searchTerm, $options: 'i' } },
      { specialization: { $regex: searchTerm, $options: 'i' } },
      { email: { $regex: searchTerm, $options: 'i' } },
      { professionalSummary: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  if (filters.specialization) {
    query.specialization = { $regex: filters.specialization, $options: 'i' };
  }

  if (filters.ageRange) {
    const { min, max } = filters.ageRange;
    query.age = { $gte: min, $lte: max };
  }

  if (filters.ratingRange) {
    const { min, max } = filters.ratingRange;
    query.ratingsSnapshot = { $gte: min, $lte: max };
  }

  return query;
}

function buildReportQuery(searchTerm, filters) {
  const query = {};

  if (searchTerm) {
    query.$or = [
      { patientName: { $regex: searchTerm, $options: 'i' } },
      { reportTitle: { $regex: searchTerm, $options: 'i' } },
      { summary: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  if (filters.doctor) {
    query.doctor = filters.doctor;
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    query.dateTime = {
      $gte: new Date(start),
      $lte: new Date(end)
    };
  }

  return query;
}

function buildFeedbackQuery(searchTerm, filters) {
  const query = {};

  if (searchTerm) {
    query.$or = [
      { patientName: { $regex: searchTerm, $options: 'i' } },
      { about: { $regex: searchTerm, $options: 'i' } },
      { sickness: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  if (filters.doctor) {
    query.doctor = filters.doctor;
  }

  if (filters.rating) {
    query.rating = parseInt(filters.rating);
  }

  if (filters.ratingRange) {
    const { min, max } = filters.ratingRange;
    query.rating = { $gte: min, $lte: max };
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    query.createdAt = {
      $gte: new Date(start),
      $lte: new Date(end)
    };
  }

  return query;
}

function buildAppointmentQuery(searchTerm, filters) {
  const query = {};

  if (searchTerm) {
    query.$or = [
      { 'patient.name': { $regex: searchTerm, $options: 'i' } },
      { 'patient.email': { $regex: searchTerm, $options: 'i' } },
      { reason: { $regex: searchTerm, $options: 'i' } },
      { notes: { $regex: searchTerm, $options: 'i' } }
    ];
  }

  if (filters.doctor) {
    query.doctor = filters.doctor;
  }

  if (filters.status) {
    query.status = filters.status;
  }

  if (filters.appointmentType) {
    query.appointmentType = filters.appointmentType;
  }

  if (filters.dateRange) {
    const { start, end } = filters.dateRange;
    query.appointmentDate = {
      $gte: new Date(start),
      $lte: new Date(end)
    };
  }

  return query;
}

// @route   GET /api/search/suggestions
// @desc    Get search suggestions
// @access  Private
router.get('/suggestions', auth, async (req, res) => {
  try {
    const { q, type, limit = 5 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const searchQuery = q.trim();
    const suggestions = [];

    // Get suggestions based on type
    switch (type) {
      case 'users':
        const users = await User.find({
          name: { $regex: searchQuery, $options: 'i' },
          isActive: true
        })
        .select('name email')
        .limit(parseInt(limit));
        
        suggestions.push(...users.map(user => ({
          type: 'user',
          id: user._id,
          text: user.name,
          subtitle: user.email
        })));
        break;

      case 'doctors':
        const doctors = await Doctor.find({
          name: { $regex: searchQuery, $options: 'i' }
        })
        .select('name specialization')
        .limit(parseInt(limit));
        
        suggestions.push(...doctors.map(doctor => ({
          type: 'doctor',
          id: doctor._id,
          text: doctor.name,
          subtitle: doctor.specialization
        })));
        break;

      case 'specializations':
        const specializations = await Doctor.distinct('specialization', {
          specialization: { $regex: searchQuery, $options: 'i' }
        });
        
        suggestions.push(...specializations.slice(0, parseInt(limit)).map(spec => ({
          type: 'specialization',
          text: spec,
          subtitle: 'Medical Specialization'
        })));
        break;
    }

    res.json({ success: true, suggestions });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;
