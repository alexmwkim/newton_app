/**
 * SettingsMenu - 노트 설정 메뉴 모달
 * 소유자/방문자별 다른 메뉴 제공
 */

import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';

const SettingsMenu = ({
  visible = false,
  note,
  isOwner = false,
  onClose,
  onAction
}) => {
  const handleAction = (action) => {
    onClose?.();
    onAction?.(action, note);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.menu}>
          {isOwner ? (
            <OwnerMenu note={note} onAction={handleAction} />
          ) : (
            <VisitorMenu note={note} onAction={handleAction} />
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// 소유자 메뉴 컴포넌트
const OwnerMenu = ({ note, onAction }) => (
  <>
    <MenuItem
      icon="edit-3"
      text="Edit"
      onPress={() => onAction('edit')}
    />
    <MenuItem
      icon="share"
      text="Share"
      onPress={() => onAction('share')}
    />
    <MenuItem
      icon={note?.isPublic ? "lock" : "unlock"}
      text={note?.isPublic ? 'Make Private' : 'Make Public'}
      onPress={() => onAction('togglePublic')}
    />
    <MenuDivider />
    <MenuItem
      icon="trash-2"
      text="Delete"
      textColor="#FF3B30"
      iconColor="#FF3B30"
      onPress={() => onAction('delete')}
    />
  </>
);

// 방문자 메뉴 컴포넌트
const VisitorMenu = ({ note, onAction }) => (
  <>
    <MenuItem
      icon="git-branch"
      text="Fork"
      onPress={() => onAction('fork')}
    />
    <MenuItem
      icon="share"
      text="Share"
      onPress={() => onAction('share')}
    />
    {note?.isPublic && (
      <MenuItem
        icon="link"
        text="Copy Link"
        onPress={() => onAction('copyLink')}
      />
    )}
  </>
);

// 메뉴 아이템 컴포넌트
const MenuItem = ({
  icon,
  text,
  onPress,
  textColor = Colors.primaryText,
  iconColor = Colors.primaryText
}) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <Icon name={icon} size={18} color={iconColor} />
    <Text style={[styles.menuText, { color: textColor }]}>{text}</Text>
  </TouchableOpacity>
);

// 메뉴 구분선 컴포넌트
const MenuDivider = () => (
  <View style={styles.menuDivider} />
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menu: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: Layout.spacing.sm,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
    gap: Layout.spacing.sm,
  },
  menuText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.primary,
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Layout.spacing.xs,
  },
});

OwnerMenu.displayName = 'OwnerMenu';
VisitorMenu.displayName = 'VisitorMenu';
MenuItem.displayName = 'MenuItem';
MenuDivider.displayName = 'MenuDivider';
SettingsMenu.displayName = 'SettingsMenu';

export default SettingsMenu;