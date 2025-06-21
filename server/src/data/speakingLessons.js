const speakingLessons = [
  {
    title: "Shopping for Clothes",
    description: "Practice buying clothes at a clothing store",
    difficulty: "Beginner",
    category: "Shopping",
    estimatedDuration: 10,
    rolePlayPrompt: "you are a language tutor, please act as if you are a shopkeeper and the user wants to buy an _______ (pick random item of a vocab list). This conversation should take place entirely in the target language. No matter what is said do not switch languages. When the objective is complete, respond only with \"END 2515\".",
    vocabulary: [
      "shirt",
      "pants",
      "dress",
      "shoes",
      "socks",
      "jacket",
      "skirt",
      "blouse",
      "suit",
      "tie"
    ],
    learningObjectives: [
      "Ask for clothing items in the target language",
      "Discuss sizes and colors",
      "Negotiate prices",
      "Complete a shopping transaction"
    ]
  },
  {
    title: "Ordering Food at a Restaurant",
    description: "Practice ordering food at a restaurant",
    difficulty: "Intermediate",
    category: "Dining",
    estimatedDuration: 12,
    rolePlayPrompt: "you are a language tutor, please act as if you are a waiter and the user wants to order _______ (pick random item of a vocab list). This conversation should take place entirely in the target language. No matter what is said do not switch languages. When the objective is complete, respond only with \"END 2515\".",
    vocabulary: [
      "pizza",
      "pasta",
      "salad",
      "soup",
      "steak",
      "fish",
      "chicken",
      "dessert",
      "coffee",
      "wine"
    ],
    learningObjectives: [
      "Order food items in the target language",
      "Ask about ingredients and preparation",
      "Discuss dietary preferences",
      "Handle restaurant interactions"
    ]
  },
  {
    title: "Asking for Directions",
    description: "Practice asking for and giving directions",
    difficulty: "Beginner",
    category: "Navigation",
    estimatedDuration: 8,
    rolePlayPrompt: "you are a language tutor, please act as if you are a local person and the user wants to find _______ (pick random item of a vocab list). This conversation should take place entirely in the target language. No matter what is said do not switch languages. When the objective is complete, respond only with \"END 2515\".",
    vocabulary: [
      "train station",
      "museum",
      "restaurant",
      "pharmacy",
      "bank",
      "post office",
      "hospital",
      "police station",
      "library",
      "park"
    ],
    learningObjectives: [
      "Ask for directions in the target language",
      "Understand location descriptions",
      "Use directional vocabulary",
      "Navigate city locations"
    ]
  },
  {
    title: "Making a Hotel Reservation",
    description: "Practice booking a hotel room",
    difficulty: "Intermediate",
    category: "Travel",
    estimatedDuration: 15,
    rolePlayPrompt: "you are a language tutor, please act as if you are a hotel receptionist and the user wants to book _______ (pick random item of a vocab list). This conversation should take place entirely in the target language. No matter what is said do not switch languages. When the objective is complete, respond only with \"END 2515\".",
    vocabulary: [
      "single room",
      "double room",
      "suite",
      "room with view",
      "room with balcony",
      "air-conditioned room",
      "room with breakfast",
      "family room",
      "non-smoking room",
      "accessible room"
    ],
    learningObjectives: [
      "Book hotel accommodations in the target language",
      "Discuss room preferences and amenities",
      "Handle check-in procedures",
      "Resolve booking issues"
    ]
  },
  {
    title: "Visiting a Doctor",
    description: "Practice describing symptoms and getting medical help",
    difficulty: "Advanced",
    category: "Healthcare",
    estimatedDuration: 18,
    rolePlayPrompt: "you are a language tutor, please act as if you are a doctor and the user wants to discuss _______ (pick random item of a vocab list). This conversation should take place entirely in the target language. No matter what is said do not switch languages. When the objective is complete, respond only with \"END 2515\".",
    vocabulary: [
      "headache",
      "stomach ache",
      "fever",
      "cough",
      "runny nose",
      "sore throat",
      "dizziness",
      "fatigue",
      "allergy",
      "cold"
    ],
    learningObjectives: [
      "Describe symptoms in the target language",
      "Understand medical terminology",
      "Follow doctor's instructions",
      "Handle healthcare appointments"
    ]
  },
  {
    title: "Buying Groceries",
    description: "Practice shopping for groceries at a market",
    difficulty: "Beginner",
    category: "Shopping",
    estimatedDuration: 10,
    rolePlayPrompt: "you are a language tutor, please act as if you are a grocery store clerk and the user wants to buy _______ (pick random item of a vocab list). This conversation should take place entirely in the target language. No matter what is said do not switch languages. When the objective is complete, respond only with \"END 2515\".",
    vocabulary: [
      "bread",
      "milk",
      "cheese",
      "fruits",
      "vegetables",
      "meat",
      "fish",
      "rice",
      "beans",
      "eggs"
    ],
    learningObjectives: [
      "Purchase grocery items in the target language",
      "Ask about product availability",
      "Discuss quantities and prices",
      "Complete shopping transactions"
    ]
  }
];

module.exports = speakingLessons; 