# Fluentive - Language Learning App

A React Native mobile application with an Express.js backend for language learning and practice.

## Features

- User authentication (login/signup)
- Home dashboard with learning progress
- Speaking practice with recording functionality
- User profile management
- MongoDB database integration

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- React Native development environment setup
- iOS Simulator (for Mac) or Android Emulator

## Project Structure

```
Fluentive/
├── client/                 # React Native frontend
│   ├── src/
│   │   ├── screens/       # Screen components
│   │   ├── components/    # Reusable components
│   │   ├── navigation/    # Navigation configuration
│   │   ├── services/      # API services
│   │   └── utils/         # Utility functions
└── server/                 # Express.js backend
    ├── src/
    │   ├── controllers/   # Route controllers
    │   ├── models/        # MongoDB models
    │   ├── routes/        # API routes
    │   ├── middleware/    # Custom middleware
    │   └── config/        # Configuration files
```

## Setup Instructions

### Backend Setup

1. Navigate to the server directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the server directory with the following content:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/fluentive
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   NODE_ENV=development
   ```

4. Start the server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the client directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. For iOS (Mac only):
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. Start the Metro bundler:
   ```bash
   npm start
   ```

5. Run the app:
   - For iOS:
     ```bash
     npm run ios
     ```
   - For Android:
     ```bash
     npm run android
     ```

## API Endpoints

### Authentication
- POST `/api/auth/signup` - Register a new user
- POST `/api/auth/login` - Login user

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 