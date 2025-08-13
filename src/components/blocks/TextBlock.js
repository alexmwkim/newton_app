/**
 * TextBlock - 텍스트 입력 블록 컴포넌트
 * 텍스트 입력 전용 최적화된 컴포넌트
 */

import React, { useRef, useCallback, memo } from 'react';
import { View, TextInput } from 'react-native';
import { createNoteStyles } from '../../styles/CreateNoteStyles';

const TextBlock = memo(({
  // 공통 Props
  block,
  index,
  isAuthor = true,
  
  // 텍스트 관련 Props
  onTextChange,
  onKeyPress,
  onFocus,
  
  // 키보드 관련 Props
  keyboardConfig = {},
  
  // 이벤트 핸들러
  onDismiss = () => {}
}) => {
  const styles = createNoteStyles;
  const blockRef = useRef(null);
  
  // 텍스트 변경 핸들러 최적화
  const handleTextChange = useCallback((text) => {
    onTextChange?.(block.id, text);
  }, [block.id, onTextChange]);
  
  // 포커스 핸들러 최적화
  const handleFocus = useCallback(() => {
    console.log('🎯 TextBlock focused - should show toolbar, block ID:', block.id, 'index:', index);
    console.log('🔧 TextInput inputAccessoryViewID:', 'newton-toolbar');
    console.log('🔧 isAuthor:', isAuthor, 'editable:', isAuthor !== false);
    console.log('🔧 Forcing keyboard focus...');
    onDismiss?.();
    onFocus?.(index);
    
    // 키보드가 나타나도록 강제 포커스
    setTimeout(() => {
      if (block.ref?.current) {
        block.ref.current.focus();
        console.log('🔧 Forced focus applied to TextInput');
      }
    }, 50);
  }, [index, onFocus, onDismiss, block.id, block.ref]);
  
  // 키 입력 핸들러 최적화
  const handleKeyPress = useCallback(({ nativeEvent }) => {
    onKeyPress?.(block, index, nativeEvent.key);
  }, [block, index, onKeyPress]);
  
  // 터치 핸들러 최적화
  const handlePressIn = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);
  
  // 콘텐츠 크기 변경 핸들러
  const handleContentSizeChange = useCallback(({ nativeEvent }) => {
    // KeyboardAvoidingView가 자동 처리
    console.log('📏 Text block content size changed:', nativeEvent.contentSize);
  }, []);

  return (
    <View key={block.id} ref={blockRef}>
      <TextInput
        ref={block.ref}
        style={styles.textInput}
        multiline
        placeholder=" "
        value={block.content || ''}
        onChangeText={handleTextChange}
        onPressIn={handlePressIn}
        onFocus={handleFocus}
        onKeyPress={handleKeyPress}
        onContentSizeChange={handleContentSizeChange}
        autoCorrect={false}
        autoComplete="off"
        spellCheck={false}
        textAlignVertical="top"
        scrollEnabled={false}
        editable={true} // 임시로 항상 편집 가능하게 설정
        inputAccessoryViewID="newton-toolbar"
        placeholderTextColor="#999"
        showSoftInputOnFocus={true} // 키보드 강제 표시
        blurOnSubmit={false} // 엔터키 눌러도 키보드 유지
      />
    </View>
  );
});

TextBlock.displayName = 'TextBlock';

export default TextBlock;