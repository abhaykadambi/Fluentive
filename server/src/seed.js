require('dotenv').config();
const mongoose = require('mongoose');
const { seedSpeakingLessons } = require('./utils/speakingLessonSeeder');

const seedDatabase = async () => {
  try {
    // 1. Connect to MongoDB
    console.log('Connecting to MongoDB...');
    console.log('MONGODB_URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Successfully connected to MongoDB.');

    // 2. Run the seeder function
    await seedSpeakingLessons();

  } catch (error) {
    console.error('Error seeding the database:', error);
  } finally {
    // 3. Disconnect from MongoDB
    console.log('Disconnecting from MongoDB...');
    await mongoose.disconnect();
    console.log('Successfully disconnected from MongoDB.');
  }
};

seedDatabase(); 