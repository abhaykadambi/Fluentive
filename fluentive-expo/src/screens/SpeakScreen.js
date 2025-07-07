import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Menu, Portal, Surface, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const SPEAKING_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Native'];
const SPEAKING_SPEEDS = ['Slow', 'Normal', 'Fast'];

// Component to render clickable words
const ClickableWord = ({ word, onTap }) => (
  <TouchableOpacity onPress={(event) => onTap(word, event)}>
    <Text style={styles.clickableWord}>{word}</Text>
  </TouchableOpacity>
);

const AudioWave = ({ isListening, isSpeaking }) => {
  const bars = 7; // Number of bars in the wave
  const animations = useRef(Array(bars).fill(0).map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isListening || isSpeaking) {
      // Create a continuous animation for each bar
      const animateBars = () => {
        const animations = Array(bars).fill(0).map(() => {
          return Animated.sequence([
            Animated.timing(new Animated.Value(0), {
              toValue: 1,
              duration: 300 + Math.random() * 200, // Random duration between 300-500ms
              useNativeDriver: true,
            }),
            Animated.timing(new Animated.Value(1), {
              toValue: 0,
              duration: 300 + Math.random() * 200,
              useNativeDriver: true,
            }),
          ]);
        });

        Animated.stagger(100, animations).start(() => {
          if (isListening || isSpeaking) {
            animateBars();
          }
        });
      };

      animateBars();
    } else {
      // Reset all bars to 0 when not listening/speaking
      animations.forEach(anim => anim.setValue(0));
    }
  }, [isListening, isSpeaking]);

  return (
    <View style={styles.waveformContainer}>
      <View style={styles.waveform}>
        {animations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.waveformBar,
              {
                transform: [{
                  scaleY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                }],
                opacity: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        ))}
      </View>
      <Text style={styles.waveformText}>
        {isSpeaking ? 'App is speaking...' : 'Listening...'}
      </Text>
    </View>
  );
};

const SpeakScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  // Get lesson and language data from route params
  const { lesson, selectedLanguage } = route.params || {};
  
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [selectedSpeed, setSelectedSpeed] = useState('Normal');
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [speakingTime, setSpeakingTime] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [conversationStarted, setConversationStarted] = useState(false);
  const [userLanguages, setUserLanguages] = useState([]);
  const [selectedFreeLanguage, setSelectedFreeLanguage] = useState(null);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [translationTag, setTranslationTag] = useState({ visible: false, word: '', translation: '', position: { x: 0, y: 0 } });

  // Add refs for timer and conversation tracking
  const scrollViewRef = useRef(null);
  const timerRef = useRef(null);
  const conversationStartTimeRef = useRef(null);
  const isConversationActiveRef = useRef(false);

  // Placeholder metrics - replace with real data later
  const [metrics, setMetrics] = useState({
    pronunciation: 85,
    grammar: 90,
    complexity: 75,
  });

  // Function to start conversation timer
  const startConversationTimer = () => {
    if (!isConversationActiveRef.current) {
      isConversationActiveRef.current = true;
      conversationStartTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - conversationStartTimeRef.current) / 1000);
        setSpeakingTime(elapsed);
      }, 1000);
    }
  };

  // Function to stop conversation timer
  const stopConversationTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    isConversationActiveRef.current = false;
  };

  // Function to update speaking time in database
  const updateSpeakingTimeInDatabase = async (timeInSeconds) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.log('No auth token found, skipping database update');
        return;
      }

      // Determine language name - use lesson language if available, otherwise use selected language or default
      let languageName = 'English'; // default
      if (selectedLanguage?.name) {
        languageName = selectedLanguage.name;
      } else if (selectedFreeLanguage?.name) {
        languageName = selectedFreeLanguage.name;
      } else if (lesson?.targetLanguage) {
        languageName = lesson.targetLanguage;
      }

      console.log('Updating speaking time:', {
        languageName,
        speakingTimeSeconds: timeInSeconds,
        token: token.substring(0, 20) + '...' // Log first 20 chars for debugging
      });

      const response = await fetch('http://localhost:5001/api/users/update-speaking-time', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          languageName: languageName,
          speakingTimeSeconds: timeInSeconds,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const result = await response.json();
      console.log('Speaking time updated successfully:', result);
      
      // Update local user data with new speaking time
      if (result.user) {
        console.log('Storing updated user data:', JSON.stringify(result.user, null, 2));
        
        // Use the same structure as HomeScreen for consistency
        const storageData = {
          id: result.user._id || result.user.id,
          username: result.user.username,
          email: result.user.email,
          languages: result.user.languages || []
        };
        
        await AsyncStorage.setItem('userData', JSON.stringify(storageData));
      }
    } catch (error) {
      console.error('Error updating speaking time in database:', error);
    }
  };

  // Function to load user languages
  const loadUserLanguages = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsedData = JSON.parse(data);
        setUserLanguages(parsedData.languages || []);
      }
    } catch (error) {
      console.log('Error loading user languages:', error);
    }
  };

  // Function to handle word tap
  const handleWordTap = async (word, event) => {
    // Find the translation for this word in the current transcription
    const lines = transcription.split('\n');
    let translation = word; // Default to the word itself
    
    for (const line of lines) {
      const translationMatch = line.match(/^(.*?)\s*\((.*?)\)\s*$/);
      if (translationMatch) {
        const originalText = translationMatch[1].trim();
        const lineTranslation = translationMatch[2].trim();
        
        // Find the word in the original text and get its corresponding translation
        const originalWords = originalText.split(/\s+/);
        const translationWords = lineTranslation.split(/\s+/);
        
        const wordIndex = originalWords.findIndex(w => w.toLowerCase().includes(word.toLowerCase()));
        if (wordIndex !== -1 && translationWords[wordIndex]) {
          translation = translationWords[wordIndex];
          break;
        }
      }
    }
    
    // Get position for tag
    event.target.measure((x, y, width, height, pageX, pageY) => {
      setTranslationTag({
        visible: true,
        word: word,
        translation: translation,
        position: { x: pageX, y: pageY }
      });
      
      // Auto-hide tag after 3 seconds
      setTimeout(() => {
        setTranslationTag(prev => ({ ...prev, visible: false }));
      }, 3000);
    });
  };

  const resetSpeakScreenState = React.useCallback(() => {
    setIsListening(false);
    setIsSpeaking(false);
    setSelectedLevel('Beginner');
    setSelectedSpeed('Normal');
    setShowLevelMenu(false);
    setShowSpeedMenu(false);
    setShowLanguageMenu(false);
    setTranscription('');
    setShowResults(false);
    setSpeakingTime(0);
    setUserInput('');
    setConversationStarted(false);
    setSelectedFreeLanguage(null);
    setMetrics({
      pronunciation: 85,
      grammar: 90,
      complexity: 75,
    });
    // Stop timer if running
    stopConversationTimer();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      resetSpeakScreenState();
      loadUserLanguages();
    }, [lesson, selectedLanguage, resetSpeakScreenState])
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      stopConversationTimer();
    };
  }, []);

  // Generate the lesson prompt with target language
  const generateLessonPrompt = () => {
    // Determine the target language
    let targetLanguage = 'English'; // default
    let languageName = 'English';
    
    if (lesson && selectedLanguage) {
      // Lesson mode
      targetLanguage = selectedLanguage.name.toLowerCase();
      languageName = selectedLanguage.name;
    } else if (selectedFreeLanguage) {
      // Free conversation mode
      targetLanguage = selectedFreeLanguage.name.toLowerCase();
      languageName = selectedFreeLanguage.name;
    }

    if (!lesson) {
      // Free conversation mode
      return `You are a helpful language learning assistant for ${languageName}. Help the user practice ${selectedLevel.toLowerCase()} level conversation in ${targetLanguage}. Keep responses natural and engaging. The conversation should take place entirely in ${targetLanguage}. 

IMPORTANT: After each response, provide an English translation in parentheses. Format your responses like this:
"Hello, how are you today? (Hello, how are you today?)"

This helps the user understand what you're saying.`;
    }

    // Lesson mode
    // Get a random vocabulary item from the lesson
    const vocabulary = lesson.vocabulary || [];
    const randomVocab = vocabulary.length > 0 
      ? vocabulary[Math.floor(Math.random() * vocabulary.length)]
      : 'item';

    // Generate the complete prompt
    let prompt = lesson.rolePlayPrompt
      .replace('_______', randomVocab)
      .replace('the target language', targetLanguage);

    return prompt;
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Function to render transcription with clickable words
  const renderTranscription = (text) => {
    if (!text) return null;
    
    // Split by lines first to preserve conversation structure
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      if (line.trim() === '') {
        return <Text key={lineIndex}>{'\n'}</Text>;
      }
      
      // Check if this line contains a translation (text in parentheses)
      const translationMatch = line.match(/^(.*?)\s*\((.*?)\)\s*$/);
      
      if (translationMatch) {
        // Line has translation - render original text and translation separately
        const originalText = translationMatch[1].trim();
        const translation = translationMatch[2].trim();
        
        return (
          <View key={lineIndex} style={styles.transcriptionLine}>
            <View style={styles.originalTextContainer}>
              {renderWords(originalText, lineIndex, 'original')}
            </View>
            <Text style={styles.translationText}>({translation})</Text>
          </View>
        );
      } else {
        // Regular line without translation
        return (
          <View key={lineIndex} style={styles.transcriptionLine}>
            {renderWords(line, lineIndex, 'regular')}
          </View>
        );
      }
    });
  };

  // Helper function to render words with clickability
  const renderWords = (text, lineIndex, type) => {
    const words = text.split(/(\s+)/);
    
    return words.map((word, wordIndex) => {
      // Skip whitespace
      if (word.trim() === '') {
        return <Text key={`${lineIndex}-${wordIndex}`}>{word}</Text>;
      }
      
      // Check if it's a word (not just punctuation) and not a speaker label
      const isWord = /[a-zA-Z]/.test(word) && 
                    !word.includes('App:') && 
                    !word.includes('You:') &&
                    word.length > 1 &&
                    type === 'original'; // Only make words clickable in original text
      
      if (isWord) {
        return <ClickableWord key={`${lineIndex}-${wordIndex}`} word={word} onTap={handleWordTap} />;
      } else {
        return <Text key={`${lineIndex}-${wordIndex}`}>{word}</Text>;
      }
    });
  };

  // Auto-scroll when transcription changes
  useEffect(() => {
    if (transcription) {
      // Small delay to ensure the text has been rendered
      setTimeout(scrollToBottom, 100);
    }
  }, [transcription]);

  const toggleListening = async () => {
    if (isListening) {
      // Stop listening and show results
      setIsListening(false);
      setIsSpeaking(false);
      setConversationStarted(false);
      
      // Stop timer and update database
      stopConversationTimer();
      const finalSpeakingTime = speakingTime;
      await updateSpeakingTimeInDatabase(finalSpeakingTime);
      
      setShowResults(true);
    } else {
      // Check if language is selected for free conversation
      if (!lesson && !selectedFreeLanguage) {
        Alert.alert(
          'Language Required',
          'Please select a language for your conversation.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Start listening
      setIsListening(true);
      setIsSpeaking(true);
      setConversationStarted(false);
      setTranscription('');
      setSpeakingTime(0);
      
      // Start conversation timer
      startConversationTimer();
      
      try {
        // Generate the lesson-specific prompt
        const lessonPrompt = generateLessonPrompt();
        const payload = {
          prompt: lessonPrompt,
          history: [],
          userMessage: '',
        };
        const response = await fetch('http://localhost:5001/convo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        let content = data.content || '';
        if (content.trim().endsWith('END 2515')) {
          content = content.replace(/END 2515$/, '').trim();
          let cleanContent = content.replace(/([^\n])\n([^\n])/g, '$1 $2'); // Replace single newlines between words with spaces
          cleanContent = cleanContent.replace(/\n{2,}/g, '\n\n'); // Keep double newlines for turn separation
          setTranscription(`App: ${cleanContent}`);
          // End conversation as if stop was pressed
          setTimeout(async () => {
            setIsListening(false);
            setIsSpeaking(false);
            setConversationStarted(false);
            
            // Stop timer and update database
            stopConversationTimer();
            const finalSpeakingTime = speakingTime;
            await updateSpeakingTimeInDatabase(finalSpeakingTime);
            
            setShowResults(true);
          }, 500); // short delay to show last message
        } else {
          let cleanContent = content.replace(/([^\n])\n([^\n])/g, '$1 $2'); // Replace single newlines between words with spaces
          cleanContent = cleanContent.replace(/\n{2,}/g, '\n\n'); // Keep double newlines for turn separation
          setTranscription(`App: ${cleanContent}`);
          setConversationStarted(true);
        }
      } catch (error) {
        setTranscription('App: Sorry, I encountered an error. Please try again.');
      } finally {
        setIsSpeaking(false);
      }
    }
  };

  const handleDone = async () => {
    // Update database with final speaking time if conversation was active
    if (isConversationActiveRef.current) {
      await updateSpeakingTimeInDatabase(speakingTime);
    }
    
    // Reset all conversation-related state
    setTranscription('');
    setSpeakingTime(0);
    setMetrics({
      pronunciation: 0,
      grammar: 0,
      complexity: 0,
    });
    setShowResults(false);
    setIsListening(false);
    setIsSpeaking(false);
    
    // Stop timer if running
    stopConversationTimer();
    
    // Navigate to home screen
    navigation.navigate('Home');
  };

  const handleTextSubmit = async () => {
    if (!userInput.trim()) return;

    // Check if language is selected for free conversation
    if (!lesson && !selectedFreeLanguage) {
      Alert.alert(
        'Language Required',
        'Please select a language for your conversation.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Add user's message to transcription
    let cleanUserInput = userInput.replace(/([^\n])\n([^\n])/g, '$1 $2'); // Replace single newlines between words with spaces
    cleanUserInput = cleanUserInput.replace(/\n{2,}/g, '\n\n'); // Keep double newlines for turn separation
    const newTranscription = transcription 
      ? `${transcription}\n\nYou: ${cleanUserInput}`
      : `You: ${cleanUserInput}`;
    setTranscription(newTranscription);

    // Start conversation timer if not already started
    if (!isConversationActiveRef.current) {
      startConversationTimer();
    }

    // Clear input immediately for better UX
    const currentInput = userInput;
    setUserInput('');

    try {
      // Generate the lesson-specific prompt
      const lessonPrompt = generateLessonPrompt();
      // Prepare the request payload
      const payload = {
        prompt: lessonPrompt,
        history: [], // TODO: Parse conversation history from transcription
        userMessage: currentInput
      };

      console.log('Sending payload to /convo route:', JSON.stringify(payload, null, 2));

      // Make API call to backend
      const response = await fetch('http://localhost:5001/convo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let content = data.content || '';
      if (content.trim().endsWith('END 2515')) {
        content = content.replace(/END 2515$/, '').trim();
        let cleanContent = content.replace(/([^\n])\n([^\n])/g, '$1 $2'); // Replace single newlines between words with spaces
        cleanContent = cleanContent.replace(/\n{2,}/g, '\n\n'); // Keep double newlines for turn separation
        setTranscription(prev => `${prev}\n\nApp: ${cleanContent}`);
        // End conversation as if stop was pressed
        setTimeout(async () => {
          setIsListening(false);
          setIsSpeaking(false);
          setConversationStarted(false);
          
          // Stop timer and update database
          stopConversationTimer();
          const finalSpeakingTime = speakingTime;
          await updateSpeakingTimeInDatabase(finalSpeakingTime);
          
          setShowResults(true);
        }, 500); // short delay to show last message
      } else {
        let cleanContent = content.replace(/([^\n])\n([^\n])/g, '$1 $2'); // Replace single newlines between words with spaces
        cleanContent = cleanContent.replace(/\n{2,}/g, '\n\n'); // Keep double newlines for turn separation
        setTranscription(prev => `${prev}\n\nApp: ${cleanContent}`);
      }

    } catch (error) {
      console.error('Error making API call:', error);
      // Add error message to transcription
      setTranscription(prev => `${prev}\n\nApp: Sorry, I encountered an error. Please try again.`);
    }
  };

  const renderDropdown = (label, value, options, visible, onDismiss, onSelect) => (
    <Menu
      visible={visible}
      onDismiss={onDismiss}
      anchor={
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={onDismiss}
        >
          <Text style={styles.dropdownLabel}>{label}</Text>
          <View style={styles.dropdownValue}>
            <Text style={styles.dropdownValueText}>{value}</Text>
            <Icon name="chevron-down" size={20} color="#666" />
          </View>
        </TouchableOpacity>
      }
    >
      {options.map((option) => (
        <Menu.Item
          key={option}
          onPress={() => {
            onSelect(option);
            onDismiss();
          }}
          title={option}
        />
      ))}
    </Menu>
  );

  const renderResultsModal = () => (
    <Portal>
      <Modal
        visible={showResults}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowResults(false)}
      >
        <View style={styles.modalOverlay}>
          <Surface style={styles.resultsCard}>
            <View style={styles.resultsHeader}>
              <Icon name="trophy" size={40} color="#FFD700" />
              <Text style={styles.resultsTitle}>Great Job!</Text>
            </View>

            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Icon name="clock-outline" size={24} color="#007AFF" />
                <Text style={styles.metricLabel}>Time Speaking</Text>
                <Text style={styles.metricValue}>
                  {Math.floor(speakingTime / 60)}m {speakingTime % 60}s
                </Text>
              </View>

              <View style={styles.metricItem}>
                <Icon name="microphone" size={24} color="#007AFF" />
                <Text style={styles.metricLabel}>Pronunciation</Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.metricValue}>{metrics.pronunciation}%</Text>
                  <View style={styles.scoreBar}>
                    <View 
                      style={[
                        styles.scoreFill, 
                        { width: `${metrics.pronunciation}%` }
                      ]} 
                    />
                  </View>
                </View>
              </View>

              <View style={styles.metricItem}>
                <Icon name="book" size={24} color="#007AFF" />
                <Text style={styles.metricLabel}>Grammar</Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.metricValue}>{metrics.grammar}%</Text>
                  <View style={styles.scoreBar}>
                    <View 
                      style={[
                        styles.scoreFill, 
                        { width: `${metrics.grammar}%` }
                      ]} 
                    />
                  </View>
                </View>
              </View>

              <View style={styles.metricItem}>
                <Icon name="chart-line" size={24} color="#007AFF" />
                <Text style={styles.metricLabel}>Complexity</Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.metricValue}>{metrics.complexity}%</Text>
                  <View style={styles.scoreBar}>
                    <View 
                      style={[
                        styles.scoreFill, 
                        { width: `${metrics.complexity}%` }
                      ]} 
                    />
                  </View>
                </View>
              </View>
            </View>

            <Button
              mode="contained"
              onPress={handleDone}
              style={styles.doneButton}
              labelStyle={styles.doneButtonLabel}
            >
              Done
            </Button>
          </Surface>
        </View>
      </Modal>
    </Portal>
  );

  useEffect(() => {
    let isMounted = true;

    const setupAudio = async () => {
      try {
        // Request permissions
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant microphone access to use the speaking feature.',
            [{ text: 'OK' }]
          );
          return;
        }

        // Configure audio mode with correct constant values
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: 1, // 1 = DoNotMix
          interruptionModeAndroid: 1, // 1 = DoNotMix
          shouldDuckAndroid: true,
        });
      } catch (err) {
        console.error('Error setting up audio:', err);
        Alert.alert('Error', 'Failed to set up audio recording. Please try again.');
      }
    };

    setupAudio();

    return () => {
      isMounted = false;
      // Cleanup using ref instead of state
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync();
      }
    };
  }, []);

  return (
    <TouchableOpacity 
      style={styles.container} 
      activeOpacity={1}
      onPress={() => setTranslationTag(prev => ({ ...prev, visible: false }))}
    >
      {/* Lesson Header */}
      {lesson && selectedLanguage && (
        <View style={styles.lessonHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonLanguage}>in {selectedLanguage.name}</Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                resetSpeakScreenState();
                navigation.setParams({ lesson: undefined, selectedLanguage: undefined });
              }}
              style={{ marginLeft: 12, padding: 4 }}
              accessibilityLabel="Cancel lesson"
            >
              <Icon name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.lessonDescription}>{lesson.description}</Text>
        </View>
      )}

      {/* Dropdowns */}
      <View style={styles.dropdownsContainer}>
        {renderDropdown(
          'Speaking Level',
          selectedLevel,
          SPEAKING_LEVELS,
          showLevelMenu,
          () => setShowLevelMenu(!showLevelMenu),
          setSelectedLevel
        )}
        <View style={styles.dropdownSpacer} />
        {renderDropdown(
          'Speed',
          selectedSpeed,
          SPEAKING_SPEEDS,
          showSpeedMenu,
          () => setShowSpeedMenu(!showSpeedMenu),
          setSelectedSpeed
        )}
        {!lesson && userLanguages.length > 0 && (
          <>
            <View style={styles.dropdownSpacer} />
            {renderDropdown(
              'Language',
              selectedFreeLanguage?.name || 'Select a language',
              userLanguages.map(lang => lang.name),
              showLanguageMenu,
              () => setShowLanguageMenu(!showLanguageMenu),
              (languageName) => {
                const selectedLang = userLanguages.find(lang => lang.name === languageName);
                setSelectedFreeLanguage(selectedLang);
              }
            )}
          </>
        )}
      </View>

      {/* Mic Button / Waveform */}
      <View style={styles.micContainer}>
        {isListening ? (
          <AudioWave isListening={isListening} isSpeaking={isSpeaking} />
        ) : (
          <TouchableOpacity
            style={styles.micButton}
            onPress={toggleListening}
          >
            <Icon name="microphone" size={60} color="#007AFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Text Input Area */}
      {conversationStarted && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={userInput}
            onChangeText={setUserInput}
            placeholder="Or type your message here..."
            multiline
            maxLength={500}
          />
          <Button
            mode="contained"
            onPress={handleTextSubmit}
            style={styles.submitButton}
            disabled={!userInput.trim()}
          >
            Send
          </Button>
        </View>
      )}

      {/* Transcription Area */}
      <Surface style={styles.transcriptionContainer}>
        {/* Speaking Time Indicator */}
        {isConversationActiveRef.current && (
          <View style={styles.timeIndicator}>
            <Icon name="clock-outline" size={16} color="#007AFF" />
            <Text style={styles.timeText}>
              {Math.floor(speakingTime / 60)}:{(speakingTime % 60).toString().padStart(2, '0')}
            </Text>
          </View>
        )}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.transcriptionScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          onContentSizeChange={scrollToBottom}
        >
          <View style={styles.transcriptionTextContainer}>
            {transcription ? (
              renderTranscription(transcription)
            ) : (
              <Text style={styles.transcriptionText}>
                Start speaking or typing to see the conversation here...
              </Text>
            )}
          </View>
        </ScrollView>
      </Surface>

      {/* Stop Button (only shown when listening) */}
      {isListening && (
        <Button
          mode="contained"
          onPress={toggleListening}
          style={styles.stopButton}
          icon="stop"
        >
          Stop
        </Button>
      )}

      {renderResultsModal()}
      
      {/* Translation Tag */}
      {translationTag.visible && (
        <View style={[styles.translationTag, { left: translationTag.position.x, top: translationTag.position.y - 40 }]}>
          <Text style={styles.translationTagText}>{translationTag.translation}</Text>
          <View style={styles.translationTagArrow} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  dropdownsContainer: {
    marginBottom: 20,
  },

  dropdownButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
    width: '100%',
  },
  dropdownSpacer: {
    height: 8,
  },
  dropdownLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 2,
  },
  dropdownValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValueText: {
    fontSize: 14,
    color: '#000',
  },
  micContainer: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  waveformContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 20,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 100,
    width: '100%',
    maxWidth: 300,
  },
  waveformBar: {
    width: 4,
    height: 40,
    backgroundColor: '#007AFF',
    marginHorizontal: 3,
    borderRadius: 2,
  },
  waveformText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  transcriptionContainer: {
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    minHeight: 200,
    maxHeight: 400,
    flex: 1,
  },
  timeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    marginBottom: 10,
  },
  timeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  transcriptionScrollView: {
    flex: 1,
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
  },
  transcriptionTextContainer: {
    flexDirection: 'column',
  },
  transcriptionLine: {
    flexDirection: 'column',
    marginBottom: 8,
  },
  originalTextContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  translationText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
    marginLeft: 4,
  },
  clickableWord: {
    fontSize: 16,
    lineHeight: 24,
    textDecorationLine: 'underline',
    color: '#007AFF',
  },
  translationTag: {
    position: 'absolute',
    backgroundColor: '#333',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 1000,
  },
  translationTagText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  translationTagArrow: {
    position: 'absolute',
    bottom: -4,
    left: 8,
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 4,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#333',
  },
  stopButton: {
    marginTop: 20,
    backgroundColor: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultsCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    elevation: 5,
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
    color: '#000',
  },
  metricsContainer: {
    marginBottom: 24,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  metricLabel: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
    color: '#333',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    width: 50,
    textAlign: 'right',
  },
  scoreContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginLeft: 8,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  doneButton: {
    marginTop: 8,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
  },
  doneButtonLabel: {
    fontSize: 18,
    paddingVertical: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
    paddingHorizontal: 20,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  lessonHeader: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  lessonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  lessonLanguage: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default SpeakScreen; 