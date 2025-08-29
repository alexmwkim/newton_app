import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { useFormatting } from './toolbar/ToolbarFormatting';
import { Colors } from '../constants/Colors';

/**
 * MultilineFormattedInput - 줄별 독립적인 포맷팅을 지원하는 텍스트 입력 컴포넌트
 * 각 줄이 개별 TextInput으로 구현되어 각각 다른 포맷 적용 가능
 */
const MultilineFormattedInput = ({
  value = '',
  onChangeText,
  onFocus,
  onBlur,
  placeholder = 'Write something',
  style = {},
  baseIndex = 0, // 블록의 기본 인덱스
  blocks = [],
  setFocusedIndex,
  isAuthor = true,
  inputAccessoryViewID = null, // ✅ InputAccessoryView ID 추가
  ...props
}) => {
  const { getDynamicTextStyle, setCurrentFocusedIndex } = useFormatting();
  
  // 텍스트를 줄별로 분할
  const lines = value.split('\n');
  const [focusedLineIndex, setFocusedLineIndex] = useState(-1);
  const lineRefs = useRef([]); // 각 줄의 TextInput ref 저장
  
  // 줄별 텍스트 변경 처리
  const handleLineChange = useCallback((lineIndex, newText) => {
    const newLines = [...lines];
    newLines[lineIndex] = newText;
    const newValue = newLines.join('\n');
    onChangeText?.(newValue);
  }, [lines, onChangeText]);
  
  // 새 줄 추가 (Enter 키)
  const handleEnterPress = useCallback((lineIndex) => {
    const newLines = [...lines];
    newLines.splice(lineIndex + 1, 0, ''); // 새 빈 줄 추가
    const newValue = newLines.join('\n');
    onChangeText?.(newValue);
    
    // 다음 줄로 포커스 이동
    setTimeout(() => {
      const nextLineRef = lineRefs.current[lineIndex + 1];
      if (nextLineRef) {
        nextLineRef.focus();
        console.log('📝 New line created in card - should reset formats');
      }
    }, 100);
  }, [lines, onChangeText]);
  
  // 줄 삭제 (빈 줄에서 Backspace)
  const handleLineDelete = useCallback((lineIndex) => {
    if (lines.length <= 1) return; // 최소 1줄은 유지
    
    const newLines = [...lines];
    newLines.splice(lineIndex, 1);
    const newValue = newLines.join('\n');
    onChangeText?.(newValue);
    
    // 이전 줄로 포커스 이동
    setTimeout(() => {
      const prevLineRef = lineRefs.current[lineIndex - 1];
      if (prevLineRef) {
        prevLineRef.focus();
      }
    }, 100);
  }, [lines, onChangeText]);
  
  // 줄 포커스 처리
  const handleLineFocus = useCallback((lineIndex) => {
    const globalIndex = baseIndex + lineIndex; // 전체 블록 시스템에서의 인덱스
    setFocusedLineIndex(lineIndex);
    setFocusedIndex?.(globalIndex);
    setCurrentFocusedIndex(globalIndex, blocks);
    onFocus?.(globalIndex);
  }, [baseIndex, setFocusedIndex, setCurrentFocusedIndex, blocks, onFocus]);
  
  // 줄 블러 처리
  const handleLineBlur = useCallback((lineIndex) => {
    setFocusedLineIndex(-1);
    onBlur?.(baseIndex + lineIndex);
  }, [baseIndex, onBlur]);
  
  // 키 입력 처리
  const handleKeyPress = useCallback((lineIndex, { nativeEvent }) => {
    const { key } = nativeEvent;
    console.log('🔤 Key pressed in line', lineIndex, ':', key);
    
    if (key === 'Enter') {
      console.log('⏎ Enter key - creating new line after', lineIndex);
      nativeEvent.preventDefault?.(); // 기본 Enter 동작 방지
      handleEnterPress(lineIndex);
      return;
    }
    
    if (key === 'Backspace' && lines[lineIndex] === '') {
      console.log('⌫ Backspace on empty line', lineIndex, '- deleting line');
      handleLineDelete(lineIndex);
      return;
    }
  }, [handleEnterPress, handleLineDelete, lines]);
  
  return (
    <View style={style}>
      {lines.map((line, lineIndex) => {
        const globalIndex = baseIndex + lineIndex;
        const lineStyle = getDynamicTextStyle(globalIndex, null);
        const isFocused = focusedLineIndex === lineIndex;
        
        return (
          <TextInput
            key={`line-${lineIndex}`}
            ref={(ref) => {
              lineRefs.current[lineIndex] = ref;
            }}
            style={[
              {
                fontSize: 16,
                lineHeight: 20,
                paddingVertical: 2,
                paddingHorizontal: 0,
                minHeight: Math.max(24, lineStyle.fontSize ? lineStyle.fontSize + 8 : 24),
                ...(Platform.OS === 'ios' && {
                  fontFamily: 'System'
                }),
                ...(Platform.OS === 'android' && {
                  textAlignVertical: 'top',
                  includeFontPadding: false
                })
              },
              lineStyle, // 줄별 독립적인 포맷 스타일 적용
              // 포커스 표시 제거 - 기본 TextInput 커서만 사용
            ]}
            value={line}
            onChangeText={(text) => handleLineChange(lineIndex, text)}
            onFocus={() => handleLineFocus(lineIndex)}
            onBlur={() => handleLineBlur(lineIndex)}
            onKeyPress={(event) => handleKeyPress(lineIndex, event)}
            onSubmitEditing={() => {
              console.log('📝 Submit editing on line', lineIndex, '- creating new line');
              handleEnterPress(lineIndex);
            }}
            placeholder={lineIndex === 0 ? placeholder : ''}
            placeholderTextColor={Colors.secondaryText}
            multiline={false} // 각 줄은 단일 라인
            returnKeyType="next" // Enter키를 다음 줄로 이동하는 키로 표시
            blurOnSubmit={false}
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            editable={isAuthor}
            // ✅ 원래 InputAccessoryView 툴바 연결
            inputAccessoryViewID={inputAccessoryViewID}
            {...props}
          />
        );
      })}
    </View>
  );
};

export default MultilineFormattedInput;