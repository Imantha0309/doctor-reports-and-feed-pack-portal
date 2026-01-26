const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateFeedback = [
  body('patientName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Patient name must be between 2 and 50 characters'),
  body('doctor')
    .optional()
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('about')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Feedback content must be between 10 and 1000 characters')
];

// @route   GET /api/feedbacks
// @desc    Get all feedbacks with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const doctor = req.query.doctor || '';
    const rating = req.query.rating || '';
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = { status: 'approved' };
    
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { about: { $regex: search, $options: 'i' } },
        { sickness: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (doctor) {
      query.doctor = doctor;
    }
    
    if (rating) {
      query.rating = parseInt(rating);
    }

    // Execute query
    const feedbacks = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Feedback.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: feedbacks,
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
    console.error('Get feedbacks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedbacks',
      error: error.message
    });
  }
});

// @route   GET /api/feedbacks/count
// @desc    Get feedback count
// @access  Public
router.get('/count', async (req, res) => {
  try {
    const count = await Feedback.countDocuments({ status: 'approved' });

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get feedback count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback count'
    });
  }
});

// @route   GET /api/feedbacks/recent
// @desc    Get recent feedbacks
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const feedbacks = await Feedback.find({ status: 'approved' })
      // .populate('doctor', 'name specialization') // Temporarily removed due to error
      .sort({ date: -1 })
      .limit(limit);

    res.json({
      success: true,
      data: feedbacks
    });
  } catch (error) {
    console.error('Get recent feedbacks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent feedbacks'
    });
  }
});

// @route   GET /api/feedbacks/top-doctors
// @desc    Get top rated doctors
// @access  Public
router.get('/top-doctors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const topDoctors = await Feedback.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$doctor',
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: '_id',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $unwind: '$doctor'
      },
      {
        $match: { 'doctor.isActive': true }
      },
      {
        $project: {
          name: '$doctor.name',
          specialization: '$doctor.specialization',
          rating: { $round: ['$averageRating', 1] },
          totalReviews: 1
        }
      },
      {
        $sort: { rating: -1, totalReviews: -1 }
      },
      {
        $limit: limit
      }
    ]);

    res.json({
      success: true,
      data: topDoctors
    });
  } catch (error) {
    console.error('Get top doctors error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching top doctors'
    });
  }
});

// @route   GET /api/feedbacks/ratings-distribution
// @desc    Get ratings distribution
// @access  Public
router.get('/ratings-distribution', async (req, res) => {
  try {
    const distribution = await Feedback.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const result = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0
    };

    distribution.forEach(item => {
      result[item._id.toString()] = item.count;
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get ratings distribution error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching ratings distribution'
    });
  }
});

// @route   GET /api/feedbacks/:id
// @desc    Get feedback by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('doctor', 'name specialization');
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    res.json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback'
    });
  }
});

// @route   POST /api/feedbacks
// @desc    Create new feedback
// @access  Public
router.post('/', validateFeedback, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientName, doctor, rating, about, sickness, isAnonymous } = req.body;

    // Verify doctor exists if provided
    if (doctor) {
      const doctorExists = await Doctor.findById(doctor);
      if (!doctorExists) {
        return res.status(400).json({
          success: false,
          message: 'Doctor not found'
        });
      }
    }

    const feedback = new Feedback({
      patientName,
      doctor: doctor || null,
      rating,
      about,
      sickness: sickness || null,
      isAnonymous: isAnonymous || false,
      createdBy: req.user?.id || null
    });

    await feedback.save();

    // Update doctor's average rating
    await updateDoctorRating(doctor);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Create feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating feedback'
    });
  }
});

// @route   PUT /api/feedbacks/:id
// @desc    Update feedback
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { patientName, doctor, rating, text, status } = req.body;
    
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Update fields
    if (patientName) feedback.patientName = patientName;
    if (doctor) feedback.doctor = doctor;
    if (rating) feedback.rating = rating;
    if (text) feedback.text = text;
    if (status) feedback.status = status;

    await feedback.save();

    // Update doctor's average rating if rating changed
    if (rating) {
      await updateDoctorRating(feedback.doctor);
    }

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      data: feedback
    });
  } catch (error) {
    console.error('Update feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating feedback'
    });
  }
});

// @route   DELETE /api/feedbacks/:id
// @desc    Delete feedback
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    await Feedback.findByIdAndDelete(req.params.id);

    // Update doctor's average rating
    await updateDoctorRating(feedback.doctor);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Delete feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting feedback'
    });
  }
});

// Helper function to update doctor's average rating
async function updateDoctorRating(doctorId) {
  try {
    const stats = await Feedback.aggregate([
      {
        $match: { 
          doctor: doctorId,
          status: 'approved'
        }
      },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    if (stats.length > 0) {
      await Doctor.findByIdAndUpdate(doctorId, {
        'ratings.averageRating': Math.round(stats[0].averageRating * 10) / 10,
        'ratings.totalReviews': stats[0].totalReviews
      });
    }
  } catch (error) {
    console.error('Update doctor rating error:', error);
  }
}

module.exports = router;
