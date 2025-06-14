import { useNavigation } from '@react-navigation/native';
import { Audio } from 'expo-av';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Menu, Portal, Surface, Text } from 'react-native-paper';
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
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('Beginner');
  const [selectedSpeed, setSelectedSpeed] = useState('Normal');
  const [showLevelMenu, setShowLevelMenu] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [speakingTime, setSpeakingTime] = useState(0);

  // Placeholder metrics - replace with real data later
  const [metrics, setMetrics] = useState({
    pronunciation: 85,
    grammar: 90,
    complexity: 75,
  });

  const toggleListening = () => {
    if (isListening) {
      // Stop listening and show results
      setIsListening(false);
      setIsSpeaking(false);
      setShowResults(true);
      // In a real app, calculate these metrics based on the conversation
      setSpeakingTime(120); // 2 minutes in seconds
    } else {
      // Start listening
      setIsListening(true);
      setTranscription('App: Hello! How are you today?\n\nYou: ');
      
      // Simulate app speaking (remove this in real implementation)
      setIsSpeaking(true);
      setTimeout(() => {
        setIsSpeaking(false);
      }, 2000);
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

      {/* Transcription Area */}
      <Surface style={styles.transcriptionContainer}>
        <Text style={styles.transcriptionText}>
          {transcription || 'Start speaking to see transcription here...'}
        </Text>
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
    maxHeight: 200,
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
});

export default SpeakScreen; 