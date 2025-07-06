const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

// Get current user's data
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Error fetching user data' });
  }
});

// Add a new language to user's profile
router.post('/add-language', auth, async (req, res) => {
  try {
    const { userId, language } = req.body;
    
    console.log('Request userId:', userId);
    console.log('Token userId:', req.user.userId);
    console.log('Token payload:', req.user);

    // Verify the user exists and matches the authenticated user
    if (userId !== req.user.userId) {
      console.log('User ID mismatch:', {
        requestUserId: userId,
        tokenUserId: req.user.userId,
        types: {
          requestUserId: typeof userId,
          tokenUserId: typeof req.user.userId
        }
      });
      return res.status(403).json({ message: 'Not authorized to modify this user' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if language already exists
    if (user.languages.some(lang => lang.name === language.name)) {
      return res.status(400).json({ message: 'Language already added' });
    }

    // Add the new language
    user.languages.push(language);
    await user.save();

    // Return updated user data
    res.json(user);
  } catch (error) {
    console.error('Error adding language:', error);
    res.status(500).json({ message: 'Error adding language to profile' });
  }
});

// Update user's speaking time for a specific language
router.put('/update-speaking-time', auth, async (req, res) => {
  try {
    const { languageName, speakingTimeSeconds } = req.body;
    
    if (!languageName || typeof speakingTimeSeconds !== 'number' || speakingTimeSeconds < 0) {
      return res.status(400).json({ message: 'Invalid request data' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find the language in user's languages array
    const languageIndex = user.languages.findIndex(lang => lang.name === languageName);
    
    if (languageIndex === -1) {
      // If language doesn't exist, add it with the speaking time
      user.languages.push({
        name: languageName,
        proficiency: 'Beginner',
        speakingTime: Math.floor(speakingTimeSeconds / 60) // Convert seconds to minutes
      });
    } else {
      // Update existing language's speaking time
      user.languages[languageIndex].speakingTime += Math.floor(speakingTimeSeconds / 60);
    }

    await user.save();
    res.json({ 
      success: true, 
      message: 'Speaking time updated successfully',
      user: user
    });
  } catch (error) {
    console.error('Error updating speaking time:', error);
    res.status(500).json({ message: 'Error updating speaking time' });
  }
});

module.exports = router; 