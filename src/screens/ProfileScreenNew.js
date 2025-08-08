import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Colors from '../constants/Colors';
import Layout from '../constants/Layout';
import BottomNavigationComponent from '../components/BottomNavigationComponent';

// 새로운 훅과 컴포넌트들
import { useProfile } from '../features/profile/hooks';
import {
  ProfileHeader,
  SocialActions,
  ProfileStats,
  ReadmeSection,
  HighlightNotes,
} from '../features/profile/components';

/**
 * 새로운 ProfileScreen - 대폭 간소화된 버전
 * 
 * 기존 1175줄 -> ~150줄로 축소
 * 모든 비즈니스 로직은 커스텀 훅으로 분리
 * UI 컴포넌트들은 별도 파일로 분리
 */
const ProfileScreenNew = ({ navigation, route }) => {
  const [activeNavTab, setActiveNavTab] = useState(3); // Profile tab
  const { userId } = route?.params || {};
  
  // 통합 프로필 훅 사용 - 모든 데이터와 액션을 한 번에 제공
  const {
    isLoading,
    hasError,
    errors,
    profile,
    readme,
    social,
    notes,
    photo,
    actions,
    computed,
  } = useProfile(userId);

  // 네비게이션 핸들러
  const handleNavChange = (tabIndex) => {
    setActiveNavTab(tabIndex);
    
    switch (tabIndex) {
      case 0: // Home
        navigation.navigate('Home');
        break;
      case 1: // Explore
        navigation.navigate('Explore');
        break;
      case 2: // Create Note
        navigation.navigate('CreateNote');
        break;
      case 3: // Profile
        // 이미 프로필 화면에 있음
        break;
      default:
        break;
    }
  };

  // 노트 관련 핸들러
  const handleNotePress = (note) => {
    navigation.navigate('NoteDetail', { 
      noteId: note.id,
      note: note 
    });
  };

  const handleViewAllNotes = () => {
    navigation.navigate('UserNotes', { 
      userId: computed.isOwnProfile ? null : userId,
      username: computed.displayUsername 
    });
  };

  // 프로필 편집 핸들러
  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  // 메시지/공유 핸들러 (향후 구현)
  const handleMessage = () => {
    // TODO: 메시지 기능 구현
    console.log('Message user:', computed.displayUsername);
  };

  const handleShare = () => {
    // TODO: 프로필 공유 기능 구현
    console.log('Share profile:', computed.displayUsername);
  };

  // 에러 상태 처리
  if (hasError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Failed to load profile. Please try again.
          </Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={actions.refreshAll}
          >
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 프로필 헤더 */}
          <ProfileHeader
            profilePhoto={photo.profilePhoto}
            displayUsername={computed.displayUsername}
            isOwnProfile={computed.isOwnProfile}
            uploading={photo.uploading}
            onPhotoPress={actions.changeProfilePhoto}
            onEditPress={handleEditProfile}
          />

          {/* 소셜 액션 버튼들 (다른 사용자 프로필일 때만) */}
          <SocialActions
            isFollowing={social.isFollowing}
            onFollowPress={actions.toggleFollow}
            onMessagePress={handleMessage}
            onSharePress={handleShare}
            loading={social.actionLoading}
            canFollow={computed.canFollow}
          />

          {/* 프로필 통계 */}
          <ProfileStats
            notesCount={computed.notesCount}
            starsCount={computed.totalStars}
            followersCount={social.followersCount}
            followingCount={social.followingCount}
            isOwnProfile={computed.isOwnProfile}
            onFollowersPress={() => navigation.navigate('FollowList', { 
              userId: userId || 'currentUser', 
              type: 'followers', 
              username: computed.displayUsername 
            })}
            onFollowingPress={() => navigation.navigate('FollowList', { 
              userId: userId || 'currentUser', 
              type: 'following', 
              username: computed.displayUsername 
            })}
          />

          {/* README 섹션 */}
          <ReadmeSection
            readmeData={readme.readmeData}
            isOwnProfile={computed.isOwnProfile}
            onToggleEdit={actions.toggleReadmeEdit}
            onTitleChange={readme.updateEditingTitle}
            onContentChange={readme.updateEditingContent}
            onSave={actions.saveReadme}
            onCancel={actions.cancelReadmeEdit}
            saving={readme.saving}
          />

          {/* 하이라이트 노트 */}
          <HighlightNotes
            notes={notes.highlightNotes}
            loading={notes.loading}
            onNotePress={handleNotePress}
            onStarPress={actions.toggleNoteStar}
            onViewAllPress={handleViewAllNotes}
            isNoteStarred={notes.isNoteStarred}
          />
        </ScrollView>

        {/* 하단 네비게이션 */}
        <View style={styles.bottomNav}>
          <BottomNavigationComponent
            activeTab={activeNavTab}
            onTabChange={handleNavChange}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100, // 하단 네비게이션 공간 확보
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  
  // 에러 상태 스타일
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
  },
  errorText: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Layout.spacing.large,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Layout.spacing.large,
    paddingVertical: Layout.spacing.medium,
    borderRadius: 8,
  },
  retryText: {
    color: Colors.white,
    fontWeight: '600',
  },
});

export default ProfileScreenNew;