import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';

const PublicNoteCard = ({ 
  avatarUrl = "https://via.placeholder.com/24",
  username = "username", 
  title = "Note title",
  forksCount = 0,
  timeAgo = "5 hrs ago",
  onPress 
}) => {
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Public note by ${username}: ${title}, ${forksCount} forks, created ${timeAgo}`}
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
      
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.forksContainer}>
          <Icon name="git-branch" size={12} color={Colors.textGray} />
          <Text style={styles.forksCount}>
            {forksCount} Forks
          </Text>
        </View>
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
    width: 361,
    height: 110,
    marginVertical: 4,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  forksContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  forksCount: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
    marginLeft: 4,
  },
  timeAgo: {
    fontFamily: Typography.fontFamily.primary,
    fontSize: 12,
    color: Colors.textGray,
  },
});

export default PublicNoteCard;