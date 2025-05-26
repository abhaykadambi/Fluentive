import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { FlatList, Modal, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Button, IconButton, Portal, Text } from 'react-native-paper';

const AVAILABLE_LANGUAGES = ['Tamil', 'Spanish', 'French'];

const HomeScreen = () => {
  const [userData, setUserData] = useState(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const data = await AsyncStorage.getItem('userData');
      if (data) {
        const parsedData = JSON.parse(data);
        console.log('Loaded user data:', parsedData);
        setUserData(parsedData);
      }
    } catch (error) {
      console.log('Error loading user data:', error);
    }
  };

  const handleAddLanguage = async (language) => {
    if (!userData) return;

    // Check if language already exists
    if (userData.languages?.some(lang => lang.name === language)) {
      setShowLanguageModal(false);
      return;
    }

    setLoading(true);
    try {
      // Get the auth token from AsyncStorage
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      console.log('Sending request with userData:', userData);
      console.log('Using userId:', userData._id);

      const response = await axios.post('http://localhost:5001/api/users/add-language', 
        {
          userId: userData._id,
          language: {
            name: language,
            proficiency: 'Beginner',
            speakingTime: 0
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      // Update local storage with new user data
      const updatedUserData = response.data;
      console.log('Received updated user data:', updatedUserData);
      await AsyncStorage.setItem('userData', JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
      setShowLanguageModal(false);
    } catch (error) {
      console.error('Error adding language:', error);
      // Show error to user
      if (error.message === 'No authentication token found') {
        setError('Please log in again');
      } else {
        setError(error.response?.data?.message || 'Error adding language');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderLanguageItem = ({ item }) => (
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
  );

  return (
    <View style={styles.container}>
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
          {userData.languages.map((lang, index) => (
            <View key={index} style={styles.languageCard}>
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageProficiency}>Level: {lang.proficiency}</Text>
              <Text style={styles.languageTime}>Speaking Time: {lang.speakingTime} minutes</Text>
            </View>
          ))}
        </View>
      )}

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
                renderItem={renderLanguageItem}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
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
  },
  plusIcon: {
    margin: 0,
    marginRight: 8,
  },
  addLanguageText: {
    fontSize: 16,
    color: '#666',
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
  languagesList: {
    marginTop: 20,
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
});

export default HomeScreen; 