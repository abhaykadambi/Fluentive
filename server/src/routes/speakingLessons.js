const express = require('express');
const router = express.Router();
const { findSpeakingLessons, getSpeakingLessonById } = require('../utils/speakingLessonSeeder');

/**
 * GET /api/speaking-lessons
 * Get all speaking lessons with optional filtering
 */
router.get('/', async (req, res) => {
  try {
    const { difficulty, category, limit = 20, page = 1 } = req.query;
    
    const criteria = {};
    if (difficulty) criteria.difficulty = difficulty;
    if (category) criteria.category = category;
    
    const lessons = await findSpeakingLessons(criteria);
    
    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedLessons = lessons.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedLessons,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(lessons.length / limit),
        totalLessons: lessons.length,
        hasNext: endIndex < lessons.length,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching speaking lessons:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch speaking lessons' });
  }
});

/**
 * GET /api/speaking-lessons/:id
 * Get a specific speaking lesson by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const lesson = await getSpeakingLessonById(req.params.id);
    
    if (!lesson) {
      return res.status(404).json({ success: false, message: 'Speaking lesson not found' });
    }
    
    res.json({ success: true, data: lesson });
  } catch (error) {
    console.error('Error fetching speaking lesson:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch speaking lesson' });
  }
});

module.exports = router; 