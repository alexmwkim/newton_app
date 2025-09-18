import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, TextInput, Platform } from 'react-native';
import { useFormatting } from './toolbar/ToolbarFormatting';
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';
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
  onKeyPress, // 외부 키 이벤트 핸들러 추가
  multiline = true, // 멀티라인 지원
  placeholder = 'Write something',
  style = {},
  baseIndex = 0, // 블록의 기본 인덱스
  blocks = [],
  setFocusedIndex,
  isAuthor = true,
  inputAccessoryViewID = null, // ✅ InputAccessoryView ID 추가
  autoFocus = false, // 🔧 FIX: 자동 포커스 옵션 추가
  ...props
}) => {
  console.log('🔍 MultilineFormattedInput render - multiline:', multiline, 'value:', value.length > 0 ? `"${value.substring(0, 20)}..."` : 'empty');
  
  const { getDynamicTextStyle, setCurrentFocusedIndex, resetFormatsIfTextEmpty } = useFormatting();
  const { keyboardVisible } = useSimpleToolbar();
  
  // 텍스트를 줄별로 분할 - 🔧 FIX: 빈 값일 때도 최소 1줄은 보장
  const lines = value ? value.split('\n') : [''];
  const [focusedLineIndex, setFocusedLineIndex] = useState(-1);
  const lineRefs = useRef([]); // 각 줄의 TextInput ref 저장
  
  // 줄별 텍스트 변경 처리
  const handleLineChange = useCallback((lineIndex, newText) => {
    // 줄바꿈 허용 - TextInput의 multiline 동작을 지원
    const cleanText = newText;
    
    const newLines = [...lines];
    newLines[lineIndex] = cleanText;
    const newValue = newLines.join('\n');
    
    // ✅ 텍스트가 비어있으면 해당 줄의 포맷 초기화
    const globalIndex = baseIndex + lineIndex;
    if (resetFormatsIfTextEmpty) {
      resetFormatsIfTextEmpty(globalIndex, cleanText);
    }
    
    onChangeText?.(newValue);
  }, [lines, onChangeText, baseIndex, resetFormatsIfTextEmpty]);
  
  // 새 줄 추가 (Enter 키) - 🔧 FIX: 빈 줄 생성하지 않고 현재 줄에서 줄바꿈
  const handleEnterPress = useCallback((lineIndex) => {
    const newLines = [...lines];
    // 현재 줄의 커서 위치에서 분할 (빈 줄 추가하지 않음)
    const currentLine = newLines[lineIndex] || '';
    newLines[lineIndex] = currentLine; // 현재 줄 유지
    newLines.splice(lineIndex + 1, 0, ''); // 새 줄 추가는 필요시에만
    const newValue = newLines.join('\n');
    onChangeText?.(newValue);
    
    // ✅ Enter 키도 즉시 처리로 부드러운 경험
    const nextGlobalIndex = baseIndex + lineIndex + 1;
    
    // 상태 즉시 업데이트  
    setFocusedLineIndex(lineIndex + 1);
    setFocusedIndex?.(nextGlobalIndex);
    setCurrentFocusedIndex(nextGlobalIndex, blocks);
    
    // requestAnimationFrame으로 DOM 업데이트 후 포커스
    requestAnimationFrame(() => {
      const nextLineRef = lineRefs.current[lineIndex + 1];
      if (nextLineRef) {
        nextLineRef.focus();
        console.log('📝 New line created and focused (smooth Enter transition)');
      }
    });
  }, [lines, onChangeText, keyboardVisible, baseIndex, setFocusedIndex, setCurrentFocusedIndex, blocks, setFocusedLineIndex]);
  
  // 줄 삭제 (빈 줄에서 Backspace)
  const handleLineDelete = useCallback((lineIndex) => {
    if (lines.length <= 1) return; // 최소 1줄은 유지
    
    const newLines = [...lines];
    newLines.splice(lineIndex, 1);
    const newValue = newLines.join('\n');
    onChangeText?.(newValue);
    
    // ✅ 키보드 유지를 위한 즉시 포커스 이동 (setTimeout 제거로 빠른 전환)
    const prevGlobalIndex = baseIndex + lineIndex - 1;
    
    // 상태 즉시 업데이트
    setFocusedLineIndex(lineIndex - 1);
    setFocusedIndex?.(prevGlobalIndex);
    setCurrentFocusedIndex(prevGlobalIndex, blocks);
    
    // 즉시 포커스 이동으로 키보드 유지
    const prevLineRef = lineRefs.current[lineIndex - 1];
    if (prevLineRef) {
      prevLineRef.focus();
      console.log('📝 Line deleted - instant focus move (keyboard should stay)');
    }
  }, [lines, onChangeText, keyboardVisible, baseIndex, setFocusedIndex, setCurrentFocusedIndex, blocks, setFocusedLineIndex]);
  
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
  
  // 키 입력 처리 - 🔧 FIX: multiline prop에 관계없이 항상 동일한 로직 적용
  const handleKeyPress = useCallback((lineIndex, { nativeEvent }) => {
    const { key } = nativeEvent;
    console.log('🔤 Key pressed in line', lineIndex, ':', key);
    
    // Enter 키 처리 - 항상 새 줄 생성
    if (key === 'Enter') {
      console.log('⏎ Enter key - creating new line after', lineIndex);
      nativeEvent.preventDefault?.(); // 기본 Enter 동작 방지
      handleEnterPress(lineIndex);
      // 외부 onKeyPress 핸들러 호출
      if (onKeyPress) {
        onKeyPress(nativeEvent);
      }
      return;
    }
    
    // Backspace 처리 - 빈 줄에서 줄 삭제
    if (key === 'Backspace' && lines[lineIndex] === '') {
      console.log('⌫ Backspace on empty line', lineIndex, '- deleting line');
      handleLineDelete(lineIndex);
      return;
    }
    
    // 다른 모든 키는 외부 핸들러로 전달
    if (onKeyPress) {
      onKeyPress(nativeEvent);
    }
  }, [handleEnterPress, handleLineDelete, lines, onKeyPress]);
  
  return (
    <View style={style}>
      {lines.map((line, lineIndex) => {
        const globalIndex = baseIndex + lineIndex;
        const lineStyle = getDynamicTextStyle(globalIndex, null);
        const isFocused = focusedLineIndex === lineIndex;
        
        // 🔧 FIX: autoFocus가 활성화된 경우 빈 줄도 렌더링 (새 카드 지원)
        if (lineIndex === lines.length - 1 && line === '' && !isFocused && !autoFocus) {
          return null;
        }
        
        return (
          <TextInput
            key={`line-${lineIndex}`}
            ref={(ref) => {
              lineRefs.current[lineIndex] = ref;
            }}
            autoFocus={autoFocus && lineIndex === 0} // 🔧 FIX: 첫 번째 줄에만 autoFocus 적용
            style={[
              {
                fontSize: 16,
                lineHeight: 24, // 🔧 FIX: 카드 블록에 맞는 더 컴팩트한 lineHeight
                paddingVertical: 0,
                paddingHorizontal: 0,
                minHeight: 24, // 🔧 FIX: lineHeight와 일치하는 minHeight로 여백 최소화
                marginBottom: 0, // 🔧 FIX: 모든 여백 제거
                marginTop: 0,
                backgroundColor: 'transparent',
                color: Colors.primaryText,
                textAlignVertical: 'top',
                ...(Platform.OS === 'ios' && {
                  fontFamily: 'System'
                }),
                ...(Platform.OS === 'android' && {
                  includeFontPadding: false
                })
              },
              lineStyle, // 줄별 독립적인 포맷 스타일 적용 (fontSize, fontWeight 등)
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
            multiline={true} // 🔧 FIX: 일반 노트와 동일하게 multiline으로 자동 줄바꿈 허용
            returnKeyType="next" // Enter 키로 새 줄 생성
            blurOnSubmit={false}
            autoCorrect={false}
            autoComplete="off"
            spellCheck={false}
            autoCapitalize="none" // 🔧 FIX: 자동 대문자 변환 비활성화로 키보드 움직임 방지
            editable={isAuthor}
            // ✅ InputAccessoryView 제거 (플로팅 툴바 사용)
            // inputAccessoryViewID={inputAccessoryViewID}
            {...props}
          />
        );
      })}
    </View>
  );
};

export default MultilineFormattedInput;