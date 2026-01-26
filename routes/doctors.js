const express = require('express');
const { body, validationResult } = require('express-validator');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateDoctor = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Doctor name must be between 2 and 50 characters'),
  body('age')
    .isInt({ min: 25, max: 80 })
    .withMessage('Age must be between 25 and 80'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('specialization')
    .isIn(['cardiology', 'neurology', 'pediatrics', 'orthopedics', 'dermatology', 'psychiatry', 'internal-medicine', 'surgery', 'radiology', 'anesthesiology'])
    .withMessage('Please provide a valid specialization'),
  body('summary')
    .isLength({ min: 50, max: 1000 })
    .withMessage('Professional summary must be between 50 and 1000 characters'),
  body('licenses')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Licenses information must be between 10 and 2000 characters'),
  body('clinicalFocus')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Clinical focus must be between 10 and 2000 characters'),
  body('affiliations')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Affiliations must be between 10 and 2000 characters'),
  body('languages')
    .isLength({ min: 5, max: 500 })
    .withMessage('Languages must be between 5 and 500 characters'),
  body('contact')
    .isLength({ min: 10, max: 2000 })
    .withMessage('Contact information must be between 10 and 2000 characters')
];

// @route   GET /api/doctors
// @desc    Get all doctors with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const specialization = req.query.specialization || '';
    const sortBy = req.query.sortBy || 'name';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = { isActive: true };
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { specialization: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (specialization) {
      query.specialization = specialization;
    }

    // Execute query
    const doctors = await Doctor.find(query)
      .populate('userId', 'name email phone')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Doctor.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: doctors,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctors'
    });
  }
});

// @route   GET /api/doctors/top-rated
// @desc    Get top rated doctors
// @access  Public
router.get('/top-rated', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const doctors = await Doctor.find({ isActive: true })
      .populate('userId', 'name email')
      .sort({ 'ratings.averageRating': -1, 'ratings.totalReviews': -1 })
      .limit(limit);

    res.json({
      success: true,
      data: doctors
    });
  } catch (error) {
    console.error('Get top rated doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top rated doctors'
    });
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate({
        path: 'reports',
        select: 'title summary dateTime',
        options: { sort: { dateTime: -1 }, limit: 5 }
      });
    
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor'
    });
  }
});

// @route   POST /api/doctors
// @desc    Create new doctor
// @access  Private
router.post('/', auth, validateDoctor, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      name, age, email, specialization, summary,
      licenses, clinicalFocus, affiliations, languages, contact
    } = req.body;

    // Check if doctor already exists
    const existingDoctor = await Doctor.findOne({ email });
    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: 'Doctor with this email already exists'
      });
    }

    // Create user account for doctor
    const user = new User({
      name,
      email,
      phone: req.body.phone || '',
      userType: 'doctor',
      password: req.body.password || 'defaultPassword123'
    });

    await user.save();

    // Create doctor profile
    const doctor = new Doctor({
      name,
      age,
      email,
      specialization,
      summary,
      licenses,
      clinicalFocus,
      affiliations,
      languages,
      contact,
      userId: user._id
    });

    await doctor.save();

    res.status(201).json({
      success: true,
      message: 'Doctor created successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating doctor'
    });
  }
});

// @route   PUT /api/doctors/:id
// @desc    Update doctor
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const {
      name, age, email, specialization, summary,
      licenses, clinicalFocus, affiliations, languages, contact
    } = req.body;
    
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Update fields
    if (name) doctor.name = name;
    if (age) doctor.age = age;
    if (email) doctor.email = email;
    if (specialization) doctor.specialization = specialization;
    if (summary) doctor.summary = summary;
    if (licenses) doctor.licenses = licenses;
    if (clinicalFocus) doctor.clinicalFocus = clinicalFocus;
    if (affiliations) doctor.affiliations = affiliations;
    if (languages) doctor.languages = languages;
    if (contact) doctor.contact = contact;

    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor updated successfully',
      data: doctor
    });
  } catch (error) {
    console.error('Update doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating doctor'
    });
  }
});

// @route   DELETE /api/doctors/:id
// @desc    Delete doctor
// @access  Private (Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Soft delete - mark as inactive
    doctor.isActive = false;
    await doctor.save();

    res.json({
      success: true,
      message: 'Doctor deleted successfully'
    });
  } catch (error) {
    console.error('Delete doctor error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting doctor'
    });
  }
});

module.exports = router;
