const speakingLessons = [
  {
    title: "Shopping for Clothes",
    description: "Practice buying clothes at a clothing store",
    difficulty: "Beginner",
    category: "Shopping",
    estimatedDuration: 10,
    rolePlayPrompt: "You are a language tutor, acting as a shopkeeper. The objective is for the user to successfully purchase a clothing item. When the user confirms the purchase (for example, they say 'I have bought the shirt' or 'I completed my purchase'), you must reply ONLY with: END 2515. Example: User: I have completed my purchase. Assistant: END 2515. This conversation should take place entirely in the target language. No matter what is said do not switch languages.",
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
    rolePlayPrompt: "You are a language tutor, acting as a waiter. The objective is for the user to successfully order and receive food. When the user confirms their order is complete (for example, they say 'I have received my food' or 'My order is complete'), you must reply ONLY with: END 2515. Example: User: My order is complete. Assistant: END 2515. This conversation should take place entirely in the target language. No matter what is said do not switch languages.",
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
    rolePlayPrompt: "You are a language tutor, acting as a local person. The objective is for the user to successfully receive directions to their destination. When the user confirms they understand the directions (for example, they say 'Thank you, I know how to get there now'), you must reply ONLY with: END 2515. Example: User: I know how to get there now. Assistant: END 2515. This conversation should take place entirely in the target language. No matter what is said do not switch languages.",
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
    rolePlayPrompt: "You are a language tutor, acting as a hotel receptionist. The objective is for the user to successfully book a hotel room. When the user confirms the reservation is complete (for example, they say 'I have booked the room' or 'My reservation is complete'), you must reply ONLY with: END 2515. Example: User: My reservation is complete. Assistant: END 2515. This conversation should take place entirely in the target language. No matter what is said do not switch languages.",
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
    rolePlayPrompt: "You are a language tutor, acting as a doctor. The objective is for the user to successfully describe their symptoms and receive advice or a diagnosis. When the user confirms they understand the advice or diagnosis (for example, they say 'Thank you, I understand what to do now'), you must reply ONLY with: END 2515. Example: User: I understand what to do now. Assistant: END 2515. This conversation should take place entirely in the target language. No matter what is said do not switch languages.",
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
    rolePlayPrompt: "You are a language tutor, acting as a grocery store clerk. The objective is for the user to successfully purchase grocery items. When the user confirms the purchase is complete (for example, they say 'I have bought the groceries' or 'My shopping is done'), you must reply ONLY with: END 2515. Example: User: My shopping is done. Assistant: END 2515. This conversation should take place entirely in the target language. No matter what is said do not switch languages.",
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