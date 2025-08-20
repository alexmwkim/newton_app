import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { useTranslation } from '../localization/i18n';
import { useAuth } from '../contexts/AuthContext';

const SettingsScreen = ({ navigation }) => {
  const { t, currentLanguage, setLanguage, languages, languageNames } = useTranslation();
  const { signOut } = useAuth();
  
  // State for toggleable settings
  const [darkMode, setDarkMode] = useState(false);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [noteComments, setNoteComments] = useState(true);
  const [followNotifications, setFollowNotifications] = useState(true);
  const [defaultPrivate, setDefaultPrivate] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [profileVisible, setProfileVisible] = useState(true);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleProfileInfo = () => {
    console.log('Profile Info pressed');
    // TODO: Navigate to profile edit screen
  };

  const handlePrivacySettings = () => {
    console.log('Privacy Settings pressed');
    // TODO: Navigate to privacy settings screen
  };

  const handleAccountManagement = () => {
    console.log('Account Management pressed');
    // TODO: Navigate to account management screen
  };

  const handleFontSize = () => {
    console.log('Font Size pressed');
    // TODO: Show font size picker
  };

  const handleExportNotes = () => {
    console.log('Export Notes pressed');
    // TODO: Show export options
  };

  const handleBackupSync = () => {
    console.log('Backup & Sync pressed');
    // TODO: Navigate to backup settings
  };

  const handlePrivacyPolicy = () => {
    console.log('Privacy Policy pressed');
    // TODO: Open privacy policy
  };

  const handleTermsOfService = () => {
    console.log('Terms of Service pressed');
    // TODO: Open terms of service
  };

  const handleContactSupport = () => {
    console.log('Contact Support pressed');
    // TODO: Open support contact
  };

  const handleRateApp = () => {
    console.log('Rate App pressed');
    // TODO: Open app store rating
  };

  const handleLanguagePress = () => {
    console.log('🌐 Language settings pressed');
    setLanguageModalVisible(true);
  };

  const handleLanguageSelect = (langCode) => {
    console.log('🌐 Language selected:', langCode);
    setLanguage(langCode);
    setLanguageModalVisible(false);
  };

  const handleLogout = () => {
    Alert.alert(
      t('profile.settings.logout'),
      t('profile.settings.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.settings.logout'), 
          style: 'destructive', 
          onPress: async () => {
            try {
              console.log('🚪 Signing out user...');
              await signOut();
              console.log('✅ User signed out successfully');
              // Navigation will be handled by AuthContext
            } catch (error) {
              console.error('❌ Logout error:', error);
              Alert.alert(t('common.error'), 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Account deletion confirmed') }
      ]
    );
  };

  const SettingsSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingsItem = ({ icon, title, onPress, rightElement, showChevron = true }) => (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress}>
      <View style={styles.settingsItemLeft}>
        <Icon name={icon} size={20} color={Colors.primaryText} />
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      <View style={styles.settingsItemRight}>
        {rightElement}
        {showChevron && <Icon name="chevron-right" size={16} color={Colors.secondaryText} />}
      </View>
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, title, value, onValueChange }) => (
    <View style={styles.settingsItem}>
      <View style={styles.settingsItemLeft}>
        <Icon name={icon} size={20} color={Colors.primaryText} />
        <Text style={styles.settingsItemText}>{title}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: Colors.border, true: Colors.floatingButton }}
        thumbColor={Colors.mainBackground}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="arrow-left" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.settings.title')}</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Language & Account Section */}
          <SettingsSection title={t('profile.settings.account')}>
            <SettingsItem
              icon="globe"
              title={t('profile.settings.language')}
              onPress={handleLanguagePress}
              rightElement={<Text style={styles.settingsValue}>{languageNames[currentLanguage]}</Text>}
            />
            <SettingsItem
              icon="user"
              title="Profile Information"
              onPress={handleProfileInfo}
            />
            <SettingsItem
              icon="shield"
              title={t('profile.settings.privacy')}
              onPress={handlePrivacySettings}
            />
            <ToggleItem
              icon="eye"
              title={t('profile.settings.publicProfile')}
              value={profileVisible}
              onValueChange={setProfileVisible}
            />
          </SettingsSection>

          {/* Appearance & Display Section */}
          <SettingsSection title="Appearance & Display">
            <ToggleItem
              icon="moon"
              title="Dark Mode"
              value={darkMode}
              onValueChange={setDarkMode}
            />
            <SettingsItem
              icon="type"
              title="Font Size"
              onPress={handleFontSize}
              rightElement={<Text style={styles.settingsValue}>Medium</Text>}
            />
          </SettingsSection>

          {/* Note Management Section */}
          <SettingsSection title="Note Management">
            <ToggleItem
              icon="lock"
              title="Default Notes Private"
              value={defaultPrivate}
              onValueChange={setDefaultPrivate}
            />
            <ToggleItem
              icon="save"
              title="Auto-save"
              value={autoSave}
              onValueChange={setAutoSave}
            />
            <SettingsItem
              icon="download"
              title="Export Notes"
              onPress={handleExportNotes}
            />
            <SettingsItem
              icon="cloud"
              title="Backup & Sync"
              onPress={handleBackupSync}
            />
          </SettingsSection>

          {/* Notifications Section */}
          <SettingsSection title="Notifications">
            <ToggleItem
              icon="bell"
              title="Push Notifications"
              value={pushNotifications}
              onValueChange={setPushNotifications}
            />
            <ToggleItem
              icon="message-circle"
              title="Note Comments"
              value={noteComments}
              onValueChange={setNoteComments}
            />
            <ToggleItem
              icon="user-plus"
              title="Follow Notifications"
              value={followNotifications}
              onValueChange={setFollowNotifications}
            />
          </SettingsSection>

          {/* About & Support Section */}
          <SettingsSection title="About & Support">
            <SettingsItem
              icon="info"
              title="App Version"
              onPress={() => {}}
              rightElement={<Text style={styles.settingsValue}>1.0.0</Text>}
              showChevron={false}
            />
            <SettingsItem
              icon="shield"
              title="Privacy Policy"
              onPress={handlePrivacyPolicy}
            />
            <SettingsItem
              icon="file-text"
              title="Terms of Service"
              onPress={handleTermsOfService}
            />
            <SettingsItem
              icon="mail"
              title="Contact Support"
              onPress={handleContactSupport}
            />
            <SettingsItem
              icon="star"
              title="Rate App"
              onPress={handleRateApp}
            />
          </SettingsSection>

          {/* Account Actions */}
          <SettingsSection title="Account Actions">
            <TouchableOpacity style={styles.logoutItem} onPress={handleLogout}>
              <View style={styles.settingsItemLeft}>
                <Icon name="log-out" size={20} color={Colors.floatingButton} />
                <Text style={[styles.settingsItemText, { color: Colors.floatingButton }]}>{t('profile.settings.logout')}</Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.floatingButton} />
            </TouchableOpacity>
          </SettingsSection>

          {/* Danger Zone */}
          <SettingsSection title="Danger Zone">
            <TouchableOpacity style={styles.dangerItem} onPress={handleDeleteAccount}>
              <View style={styles.settingsItemLeft}>
                <Icon name="trash-2" size={20} color={Colors.danger} />
                <Text style={[styles.settingsItemText, { color: Colors.danger }]}>Delete Account</Text>
              </View>
              <Icon name="chevron-right" size={16} color={Colors.danger} />
            </TouchableOpacity>
          </SettingsSection>
        </ScrollView>
      </View>

      {/* Language Selection Modal */}
      <Modal
        transparent={true}
        visible={languageModalVisible}
        animationType="fade"
        onRequestClose={() => setLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalOverlayTouch} 
            activeOpacity={1} 
            onPress={() => setLanguageModalVisible(false)}
          />
          
          <View style={styles.languageModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('profile.settings.languageSelection')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)} style={styles.modalCloseButton}>
                <Icon name="x" size={24} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.languageList}>
              {Object.entries(languages).map(([key, langCode]) => (
                <TouchableOpacity
                  key={langCode}
                  style={styles.languageOption}
                  onPress={() => handleLanguageSelect(langCode)}
                >
                  <Text style={styles.languageOptionText}>{languageNames[langCode]}</Text>
                  {currentLanguage === langCode && (
                    <Icon name="check" size={20} color={Colors.floatingButton} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.mainBackground,
  },
  content: {
    flex: 1,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.md,
    paddingTop: Layout.spacing.lg,
  },
  backButton: {
    padding: 8,
    marginLeft: 12, // 화면 가장자리에서 20px (12+8)
  },
  headerTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.medium,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    letterSpacing: -0.3,
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Layout.spacing.xl,
  },
  section: {
    marginBottom: Layout.spacing.xl,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.small,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: Layout.screen.padding,
    marginBottom: Layout.spacing.sm,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
    backgroundColor: Colors.noteCard,
    marginHorizontal: Layout.screen.padding,
    marginBottom: 1,
    borderRadius: 0,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    flex: 1,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  settingsItemText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  settingsValue: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
  },
  logoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
    backgroundColor: Colors.noteCard,
    marginHorizontal: Layout.screen.padding,
    marginBottom: 1,
    borderRadius: 0,
  },
  dangerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.screen.padding,
    paddingVertical: Layout.spacing.lg,
    backgroundColor: Colors.noteCard,
    marginHorizontal: Layout.screen.padding,
    marginBottom: 1,
    borderRadius: 0,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlayTouch: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  languageModal: {
    backgroundColor: Colors.mainBackground,
    borderRadius: 12,
    marginHorizontal: 32,
    maxWidth: 320,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: Typography.fontSize.medium,
    fontWeight: Typography.fontWeight.semibold,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  modalCloseButton: {
    padding: Layout.spacing.xs,
  },
  languageList: {
    paddingVertical: Layout.spacing.sm,
  },
  languageOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.md,
  },
  languageOptionText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
});

export default SettingsScreen;