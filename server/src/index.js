require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const speakingLessonRoutes = require('./routes/speakingLessons');
const OpenAI  = require('openai');
const app = express();


// Middleware
app.use(cors());
app.use(express.json());
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/speaking-lessons', speakingLessonRoutes);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fluentive', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch((err) => console.error('MongoDB connection error:', err));

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Fluentive API' });
});


app.post('/convo', async (req, res) => {
  /* 1 ─── read and sanity-check client payload ──────────────────────────── */
  const { prompt, history = [], userMessage = '' } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt missing' });

  /* 2 ─── build the messages array for OpenAI ───────────────────────────── */
  // 2-A  System instruction: the lesson prompt + END-token rule
  const systemMessage = {
    role: 'system',
    content:
      `${prompt}\n` +
      `When the conversation objective has been fulfilled, ` +
      `answer ONLY with: END 2515`
  };

  // 2-B  Start with system, add prior dialogue history
  const messages = [systemMessage, ...history];

  // 2-C  Append the latest user turn if it exists
  if (userMessage.trim()) {
    messages.push({ role: 'user', content: userMessage.trim() });
  }

  /* 3 ─── ask ChatGPT ───────────────────────────────────────────────────── */
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',    // or gpt-3.5-turbo etc.
      messages,
      temperature: 0.8
    });

    // 4 ─── send the assistant's reply back to the mobile client ──────────
    res.json(completion.choices[0].message);   // {role:'assistant', content:'…'}
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Translation endpoint
app.post('/translate', async (req, res) => {
  const { word, targetLanguage } = req.body;
  
  if (!word || !targetLanguage) {
    return res.status(400).json({ error: 'word and targetLanguage are required' });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a language translator. Translate the given word to English. Only return the English translation, nothing else.`
        },
        {
          role: 'user',
          content: `Translate "${word}" from ${targetLanguage} to English.`
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    });

    const translation = completion.choices[0].message.content.trim();
    res.json({ translation });
  } catch (err) {
    console.error('Translation error:', err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 