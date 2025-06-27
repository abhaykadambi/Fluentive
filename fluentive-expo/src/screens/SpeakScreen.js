import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Menu, Portal, Surface, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';


const SPEAKING_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Native'];
const SPEAKING_SPEEDS = ['Slow', 'Normal', 'Fast'];

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

  // Add ref for auto-scrolling
  const scrollViewRef = useRef(null);

  // Placeholder metrics - replace with real data later
  const [metrics, setMetrics] = useState({
    pronunciation: 85,
    grammar: 90,
    complexity: 75,
  });

  const resetSpeakScreenState = React.useCallback(() => {
    setIsListening(false);
    setIsSpeaking(false);
    setSelectedLevel('Beginner');
    setSelectedSpeed('Normal');
    setShowLevelMenu(false);
    setShowSpeedMenu(false);
    setTranscription('');
    setShowResults(false);
    setSpeakingTime(0);
    setUserInput('');
    setConversationStarted(false);
    setMetrics({
      pronunciation: 85,
      grammar: 90,
      complexity: 75,
    });
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      resetSpeakScreenState();
    }, [lesson, selectedLanguage, resetSpeakScreenState])
  );

  // Generate the lesson prompt with target language
  const generateLessonPrompt = () => {
    if (!lesson || !selectedLanguage) {
      return `You are a helpful language learning assistant. Help the user practice ${selectedLevel.toLowerCase()} level conversation. Keep responses natural and engaging.`;
    }

    // Get a random vocabulary item from the lesson
    const vocabulary = lesson.vocabulary || [];
    const randomVocab = vocabulary.length > 0 
      ? vocabulary[Math.floor(Math.random() * vocabulary.length)]
      : 'item';

    // Generate the complete prompt
    const targetLanguage = selectedLanguage.name.toLowerCase();
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
      setShowResults(true);
      setConversationStarted(false);
      // In a real app, calculate these metrics based on the conversation
      setSpeakingTime(120); // 2 minutes in seconds
    } else {
      // Start listening
      setIsListening(true);
      setIsSpeaking(true);
      setConversationStarted(false);
      setTranscription('');
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
          setTranscription(`App: ${content}`);
          // End conversation as if stop was pressed
          setTimeout(() => {
            setIsListening(false);
            setIsSpeaking(false);
            setShowResults(true);
            setConversationStarted(false);
            setSpeakingTime(120); // or calculate as needed
          }, 500); // short delay to show last message
        } else {
          setTranscription(`App: ${content}`);
          setConversationStarted(true);
        }
      } catch (error) {
        setTranscription('App: Sorry, I encountered an error. Please try again.');
      } finally {
        setIsSpeaking(false);
      }
    }
  };

  const handleDone = () => {
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
    // Navigate to home screen
    navigation.navigate('Home');
  };

  const handleTextSubmit = async () => {
    if (!userInput.trim()) return;

    // Add user's message to transcription
    const newTranscription = transcription 
      ? `${transcription}\n\nYou: ${userInput}`
      : `You: ${userInput}`;
    setTranscription(newTranscription);

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
        setTranscription(prev => `${prev}\n\nApp: ${content}`);
        // End conversation as if stop was pressed
        setTimeout(() => {
          setIsListening(false);
          setIsSpeaking(false);
          setShowResults(true);
          setConversationStarted(false);
          setSpeakingTime(120); // or calculate as needed
        }, 500); // short delay to show last message
      } else {
        setTranscription(prev => `${prev}\n\nApp: ${content}`);
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
    <View style={styles.container}>
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
        <ScrollView 
          ref={scrollViewRef}
          style={styles.transcriptionScrollView}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          onContentSizeChange={scrollToBottom}
        >
          <Text style={styles.transcriptionText}>
            {transcription || 'Start speaking or typing to see the conversation here...'}
          </Text>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  dropdownsContainer: {
    marginBottom: 30,
  },
  dropdownButton: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    width: '100%',
  },
  dropdownSpacer: {
    height: 12,
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  dropdownValue: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownValueText: {
    fontSize: 16,
    color: '#000',
  },
  micContainer: {
    flex: 1,
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
    marginTop: 20,
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    minHeight: 150,
    maxHeight: 300,
  },
  transcriptionScrollView: {
    flex: 1,
  },
  transcriptionText: {
    fontSize: 16,
    lineHeight: 24,
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
    marginTop: 20,
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