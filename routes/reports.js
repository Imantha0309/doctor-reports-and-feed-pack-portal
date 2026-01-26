const express = require('express');
const { body, validationResult } = require('express-validator');
const Report = require('../models/Report');
const Doctor = require('../models/Doctor');
const auth = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateReport = [
  body('patientName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Patient name must be between 2 and 50 characters'),
  body('doctor')
    .isMongoId()
    .withMessage('Please provide a valid doctor ID'),
  body('title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Report title must be between 5 and 100 characters'),
  body('summary')
    .isLength({ min: 20, max: 2000 })
    .withMessage('Summary must be between 20 and 2000 characters'),
  body('dateTime')
    .isISO8601()
    .withMessage('Please provide a valid date and time')
];

// @route   GET /api/reports
// @desc    Get all reports with pagination and filtering
// @access  Private
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const doctor = req.query.doctor || '';
    const sortBy = req.query.sortBy || 'dateTime';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { patientName: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (doctor) {
      query.doctor = doctor;
    }

    // Execute query
    const reports = await Report.find(query)
      .populate('doctor', 'name specialization')
      .populate('createdBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(limit);

    const total = await Report.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: reports,
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
    console.error('Get reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reports'
    });
  }
});

// @route   GET /api/reports/count
// @desc    Get report count
// @access  Private
router.get('/count', async (req, res) => {
  try {
    const count = await Report.countDocuments();

    res.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Get report count error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report count'
    });
  }
});

// @route   GET /api/reports/timeseries
// @desc    Get reports time series data
// @access  Private
router.get('/timeseries', async (req, res) => {
  try {
    const range = req.query.range || '30d';
    let days = 30;
    
    if (range === '7d') days = 7;
    else if (range === '90d') days = 90;
    else if (range === '365d') days = 365;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const timeSeriesData = await Report.aggregate([
      {
        $match: {
          dateTime: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$dateTime' },
            month: { $month: '$dateTime' },
            day: { $dayOfMonth: '$dateTime' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format data for charts
    const labels = [];
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      labels.push(dateStr);
      
      const dayData = timeSeriesData.find(item => 
        item._id.year === date.getFullYear() &&
        item._id.month === date.getMonth() + 1 &&
        item._id.day === date.getDate()
      );
      
      data.push(dayData ? dayData.count : 0);
    }

    res.json({
      success: true,
      data: {
        labels,
        data
      }
    });
  } catch (error) {
    console.error('Get reports time series error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching time series data'
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get report by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('doctor', 'name specialization email')
      .populate('createdBy', 'name email');
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching report'
    });
  }
});

// @route   POST /api/reports
// @desc    Create new report
// @access  Private
router.post('/', auth, validateReport, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { patientName, doctor, title, summary, dateTime } = req.body;

    // Verify doctor exists
    const doctorExists = await Doctor.findById(doctor);
    if (!doctorExists) {
      return res.status(400).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    const report = new Report({
      patientName,
      doctor,
      title,
      summary,
      dateTime: new Date(dateTime),
      createdBy: req.user.id
    });

    await report.save();

    // Populate the created report
    await report.populate([
      { path: 'doctor', select: 'name specialization' },
      { path: 'createdBy', select: 'name email' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Create report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating report'
    });
  }
});

// @route   PUT /api/reports/:id
// @desc    Update report
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { patientName, doctor, title, summary, dateTime, status } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update fields
    if (patientName) report.patientName = patientName;
    if (doctor) report.doctor = doctor;
    if (title) report.title = title;
    if (summary) report.summary = summary;
    if (dateTime) report.dateTime = new Date(dateTime);
    if (status) report.status = status;

    await report.save();

    res.json({
      success: true,
      message: 'Report updated successfully',
      data: report
    });
  } catch (error) {
    console.error('Update report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating report'
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    await Report.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting report'
    });
  }
});

module.exports = router;
