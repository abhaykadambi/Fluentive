import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, Card, IconButton, Portal, Text } from 'react-native-paper';

const AVAILABLE_LANGUAGES = ['Tamil', 'Spanish', 'French'];

const HomeScreen = () => {
  const [userData, setUserData] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    if (selectedLanguage) {
      fetchLessons();
    } else {
      setLessons([]);
    }
  }, [selectedLanguage]);

  const loadUserData = async () => {
    try {
      // First try to get the token
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        console.warn('No auth token found');
        return;
      }

      // Fetch fresh user data from the server
      try {
        const response = await axios.get('http://localhost:5001/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        const freshUserData = response.data;
        //console.log('Fresh user data from server:', JSON.stringify(freshUserData, null, 2));
        
        // Store the fresh data in AsyncStorage
        const storageData = {
          id: freshUserData._id || freshUserData.id,
          username: freshUserData.username,
          email: freshUserData.email,
          languages: freshUserData.languages || []
        };
        
        await AsyncStorage.setItem('userData', JSON.stringify(storageData));
        setUserData(storageData);
      } catch (error) {
        console.error('Error fetching fresh user data:', error);
        // Fall back to AsyncStorage data if server request fails
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          const parsedData = JSON.parse(data);
          console.log('Using cached user data:', JSON.stringify(parsedData, null, 2));
          setUserData(parsedData);
        }
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
    }
  };

  const fetchLessons = async () => {
    if (!selectedLanguage) return;
    
    setLessonsLoading(true);
    try {
      const response = await axios.get('http://localhost:5001/api/speaking-lessons');
      
      if (response.data.success) {
        // Filter lessons based on user's proficiency level
        const userProficiency = selectedLanguage.proficiency;
        let filteredLessons = response.data.data;
        
        // Filter by difficulty level (allow same level and easier levels)
        const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced'];
        const userLevelIndex = difficultyOrder.indexOf(userProficiency);
        
        filteredLessons = filteredLessons.filter(lesson => {
          const lessonLevelIndex = difficultyOrder.indexOf(lesson.difficulty);
          return lessonLevelIndex <= userLevelIndex;
        });
        
        setLessons(filteredLessons);
      }
    } catch (error) {
      console.error('Error fetching lessons:', error);
      setError('Failed to load lessons');
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleAddLanguage = async (language) => {
    if (!userData) {
      console.error('userData is null or undefined');
      setError('User data not loaded. Please try again.');
      return;
    }

    if (!userData.id) {
      console.error('userData.id is missing:', userData);
      setError('User ID not found. Please log out and log in again.');
      return;
    }

    // Check if language already exists
    if (userData.languages?.some(lang => lang.name === language)) {
      setError('You have already added this language');
      setShowLanguageModal(false);
      return;
    }

    setLoading(true);
    setError(null); // Clear any previous errors
    try {
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Full userData object:', JSON.stringify(userData, null, 2));
      console.log('Sending request with userId:', userData.id);

      const requestBody = {
        userId: userData.id,
        language: {
          name: language,
          proficiency: 'Beginner',
          speakingTime: 0
        }
      };

      const response = await axios.post('http://localhost:5001/api/users/add-language', 
        requestBody,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update local storage with new user data
      const updatedUserData = response.data;
      console.log('Received updated user data:', JSON.stringify(updatedUserData, null, 2));
      
      // Ensure we preserve the id field when updating AsyncStorage
      const storageData = {
        id: updatedUserData._id || updatedUserData.id,
        username: updatedUserData.username,
        email: updatedUserData.email,
        languages: updatedUserData.languages || []
      };
      
      await AsyncStorage.setItem('userData', JSON.stringify(storageData));
      setUserData(storageData);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error adding language:', error);
      if (error.response?.status === 400) {
        setError('This language has already been added');
      } else {
        setError(error.response?.data?.message || 'Error adding language');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
  };

  const handleStartLesson = (lesson) => {
    // Navigate to speak screen with lesson data and selected language
    navigation.navigate('Speak', {
      lesson: lesson,
      selectedLanguage: selectedLanguage
    });
  };

  const renderLanguageCard = (language) => {
    const isSelected = selectedLanguage?.name === language.name;
    return (
      <TouchableOpacity
        key={language._id}
        style={[
          styles.languageCard,
          isSelected && styles.selectedLanguageCard
        ]}
        onPress={() => handleLanguageSelect(language)}
      >
        <View style={styles.languageCardContent}>
          <Text style={[
            styles.languageName,
            isSelected && styles.selectedLanguageText
          ]}>
            {language.name}
          </Text>
          <Text style={[
            styles.languageProficiency,
            isSelected && styles.selectedLanguageText
          ]}>
            Level: {language.proficiency}
          </Text>
          <Text style={[
            styles.languageTime,
            isSelected && styles.selectedLanguageText
          ]}>
            Speaking Time: {language.speakingTime} minutes
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderLessons = () => {
    if (!selectedLanguage) {
      return (
        <View style={styles.noLanguageSelected}>
          <Text style={styles.noLanguageText}>
            Select a language to view available lessons
          </Text>
        </View>
      );
    }

    if (lessonsLoading) {
      return (
        <View style={styles.noLanguageSelected}>
          <Text style={styles.noLanguageText}>
            Loading lessons...
          </Text>
        </View>
      );
    }

    if (lessons.length === 0) {
      return (
        <View style={styles.noLanguageSelected}>
          <Text style={styles.noLanguageText}>
            No lessons available for your current level
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.lessonsContainer}>
        <Text style={styles.lessonsTitle}>
          {selectedLanguage.name} Lessons
        </Text>
        {lessons.map(lesson => (
          <Card key={lesson._id} style={styles.lessonCard}>
            <Card.Content>
              <Text style={styles.lessonTitle}>{lesson.title}</Text>
              <Text style={styles.lessonDescription}>{lesson.description}</Text>
              <View style={styles.lessonDetails}>
                <Text style={styles.lessonDuration}>{lesson.estimatedDuration} min</Text>
                <Text style={styles.lessonLevel}>{lesson.difficulty}</Text>
                <Text style={styles.lessonCategory}>{lesson.category}</Text>
              </View>
            </Card.Content>
            <Card.Actions>
              <Button mode="contained" onPress={() => handleStartLesson(lesson)}>
                Start Lesson
              </Button>
            </Card.Actions>
          </Card>
        ))}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          Welcome{userData ? `, ${userData.username}` : ''}!
        </Text>
        
        <TouchableOpacity 
          style={styles.addLanguageBox}
          onPress={() => setShowLanguageModal(true)}
        >
          <IconButton
            icon="plus"
            size={24}
            style={styles.plusIcon}
          />
          <Text style={styles.addLanguageText}>Add a new language</Text>
        </TouchableOpacity>

        {userData?.languages?.length > 0 && (
          <View style={styles.languagesList}>
            <Text style={styles.languagesTitle}>Your Languages:</Text>
            {userData.languages.map(renderLanguageCard)}
          </View>
        )}

        {renderLessons()}

        <Portal>
          <Modal
            visible={showLanguageModal}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setShowLanguageModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Select a Language</Text>
                <FlatList
                  data={AVAILABLE_LANGUAGES}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.languageItem}
                      onPress={() => handleAddLanguage(item)}
                      disabled={loading || userData?.languages?.some(lang => lang.name === item)}
                    >
                      <Text style={[
                        styles.languageText,
                        userData?.languages?.some(lang => lang.name === item) && styles.languageTextDisabled
                      ]}>
                        {item}
                      </Text>
                    </TouchableOpacity>
                  )}
                  keyExtractor={item => item}
                  style={styles.languageList}
                />
                <Button
                  mode="outlined"
                  onPress={() => setShowLanguageModal(false)}
                  style={styles.closeButton}
                >
                  Close
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  addLanguageBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    marginBottom: 20,
  },
  plusIcon: {
    margin: 0,
    marginRight: 8,
  },
  addLanguageText: {
    fontSize: 16,
    color: '#666',
  },
  languagesList: {
    marginBottom: 20,
  },
  languagesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  languageCard: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedLanguageCard: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  languageCardContent: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  languageProficiency: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  languageTime: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  selectedLanguageText: {
    color: '#fff',
  },
  noLanguageSelected: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  noLanguageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  lessonsContainer: {
    marginTop: 20,
  },
  lessonsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  lessonCard: {
    marginBottom: 15,
    elevation: 2,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  lessonDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  lessonDuration: {
    color: '#666',
    fontSize: 12,
  },
  lessonLevel: {
    color: '#666',
    fontSize: 12,
  },
  lessonCategory: {
    color: '#666',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  languageList: {
    maxHeight: 300,
  },
  languageItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  languageText: {
    fontSize: 16,
  },
  languageTextDisabled: {
    color: '#999',
  },
  closeButton: {
    marginTop: 20,
  },
});

export default HomeScreen; 