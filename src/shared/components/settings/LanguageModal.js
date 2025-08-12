/**
 * LanguageModal - 언어 선택 모달 컴포넌트
 */

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../../constants/Colors';
import { ModalOverlay, ModalSection, ModalMenuItem } from '../modal';

const LanguageModal = ({ 
  visible, 
  onClose, 
  languages, 
  languageNames,
  currentLanguage, 
  onLanguageSelect 
}) => {
  const handleLanguageSelect = (langCode) => {
    onLanguageSelect(langCode);
    onClose();
  };

  return (
    <ModalOverlay visible={visible} onClose={onClose}>
      <ModalSection title="🌐 Language">
        {Object.entries(languages).map(([key, langCode]) => (
          <ModalMenuItem
            key={langCode}
            title={languageNames[langCode]}
            onPress={() => handleLanguageSelect(langCode)}
            isSelected={currentLanguage === langCode}
          />
        ))}
      </ModalSection>
    </ModalOverlay>
  );
};

export default LanguageModal;