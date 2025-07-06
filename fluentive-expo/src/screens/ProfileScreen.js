import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Avatar, Button, Divider, Surface, Text, TextInput } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const ProfileScreen = () => {
  const [userData, setUserData] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profileImage, setProfileImage] = useState(null);

  // Mock data - replace with real data from backend
  const [stats, setStats] = useState({
    totalSpeakingTime: 0, // in minutes
    mostAdvancedLanguage: 'None',
    languages: [],
    badges: [
      { id: 1, name: 'First Steps', icon: 'star', description: 'Completed your first conversation', earned: true },
      { id: 2, name: 'Language Explorer', icon: 'earth', description: 'Learned 3 different languages', earned: true },
      { id: 3, name: 'Consistent Learner', icon: 'calendar-check', description: 'Practiced for 7 days straight', earned: false },
      { id: 4, name: 'Master Speaker', icon: 'trophy', description: 'Achieved advanced level in any language', earned: false },
    ]
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
          setProfileImage(parsedData.profileImage);
          
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
            setProfileImage(parsedData.profileImage);
            
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
          profileImage,
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

  const handleImagePick = async () => {
    // TODO: Implement image picker
    // This will be implemented when we add image upload functionality
    console.log('Image picker to be implemented');
  };

  const renderBadge = (badge) => (
    <Surface key={badge.id} style={[styles.badgeCard, !badge.earned && styles.badgeLocked]}>
      <Icon 
        name={badge.icon} 
        size={24} 
        color={badge.earned ? '#007AFF' : '#999'} 
      />
      <View style={styles.badgeInfo}>
        <Text style={[styles.badgeName, !badge.earned && styles.badgeLockedText]}>
          {badge.name}
        </Text>
        <Text style={[styles.badgeDescription, !badge.earned && styles.badgeLockedText]}>
          {badge.description}
        </Text>
      </View>
      {!badge.earned && (
        <Icon name="lock" size={20} color="#999" style={styles.lockIcon} />
      )}
    </Surface>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleImagePick} style={styles.profileImageContainer}>
          {profileImage ? (
            <Image source={{ uri: profileImage }} style={styles.profileImage} />
          ) : (
            <Avatar.Icon 
              size={100} 
              icon="account" 
              style={styles.profileImagePlaceholder}
            />
          )}
          <View style={styles.editIconContainer}>
            <Icon name="camera" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
      </View>

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

        <View style={styles.badgesContainer}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          {stats.badges.map(renderBadge)}
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
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    backgroundColor: '#e1e1e1',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
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
  badgesContainer: {
    marginBottom: 20,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 12,
    elevation: 2,
  },
  badgeLocked: {
    backgroundColor: '#f5f5f5',
  },
  badgeInfo: {
    marginLeft: 15,
    flex: 1,
  },
  badgeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  badgeDescription: {
    fontSize: 14,
    color: '#666',
  },
  badgeLockedText: {
    color: '#999',
  },
  lockIcon: {
    marginLeft: 10,
  },
});

export default ProfileScreen; 