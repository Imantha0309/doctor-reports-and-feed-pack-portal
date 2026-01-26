const express = require('express');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Report = require('../models/Report');
const Feedback = require('../models/Feedback');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    // Get counts
    const [
      totalUsers,
      totalDoctors,
      totalReports,
      totalFeedbacks,
      userBreakdown
    ] = await Promise.all([
      User.countDocuments(),
      Doctor.countDocuments({ isActive: true }),
      Report.countDocuments(),
      Feedback.countDocuments({ status: 'approved' }),
      User.aggregate([
        {
          $group: {
            _id: '$userType',
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format user breakdown
    const breakdown = {
      admin: 0,
      doctor: 0,
      user: 0
    };

    userBreakdown.forEach(item => {
      breakdown[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        totalDoctors,
        totalReports,
        totalFeedbacks,
        userBreakdown: breakdown
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
});

// @route   GET /api/dashboard/recent-activity
// @desc    Get recent activity
// @access  Private
router.get('/recent-activity', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    // Get recent activities from different collections
    const [recentUsers, recentDoctors, recentReports, recentFeedbacks] = await Promise.all([
      User.find()
        .select('name email userType createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Doctor.find({ isActive: true })
        .select('name specialization createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Report.find()
        .populate('doctor', 'name specialization')
        .populate('createdBy', 'name')
        .select('patientName title dateTime createdAt')
        .sort({ createdAt: -1 })
        .limit(5),
      Feedback.find({ status: 'approved' })
        .populate('doctor', 'name specialization')
        .select('patientName rating text date createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        recentUsers,
        recentDoctors,
        recentReports,
        recentFeedbacks
      }
    });
  } catch (error) {
    console.error('Get recent activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent activity'
    });
  }
});

// @route   GET /api/dashboard/charts/users-over-time
// @desc    Get user registration over time
// @access  Private
router.get('/charts/users-over-time', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
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
      
      const dayData = userData.find(item => 
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
    console.error('Get users over time error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching users over time data'
    });
  }
});

// @route   GET /api/dashboard/charts/doctor-specializations
// @desc    Get doctor specializations distribution
// @access  Private
router.get('/charts/doctor-specializations', auth, async (req, res) => {
  try {
    const specializations = await Doctor.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$specialization',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    res.json({
      success: true,
      data: specializations
    });
  } catch (error) {
    console.error('Get doctor specializations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doctor specializations'
    });
  }
});

// @route   GET /api/dashboard/charts/feedback-trends
// @desc    Get feedback trends over time
// @access  Private
router.get('/charts/feedback-trends', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const feedbackData = await Feedback.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: 'approved'
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 },
          averageRating: { $avg: '$rating' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Format data for charts
    const labels = [];
    const counts = [];
    const ratings = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      
      labels.push(dateStr);
      
      const dayData = feedbackData.find(item => 
        item._id.year === date.getFullYear() &&
        item._id.month === date.getMonth() + 1 &&
        item._id.day === date.getDate()
      );
      
      counts.push(dayData ? dayData.count : 0);
      ratings.push(dayData ? Math.round(dayData.averageRating * 10) / 10 : 0);
    }

    res.json({
      success: true,
      data: {
        labels,
        counts,
        ratings
      }
    });
  } catch (error) {
    console.error('Get feedback trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching feedback trends'
    });
  }
});

// @route   GET /api/dashboard/quick-actions
// @desc    Get quick action statistics
// @access  Private
router.get('/quick-actions', auth, async (req, res) => {
  try {
    const [
      pendingFeedbacks,
      draftReports,
      inactiveUsers,
      topRatedDoctors
    ] = await Promise.all([
      Feedback.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: 'draft' }),
      User.countDocuments({ isActive: false }),
      Doctor.find({ isActive: true })
        .sort({ 'ratings.averageRating': -1 })
        .limit(3)
        .select('name specialization ratings')
    ]);

    res.json({
      success: true,
      data: {
        pendingFeedbacks,
        draftReports,
        inactiveUsers,
        topRatedDoctors
      }
    });
  } catch (error) {
    console.error('Get quick actions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching quick actions data'
    });
  }
});

module.exports = router;
