import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Surface, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Mock data - replace with real data from backend
  const [stats, setStats] = useState({
    totalSpeakingTime: 0, // in minutes
    mostAdvancedLanguage: 'None',
    languages: [],
  });

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          const parsedData = JSON.parse(data);
          setUserData(parsedData);
          setName(parsedData.username || parsedData.name || '');
          setEmail(parsedData.email || '');
          
          // Calculate total speaking time from languages
          const totalTime = parsedData.languages?.reduce((acc, lang) => acc + (lang.speakingTime || 0), 0) || 0;
          console.log('ProfileScreen - User languages:', parsedData.languages);
          console.log('ProfileScreen - Total speaking time (minutes):', totalTime);
          
          // Find most advanced language
          const mostAdvanced = parsedData.languages?.reduce((max, lang) => 
            (lang.proficiency === 'Native' || 
             (lang.proficiency === 'Advanced' && max.proficiency !== 'Native') ||
             (lang.proficiency === 'Intermediate' && max.proficiency === 'Beginner'))
              ? lang : max, { proficiency: 'Beginner', name: 'None' });

          setStats(prev => ({
            ...prev,
            totalSpeakingTime: totalTime, // speakingTime is already in minutes
            mostAdvancedLanguage: mostAdvanced?.name || 'None',
            languages: parsedData.languages || []
          }));
        }
      } catch (error) {
        console.log('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  // Add focus effect to refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const loadUserData = async () => {
        try {
          const data = await AsyncStorage.getItem('userData');
          if (data) {
            const parsedData = JSON.parse(data);
            setUserData(parsedData);
            setName(parsedData.username || parsedData.name || '');
            setEmail(parsedData.email || '');
            
            // Calculate total speaking time from languages
            const totalTime = parsedData.languages?.reduce((acc, lang) => acc + (lang.speakingTime || 0), 0) || 0;
            console.log('ProfileScreen (focus) - User languages:', parsedData.languages);
            console.log('ProfileScreen (focus) - Total speaking time (minutes):', totalTime);
            
            // Find most advanced language
            const mostAdvanced = parsedData.languages?.reduce((max, lang) => 
              (lang.proficiency === 'Native' || 
               (lang.proficiency === 'Advanced' && max.proficiency !== 'Native') ||
               (lang.proficiency === 'Intermediate' && max.proficiency === 'Beginner'))
                ? lang : max, { proficiency: 'Beginner', name: 'None' });

            setStats(prev => ({
              ...prev,
              totalSpeakingTime: totalTime, // speakingTime is already in minutes
              mostAdvancedLanguage: mostAdvanced?.name || 'None',
              languages: parsedData.languages || []
            }));
          }
        } catch (error) {
          console.log('Error loading user data:', error);
        }
      };

      loadUserData();
    }, [])
  );

  const handleUpdateProfile = async () => {
    if (!name || !email) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = await AsyncStorage.getItem('userToken');
      const response = await axios.put(
        'http://localhost:5001/api/users/profile',
        {
          name,
          email,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      await AsyncStorage.setItem('userData', JSON.stringify(response.data));
      setUserData(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.formContainer}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {success ? <Text style={styles.successText}>{success}</Text> : null}

        <TextInput
          label="Name"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          left={<TextInput.Icon icon="email" />}
        />

        <Button
          mode="contained"
          onPress={handleUpdateProfile}
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          Update Profile
        </Button>

        <Divider style={styles.divider} />

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>Your Progress</Text>
          
          <Surface style={styles.statsCard}>
            <View style={styles.statItem}>
              <Icon name="clock-outline" size={24} color="#007AFF" />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.totalSpeakingTime} min</Text>
                <Text style={styles.statLabel}>Total Speaking Time</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Icon name="trophy" size={24} color="#007AFF" />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.mostAdvancedLanguage}</Text>
                <Text style={styles.statLabel}>Most Advanced Language</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <Icon name="translate" size={24} color="#007AFF" />
              <View style={styles.statInfo}>
                <Text style={styles.statValue}>{stats.languages.length}</Text>
                <Text style={styles.statLabel}>Languages Learning</Text>
              </View>
            </View>
          </Surface>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  formContainer: {
    padding: 20,
  },
  input: {
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    marginTop: 10,
    padding: 5,
    backgroundColor: '#007AFF',
  },
  errorText: {
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  successText: {
    color: 'green',
    marginBottom: 15,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  statsContainer: {
    marginBottom: 20,
  },
  statsCard: {
    padding: 15,
    borderRadius: 12,
    elevation: 2,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  statInfo: {
    marginLeft: 15,
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
});

export default ProfileScreen; 