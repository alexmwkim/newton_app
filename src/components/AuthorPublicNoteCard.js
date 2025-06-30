import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const AuthorPublicNoteCard = ({ 
  title = "나의 일기장",
  timeAgo = "5 hrs ago",
  username = "alexnwkim",
  avatarUrl = "https://via.placeholder.com/24",
  forksCount = 5,
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Your public note: ${title}, ${forksCount} forks, created ${timeAgo}`}
    >
      <View style={styles.header}>
        <Image 
          source={{ uri: avatarUrl }} 
          style={styles.avatar}
          defaultSource={require('../../assets/favicon.png')}
        />
        <Text style={styles.username}>
          {username}
        </Text>
      </View>
      
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      
      <View style={styles.footer}>
        <Text style={styles.forksCount}>
          {forksCount} Forks
        </Text>
        <Text style={styles.timeAgo}>
          {timeAgo}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.noteCard,
    borderRadius: 12,
    padding: 16,
    width: '100%',
    minHeight: 72,
    marginVertical: 4,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 8,
  },
  username: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 14,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textBlack,
  },
  title: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 16,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.textBlack,
    marginBottom: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forksCount: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
  },
});

export default AuthorPublicNoteCard;