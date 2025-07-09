import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

export const FolderTree = ({
  folders,
  currentFolderId,
  onFolderPress,
  onAddFolder,
  level = 0
}) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  const toggleFolder = (folderId) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId);
    } else {
      newExpanded.add(folderId);
    }
    setExpandedFolders(newExpanded);
  };

  const handleAddFolder = (parentId) => {
    Alert.prompt(
      'New Folder',
      'Enter folder name:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create',
          onPress: (folderName) => {
            if (folderName && folderName.trim()) {
              onAddFolder({
                name: folderName.trim(),
                parentId: parentId
              });
            }
          }
        }
      ],
      'plain-text'
    );
  };

  return (
    <View style={[styles.container, { marginLeft: level * 20 }]}>
      {folders.map(folder => (
        <View key={folder.id}>
          <TouchableOpacity
            style={[
              styles.folderItem,
              currentFolderId === folder.id && styles.selectedFolder
            ]}
            onPress={() => onFolderPress(folder.id)}
          >
            <TouchableOpacity
              style={styles.expandButton}
              onPress={() => toggleFolder(folder.id)}
            >
              <Icon
                name={expandedFolders.has(folder.id) ? 'chevron-down' : 'chevron-right'}
                size={16}
                color={Colors.secondaryText}
              />
            </TouchableOpacity>
            
            <Icon name="folder" size={20} color={Colors.floatingButton} />
            <Text style={styles.folderName}>{folder.name}</Text>
            
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleAddFolder(folder.id)}
            >
              <Icon name="plus" size={16} color={Colors.floatingButton} />
            </TouchableOpacity>
          </TouchableOpacity>

          {expandedFolders.has(folder.id) && folder.children.length > 0 && (
            <FolderTree
              folders={folder.children}
              currentFolderId={currentFolderId}
              onFolderPress={onFolderPress}
              onAddFolder={onAddFolder}
              level={level + 1}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  folderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Layout.spacing.sm,
    paddingHorizontal: Layout.screen.padding,
    borderRadius: Layout.borderRadius,
    marginVertical: 2,
  },
  selectedFolder: {
    backgroundColor: Colors.noteCard,
  },
  expandButton: {
    padding: 4,
    marginRight: 4,
  },
  folderName: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    marginLeft: Layout.spacing.sm,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
  },
  addButton: {
    padding: 4,
  },
});