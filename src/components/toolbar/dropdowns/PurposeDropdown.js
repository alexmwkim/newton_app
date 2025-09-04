import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BaseDropdown } from './BaseDropdown';
import { PURPOSE_ITEMS, DROPDOWN_CONFIG, DROPDOWN_TYPES } from '../../../constants/DropdownConfig';
import { getTemplate } from '../../../constants/NoteTemplates';

// 🎯 목적별 노트 생성 드롭다운
export const PurposeDropdown = ({ 
  onSelectPurpose, 
  onClose,
  animationValue 
}) => {
  console.log('🎯 PurposeDropdown: rendering with animationValue:', animationValue);
  const config = DROPDOWN_CONFIG[DROPDOWN_TYPES.PURPOSE];

  const handlePurposeSelect = (purposeItem) => {
    // 템플릿 가져오기
    const template = getTemplate(purposeItem.id);
    
    // 선택된 목적과 템플릿을 콜백으로 전달
    onSelectPurpose({
      purpose: purposeItem,
      template: template
    });
    
    // 드롭다운 닫기
    if (onClose) {
      onClose();
    }
  };

  const renderPurposeItem = (item, index) => {
    const isEven = index % 2 === 0;
    const itemStyle = {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#E5E5E5',
      borderRadius: 8,
      padding: 12,
      marginBottom: 8,
      width: '48%', // 2열 그리드
      minHeight: 80,
      justifyContent: 'center',
      alignItems: 'flex-start',
      ...(isEven ? { marginRight: '2%' } : { marginLeft: '2%' })
    };

    const iconStyle = {
      fontSize: 20,
      marginBottom: 6
    };

    const labelStyle = {
      fontSize: 14,
      fontFamily: 'Avenir Next',
      fontWeight: '600',
      color: '#000000',
      marginBottom: 2
    };

    const descriptionStyle = {
      fontSize: 11,
      fontFamily: 'Avenir Next',
      color: '#666666',
      lineHeight: 14
    };

    return (
      <TouchableOpacity
        key={item.id}
        style={itemStyle}
        onPress={() => handlePurposeSelect(item)}
        activeOpacity={0.7}
      >
        <Text style={iconStyle}>{item.icon}</Text>
        <Text style={labelStyle}>{item.label}</Text>
        <Text style={descriptionStyle} numberOfLines={2}>
          {item.description}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <BaseDropdown
      title={config.title}
      layout={config.layout}
      scrollable={config.scrollable}
      maxHeight={config.maxHeight}
      animated={true}
      animationValue={animationValue}
    >
      {PURPOSE_ITEMS.map((item, index) => renderPurposeItem(item, index))}
    </BaseDropdown>
  );
};