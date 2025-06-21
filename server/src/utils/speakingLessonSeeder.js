const SpeakingLesson = require('../models/SpeakingLesson');
const speakingLessons = require('../data/speakingLessons');

/**
 * Seed the database with sample speaking lessons
 */
const seedSpeakingLessons = async () => {
  try {
    console.log('Starting speaking lesson seeding...');
    
    // Check if lessons already exist
    const existingLessons = await SpeakingLesson.countDocuments();
    if (existingLessons > 0) {
      console.log(`${existingLessons} speaking lessons already exist. Skipping seeding.`);
      return;
    }
    
    // Insert sample lessons
    const insertedLessons = await SpeakingLesson.insertMany(speakingLessons);
    
    console.log(`Successfully seeded ${insertedLessons.length} speaking lessons:`);
    insertedLessons.forEach(lesson => {
      console.log(`- ${lesson.title} (${lesson.difficulty})`);
    });
    
  } catch (error) {
    console.error('Error seeding speaking lessons:', error);
    throw error;
  }
};

/**
 * Create a new speaking lesson
 */
const createSpeakingLesson = async (lessonData) => {
  try {
    const lesson = new SpeakingLesson(lessonData);
    const savedLesson = await lesson.save();
    console.log(`Created speaking lesson: ${savedLesson.title}`);
    return savedLesson;
  } catch (error) {
    console.error('Error creating speaking lesson:', error);
    throw error;
  }
};

/**
 * Find speaking lessons by criteria
 */
const findSpeakingLessons = async (criteria = {}) => {
  try {
    const lessons = await SpeakingLesson.findByCriteria(criteria);
    return lessons;
  } catch (error) {
    console.error('Error finding speaking lessons:', error);
    throw error;
  }
};

/**
 * Get speaking lesson by ID
 */
const getSpeakingLessonById = async (lessonId) => {
  try {
    const lesson = await SpeakingLesson.findById(lessonId);
    return lesson;
  } catch (error) {
    console.error('Error finding speaking lesson:', error);
    throw error;
  }
};

/**
 * Update lesson statistics
 */
const updateSpeakingLessonStats = async (lessonId, stats) => {
  try {
    const lesson = await SpeakingLesson.findById(lessonId);
    if (!lesson) {
      throw new Error('Speaking lesson not found');
    }
    
    // Update statistics
    if (stats.completionCount) {
      lesson.completionCount += stats.completionCount;
    }
    
    if (stats.rating) {
      const newRatingCount = lesson.ratingCount + 1;
      const newAverageRating = ((lesson.averageRating * lesson.ratingCount) + stats.rating) / newRatingCount;
      lesson.averageRating = newAverageRating;
      lesson.ratingCount = newRatingCount;
    }
    
    await lesson.save();
    return lesson;
  } catch (error) {
    console.error('Error updating speaking lesson stats:', error);
    throw error;
  }
};

/**
 * Get a random vocabulary item from a lesson
 */
const getRandomVocabularyItem = (lesson) => {
  if (!lesson.vocabulary || lesson.vocabulary.length === 0) {
    return 'item';
  }
  
  const randomIndex = Math.floor(Math.random() * lesson.vocabulary.length);
  const vocabItem = lesson.vocabulary[randomIndex];
  
  // Return the vocabulary item (no need to split since it's now just the word)
  return vocabItem;
};

/**
 * Generate the complete prompt for a lesson with a specific target language
 */
const generateLessonPrompt = (lesson, targetLanguage) => {
  const randomVocab = getRandomVocabularyItem(lesson);
  return lesson.rolePlayPrompt
    .replace('_______', randomVocab)
    .replace('the target language', targetLanguage);
};

module.exports = {
  seedSpeakingLessons,
  createSpeakingLesson,
  findSpeakingLessons,
  getSpeakingLessonById,
  updateSpeakingLessonStats,
  getRandomVocabularyItem,
  generateLessonPrompt
}; 