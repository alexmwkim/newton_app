/**
 * NoteEditorToolbar - 노트 에디터 툴바 컴포넌트
 * 포맷팅, 블록 추가, 미디어 등의 기능 제공
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import Layout from '../../../constants/Layout';

const TOOLBAR_ID = 'newton-toolbar';

const toolbarItems = [
  { id: 'bold', icon: 'bold', label: 'Bold' },
  { id: 'italic', icon: 'italic', label: 'Italic' },
  { id: 'heading', icon: 'type', label: 'Heading' },
  { id: 'bullet', icon: 'list', label: 'Bullet List' },
  { id: 'divider', type: 'divider' },
  { id: 'image', icon: 'image', label: 'Add Image' },
  { id: 'link', icon: 'link', label: 'Add Link' },
  { id: 'code', icon: 'code', label: 'Code Block' },
  { id: 'divider2', type: 'divider' },
  { id: 'addText', icon: 'plus', label: 'Add Text Block' },
  { id: 'addCard', icon: 'square', label: 'Add Card Block' }
];

const NoteEditorToolbar = ({
  onFormatPress,
  onBlockAdd,
  onImageAdd,
  onLinkAdd,
  style,
  visible = true
}) => {
  if (!visible) return null;

  const handleItemPress = (item) => {
    switch (item.id) {
      case 'bold':
      case 'italic':
      case 'heading':
      case 'bullet':
        onFormatPress?.(item.id);
        break;
      
      case 'image':
        onImageAdd?.();
        break;
      
      case 'link':
        onLinkAdd?.();
        break;
      
      case 'code':
        onBlockAdd?.('code');
        break;
      
      case 'addText':
        onBlockAdd?.('text');
        break;
      
      case 'addCard':
        onBlockAdd?.('card');
        break;
    }
  };

  const renderItem = (item, index) => {
    if (item.type === 'divider') {
      return (
        <View key={item.id} style={styles.divider} />
      );
    }

    return (
      <TouchableOpacity
        key={item.id}
        style={styles.toolbarButton}
        onPress={() => handleItemPress(item)}
        accessibilityLabel={item.label}
        accessibilityRole="button"
      >
        <Icon
          name={item.icon}
          size={18}
          color={Colors.primaryText}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]} inputAccessoryViewID={TOOLBAR_ID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        style={styles.scrollView}
      >
        {toolbarItems.map(renderItem)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.noteCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: Layout.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: Layout.spacing.md,
    alignItems: 'center',
    gap: Layout.spacing.xs,
  },
  toolbarButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.border,
    marginHorizontal: Layout.spacing.xs,
  },
});

NoteEditorToolbar.displayName = 'NoteEditorToolbar';

// Export toolbar ID for InputAccessoryView
export { TOOLBAR_ID };
export default NoteEditorToolbar;