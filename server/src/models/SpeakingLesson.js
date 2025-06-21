const mongoose = require('mongoose');

const speakingLessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  estimatedDuration: {
    type: Number, // in minutes
    required: true,
    min: 1,
    max: 60
  },
  rolePlayPrompt: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  vocabulary: [{
    type: String,
    required: true,
    trim: true
  }],
  learningObjectives: [{
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  },
  completionCount: {
    type: Number,
    default: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0
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
speakingLessonSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
speakingLessonSchema.index({ difficulty: 1, category: 1 });
speakingLessonSchema.index({ isActive: 1, order: 1 });

// Static method to find lessons by criteria
speakingLessonSchema.statics.findByCriteria = function(criteria) {
  const { difficulty, category, isActive = true } = criteria;
  const query = { isActive };
  
  if (difficulty) query.difficulty = difficulty;
  if (category) query.category = category;
  
  return this.find(query).sort({ order: 1, title: 1 });
};

const SpeakingLesson = mongoose.model('SpeakingLesson', speakingLessonSchema);

module.exports = SpeakingLesson; 