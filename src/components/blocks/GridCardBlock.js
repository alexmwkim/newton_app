/**
 * GridCardBlock - 그리드 카드 블록 컴포넌트
 * 작은 노트 카드 전용 최적화된 컴포넌트
 */

import React, { useRef, useCallback, memo } from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../../constants/Colors';
import { createNoteStyles } from '../../styles/CreateNoteStyles';

const GridCardBlock = memo(({
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
  onDelete = () => {},
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
    onDismiss?.();
    onFocus?.(index);
  }, [index, onFocus, onDismiss]);
  
  // 키 입력 핸들러 최적화
  const handleKeyPress = useCallback(({ nativeEvent }) => {
    onKeyPress?.(block, index, nativeEvent.key);
  }, [block, index, onKeyPress]);
  
  // 터치 핸들러 최적화
  const handlePressIn = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);
  
  // 삭제 핸들러 최적화
  const handleDelete = useCallback(() => {
    onDelete?.(index);
  }, [index, onDelete]);

  return (
    <View key={block.id} ref={blockRef} style={styles.gridCardBlock}>
      <View style={styles.gridCardHeader}>
        <TextInput
          ref={block.ref}
          style={styles.gridCardTitleInput}
          placeholder="Small note"
          multiline
          value={block.content || ''}
          onChangeText={handleTextChange}
          onPressIn={handlePressIn}
          onFocus={handleFocus}
          onKeyPress={handleKeyPress}
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          scrollEnabled={false}
          editable={isAuthor}
          inputAccessoryViewID="newton-toolbar"
          placeholderTextColor={Colors.secondaryText}
        />
        {isAuthor && (
          <TouchableOpacity 
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessible={true}
            accessibilityLabel="Delete grid card"
            accessibilityRole="button"
          >
            <Icon name="x" size={16} color="#888" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
});

GridCardBlock.displayName = 'GridCardBlock';

export default GridCardBlock;