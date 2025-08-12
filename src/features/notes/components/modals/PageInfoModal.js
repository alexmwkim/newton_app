/**
 * PageInfoModal - 페이지 정보 모달
 * 노트의 메타데이터 표시
 */

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../../constants/Colors';
import Typography from '../../../../constants/Typography';
import Layout from '../../../../constants/Layout';

const PageInfoModal = ({
  visible = false,
  note,
  onClose
}) => {
  if (!visible || !note) return null;

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
        <View style={styles.modal}>
          <ModalHeader onClose={onClose} />
          <PageInfoContent note={note} />
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// 모달 헤더 컴포넌트
const ModalHeader = ({ onClose }) => (
  <View style={styles.header}>
    <Text style={styles.title}>Page Information</Text>
    <TouchableOpacity onPress={onClose}>
      <Icon name="x" size={20} color={Colors.secondaryText} />
    </TouchableOpacity>
  </View>
);

// 페이지 정보 콘텐츠 컴포넌트
const PageInfoContent = ({ note }) => (
  <View style={styles.content}>
    <InfoRow label="Title" value={note.title || 'Untitled'} />
    <InfoRow 
      label="Created" 
      value={note.created_at ? new Date(note.created_at).toLocaleString() : 'Unknown'} 
    />
    <InfoRow 
      label="Updated" 
      value={note.updated_at ? new Date(note.updated_at).toLocaleString() : 'Unknown'} 
    />
    <InfoRow 
      label="Visibility" 
      value={note.isPublic ? 'Public' : 'Private'} 
    />
    <InfoRow label="Stars" value={String(note.starCount || 0)} />
    <InfoRow label="Forks" value={String(note.forkCount || 0)} />
  </View>
);

// 정보 행 컴포넌트
const InfoRow = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: Layout.spacing.lg,
    marginHorizontal: Layout.spacing.lg,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Layout.spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.large,
    fontFamily: Typography.fontFamily.primary,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primaryText,
  },
  content: {
    gap: Layout.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.secondaryText,
    fontWeight: Typography.fontWeight.medium,
  },
  infoValue: {
    fontSize: Typography.fontSize.small,
    fontFamily: Typography.fontFamily.primary,
    color: Colors.primaryText,
    textAlign: 'right',
    flex: 1,
    marginLeft: Layout.spacing.sm,
  },
});

ModalHeader.displayName = 'ModalHeader';
PageInfoContent.displayName = 'PageInfoContent';
InfoRow.displayName = 'InfoRow';
PageInfoModal.displayName = 'PageInfoModal';

export default PageInfoModal;