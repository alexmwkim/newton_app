import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Switch, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';
import { useNotesStore } from '../store/NotesStore';

const MoreScreen = ({ navigation }) => {
  // State for toggleable features
  const [gridView, setGridView] = useState(false);
  const [readingMode, setReadingMode] = useState(false);
  const [markdownPreview, setMarkdownPreview] = useState(true);
  const [notePreviews, setNotePreviews] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const { privateNotes, publicNotes } = useNotesStore();

  const handleBackPress = () => {
    navigation.goBack();
  };

  // Organization & Management
  const handleBulkActions = () => {
    console.log('Bulk Actions pressed');
    Alert.alert('Bulk Actions', 'Select multiple notes to delete, move, or archive them.');
  };

  const handleSortOptions = () => {
    console.log('Sort Options pressed');
    Alert.alert('Sort Options', 'Choose how to sort your notes:\n• Date Modified\n• Date Created\n• Title (A-Z)\n• Title (Z-A)');
  };

  const handleFilterOptions = () => {
    console.log('Filter Options pressed');
    Alert.alert('Filter Options', 'Filter your notes by:\n• Private/Public\n• Recent Activity\n• Favorites\n• Tags');
  };

  const handleFolderManagement = () => {
    console.log('Folder Management pressed');
    Alert.alert('Folder Management', 'Organize your notes into folders and subfolders.');
  };

  // Import/Export
  const handleExportAll = () => {
    console.log('Export All pressed');
    Alert.alert('Export All Notes', 'Export all your notes to:\n• PDF Format\n• Markdown Files\n• JSON Backup\n• HTML Pages');
  };

  const handleImportNotes = () => {
    console.log('Import Notes pressed');
    Alert.alert('Import Notes', 'Import notes from:\n• Other apps\n• Text files\n• Markdown files\n• JSON backups');
  };

  const handleBackupRestore = () => {
    console.log('Backup & Restore pressed');
    Alert.alert('Backup & Restore', 'Create a full backup of your notes or restore from a previous backup.');
  };

  const handleSyncStatus = () => {
    console.log('Sync Status pressed');
    Alert.alert('Sync Status', 'All notes are synced. Last sync: Just now\n\nTap to force sync all notes.');
  };

  // Advanced Features
  const handleArchive = () => {
    console.log('Archive pressed');
    Alert.alert('Archive', 'Archive old notes to keep your workspace clean while preserving them.');
  };

  const handleTemplates = () => {
    console.log('Templates pressed');
    Alert.alert('Templates', 'Create and manage note templates for faster note creation.');
  };

  const handleTags = () => {
    console.log('Tags pressed');
    Alert.alert('Tags Management', 'Manage tags and categories for better note organization.');
  };

  const handleSearchTools = () => {
    console.log('Search Tools pressed');
    Alert.alert('Search Tools', 'Advanced search options:\n• Search within content\n• Filter by date range\n• Save search queries');
  };

  // Quick Tools
  const handleScanner = () => {
    console.log('Scanner pressed');
    Alert.alert('Scanner', 'Scan documents, whiteboards, or handwritten notes directly into your notes.');
  };

  const handleVoiceNotes = () => {
    console.log('Voice Notes pressed');
    Alert.alert('Voice Notes', 'Record audio notes with automatic transcription.');
  };

  const handleStatistics = () => {
    const totalNotes = privateNotes.length + publicNotes.length;
    Alert.alert('Statistics', `📊 Your Newton Stats:\n\n• Total Notes: ${totalNotes}\n• Private Notes: ${privateNotes.length}\n• Public Notes: ${publicNotes.length}\n• Average notes per week: 3\n• Storage used: 2.4 MB`);
  };

  // Settings Shortcuts
  const handleNotifications = () => {
    console.log('Notifications pressed');
    navigation.navigate('settings'); // Navigate to settings screen
  };

  const handlePrivacy = () => {
    console.log('Privacy pressed');
    Alert.alert('Privacy Settings', 'Quick privacy controls:\n• Profile visibility\n• Note discoverability\n• Data sharing preferences');
  };

  const handleAbout = () => {
    console.log('About pressed');
    Alert.alert('About Newton', 'Newton v1.0.0\n\n"make good new days"\n\nYour minimalist note-taking companion for creating, sharing, and organizing thoughts.\n\n© 2024 Newton Team');
  };

  const MenuSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const MenuItem = ({ icon, title, onPress, rightElement, showChevron = true, description }) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemLeft}>
        <Icon name={icon} size={20} color={Colors.primaryText} />
        <View style={styles.menuItemTextContainer}>
          <Text style={styles.menuItemText}>{title}</Text>
          {description && <Text style={styles.menuItemDescription}>{description}</Text>}
        </View>
      </View>
      <View style={styles.menuItemRight}>
        {rightElement}
        {showChevron && <Icon name="chevron-right" size={16} color={Colors.secondaryText} />}
      </View>
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, title, description, value, onValueChange }) => (
    <View style={styles.menuItem}>
      <View style={styles.menuItemLeft}>
        <Icon name={icon} size={20} color={Colors.primaryText} />
        <View style={styles.menuItemTextContainer}>
          <Text style={styles.menuItemText}>{title}</Text>
          {description && <Text style={styles.menuItemDescription}>{description}</Text>}
        </View>
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
          <Text style={styles.headerTitle}>Note Setting</Text>
          <View style={styles.headerRight} />
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Organization & Management */}
          <MenuSection title="Organization & Management">
            <MenuItem
              icon="check-square"
              title="Bulk Actions"
              description="Select multiple notes to manage"
              onPress={handleBulkActions}
            />
            <MenuItem
              icon="sort-desc"
              title="Sort Options"
              description="Date, Title, Modified"
              onPress={handleSortOptions}
            />
            <MenuItem
              icon="filter"
              title="Filter Options"
              description="Private/Public, Recent, Favorites"
              onPress={handleFilterOptions}
            />
            <MenuItem
              icon="folder"
              title="Folder Management"
              description="Create and organize folders"
              onPress={handleFolderManagement}
            />
          </MenuSection>

          {/* Import/Export */}
          <MenuSection title="Import/Export">
            <MenuItem
              icon="download"
              title="Export All Notes"
              description="PDF, Markdown, JSON formats"
              onPress={handleExportAll}
            />
            <MenuItem
              icon="upload"
              title="Import Notes"
              description="From other apps or files"
              onPress={handleImportNotes}
            />
            <MenuItem
              icon="hard-drive"
              title="Backup & Restore"
              description="Full backup and restore"
              onPress={handleBackupRestore}
            />
            <MenuItem
              icon="refresh-cw"
              title="Sync Status"
              description="Check sync status"
              onPress={handleSyncStatus}
            />
          </MenuSection>

          {/* View & Display */}
          <MenuSection title="View & Display">
            <ToggleItem
              icon="grid"
              title="Grid View"
              description="Show notes in grid layout"
              value={gridView}
              onValueChange={setGridView}
            />
            <ToggleItem
              icon="book-open"
              title="Reading Mode"
              description="Distraction-free reading"
              value={readingMode}
              onValueChange={setReadingMode}
            />
            <ToggleItem
              icon="eye"
              title="Note Previews"
              description="Show content preview"
              value={notePreviews}
              onValueChange={setNotePreviews}
            />
            <ToggleItem
              icon="code"
              title="Markdown Preview"
              description="Render markdown in notes"
              value={markdownPreview}
              onValueChange={setMarkdownPreview}
            />
          </MenuSection>

          {/* Advanced Features */}
          <MenuSection title="Advanced Features">
            <MenuItem
              icon="archive"
              title="Archive"
              description="Archive old notes"
              onPress={handleArchive}
            />
            <MenuItem
              icon="file-text"
              title="Templates"
              description="Create note templates"
              onPress={handleTemplates}
            />
            <MenuItem
              icon="tag"
              title="Tags"
              description="Manage tags and categories"
              onPress={handleTags}
            />
            <MenuItem
              icon="search"
              title="Search Tools"
              description="Advanced search options"
              onPress={handleSearchTools}
            />
          </MenuSection>

          {/* Quick Tools */}
          <MenuSection title="Quick Tools">
            <MenuItem
              icon="camera"
              title="Scanner"
              description="Scan documents to notes"
              onPress={handleScanner}
            />
            <MenuItem
              icon="mic"
              title="Voice Notes"
              description="Record audio notes"
              onPress={handleVoiceNotes}
            />
            <MenuItem
              icon="bar-chart-2"
              title="Statistics"
              description="View note statistics"
              onPress={handleStatistics}
            />
          </MenuSection>

          {/* Settings Shortcuts */}
          <MenuSection title="Settings Shortcuts">
            <ToggleItem
              icon="moon"
              title="Dark Mode"
              description="Toggle dark theme"
              value={darkMode}
              onValueChange={setDarkMode}
            />
            <MenuItem
              icon="bell"
              title="Notifications"
              description="Notification preferences"
              onPress={handleNotifications}
            />
            <MenuItem
              icon="shield"
              title="Privacy"
              description="Quick privacy settings"
              onPress={handlePrivacy}
            />
            <MenuItem
              icon="info"
              title="About"
              description="App info and help"
              onPress={handleAbout}
            />
          </MenuSection>
        </ScrollView>
      </View>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
  menuItem: {
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
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.md,
    flex: 1,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
  },
  menuItemDescription: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
});

export default MoreScreen;