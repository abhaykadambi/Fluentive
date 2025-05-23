import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { IconButton, Text } from 'react-native-paper';

const HomeScreen = () => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          setUserData(JSON.parse(data));
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>
        Welcome{userData ? `, ${userData.username}` : ''}!
      </Text>
      
      <TouchableOpacity style={styles.addLanguageBox}>
        <IconButton
          icon="plus"
          size={24}
          style={styles.plusIcon}
        />
        <Text style={styles.addLanguageText}>Add a new language</Text>
      </TouchableOpacity>

      <Text style={styles.subtitle}>
        This is your home screen. More features coming soon!
      </Text>
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
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 20,
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
});

export default HomeScreen; 