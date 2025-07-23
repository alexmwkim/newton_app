import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import Typography from '../constants/Typography';
import Layout from '../constants/Layout';

const RichTextRenderer = ({ content, onFolderPress, style }) => {
  console.log('🎨 RichTextRenderer received content:', typeof content, content?.length || 0, 'chars');
  
  // Safety check for content
  if (!content || typeof content !== 'string') {
    console.log('⚠️ RichTextRenderer: No valid content, showing fallback');
    return (
      <View style={styles.container}>
        <Text style={[styles.text, style]}>No content available</Text>
      </View>
    );
  }

  // Function to parse content and detect folder links
  const parseContent = (text) => {
    if (!text || typeof text !== 'string') return [{ type: 'text', content: '' }];
    
    // Regex to match folder links: 📁 [Folder Name](#folder-123)
    const folderRegex = /📁\s*\[([^\]]+)\]\(#folder-(\d+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    
    while ((match = folderRegex.exec(text)) !== null) {
      // Add text before the folder link
      if (match.index > lastIndex) {
        const beforeText = text.slice(lastIndex, match.index);
        if (beforeText) {
          parts.push({ type: 'text', content: beforeText });
        }
      }
      
      // Add the folder link
      parts.push({
        type: 'folder',
        name: match[1],
        folderId: parseInt(match[2]),
        fullMatch: match[0]
      });
      
      lastIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      const remainingText = text.slice(lastIndex);
      if (remainingText) {
        parts.push({ type: 'text', content: remainingText });
      }
    }
    
    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  const renderPart = (part, index) => {
    if (part.type === 'folder') {
      return (
        <TouchableOpacity
          key={index}
          style={styles.folderLink}
          onPress={() => {
            console.log('📁 Folder pressed:', part.name, part.folderId);
            if (onFolderPress) {
              onFolderPress(part.folderId, part.name);
            }
          }}
        >
          <Icon name="folder" size={18} color={Colors.floatingButton} />
          <Text style={styles.folderLinkText}>{part.name}</Text>
          <Icon name="chevron-right" size={14} color={Colors.secondaryText} />
        </TouchableOpacity>
      );
    }
    
    // Regular text - simplified rendering to prevent issues
    return (
      <Text key={index} style={[styles.text, style]}>
        {part.content || ''}
      </Text>
    );
  };

  try {
    const parts = parseContent(content);

    return (
      <View style={styles.container}>
        {parts.map((part, index) => renderPart(part, index))}
      </View>
    );
  } catch (error) {
    console.error('RichTextRenderer error:', error);
    return (
      <View style={styles.container}>
        <Text style={[styles.text, style]}>{content}</Text>
      </View>
    );
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  text: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    lineHeight: 24,
  },
  folderLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.noteCard,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    borderRadius: Layout.borderRadius,
    marginVertical: 2,
    gap: Layout.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.floatingButton,
  },
  folderLinkText: {
    flex: 1,
    fontSize: Typography.fontSize.body,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primaryText,
    fontFamily: Typography.fontFamily.primary,
  },
});

export default RichTextRenderer;