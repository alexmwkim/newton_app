import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Animated, 
  Keyboard, 
  Platform, 
  Dimensions,
  TouchableOpacity,
  Text,
  ScrollView 
} from 'react-native';
import { useSimpleToolbar } from '../../contexts/SimpleToolbarContext';
import { useFormatting } from './ToolbarFormatting';
import { ToolbarButton } from './ToolbarButton';

// ✅ Expo 호환 커스텀 키보드 동기화 툴바 (React.memo 추가)
export const CustomKeyboardToolbar = React.memo(() => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const toolbarAnimation = useRef(new Animated.Value(0)).current;
  const lastKeyboardHeight = useRef(0); // ✅ 이전 키보드 높이 기록
  
  const { 
    activeScreenHandlers, 
    focusedIndex, 
    hideKeyboard
  } = useSimpleToolbar();
  
  const { 
    activeFormats, 
    toggleBold, 
    toggleItalic, 
    toggleHeading1, 
    toggleHeading2, 
    toggleHeading3 
  } = useFormatting();

  // 키보드 이벤트 처리 (개선된 동기화)
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        const height = event.endCoordinates.height;
        // Keyboard will show
        
        // ✅ 중대한 높이 변화에만 애니메이션 실행 (미세한 조정 무시)
        const heightDifference = Math.abs(height - lastKeyboardHeight.current);
        if (heightDifference < 20) {
          // 미세한 높이 변화 무시 (20px 미만으로 증가)
          return;
        }
        
        // ✅ 너무 작은 키보드 높이는 무시
        if (height < 100) {
          return;
        }
        
        lastKeyboardHeight.current = height;
        setKeyboardVisible(true);
        setKeyboardHeight(height);
        
        // ✅ 키보드와 완벽히 동기화된 애니메이션
        Animated.timing(toolbarAnimation, {
          toValue: height,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: false, // position 속성 사용으로 false 필요
        }).start();
      }
    );

    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        // Keyboard will hide
        
        lastKeyboardHeight.current = 0; // 키보드 높이 리셋
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        
        // ✅ 키보드와 함께 숨어지는 애니메이션
        Animated.timing(toolbarAnimation, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: false,
        }).start();
      }
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, [toolbarAnimation]);

  // 툴바를 보여줄지 결정
  if (!keyboardVisible || !activeScreenHandlers) {
    return null;
  }

  // CustomKeyboardToolbar rendering

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: toolbarAnimation, // ✅ 키보드 높이에 완벽히 동기화
        backgroundColor: '#2ECC71', // 눈에 띄는 녹색
        borderTopWidth: 3,
        borderTopColor: '#FFFFFF',
        zIndex: 1000,
        // ✅ 그림자 효과로 키보드와 분리감 제거
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: -2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          paddingVertical: 8,
          height: 60,
        }}
      >
        {/* 디버그 정보와 기본 버튼들 */}
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flex: 1 }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          <View style={{ alignItems: 'center', marginRight: 20 }}>
            <Text style={{color: '#FFFFFF', fontSize: 18, fontWeight: 'bold'}}>
              🚀 CUSTOM KEYBOARD TOOLBAR! 🚀
            </Text>
            <Text style={{color: '#FFFFFF', fontSize: 12}}>
              focusedIndex: {focusedIndex} | height: {Math.round(keyboardHeight)}px
            </Text>
          </View>
          
          {/* 포맷팅 버튼들 */}
          <ToolbarButton 
            title="B" 
            isActive={activeFormats.bold}
            onPress={() => {
              // Bold clicked
              toggleBold();
            }}
            style={{ 
              marginRight: 8,
              backgroundColor: activeFormats.bold ? '#FFFFFF' : 'transparent',
            }}
            textStyle={{
              color: activeFormats.bold ? '#2ECC71' : '#FFFFFF'
            }}
          />
          
          <ToolbarButton 
            title="I" 
            isActive={activeFormats.italic}
            onPress={() => {
              // Italic clicked
              toggleItalic();
            }}
            style={{ 
              marginRight: 8,
              backgroundColor: activeFormats.italic ? '#FFFFFF' : 'transparent',
            }}
            textStyle={{
              color: activeFormats.italic ? '#2ECC71' : '#FFFFFF'
            }}
          />
          
          {/* 콘텐츠 추가 버튼들 */}
          {activeScreenHandlers?.handleAddCard && (
            <TouchableOpacity
              onPress={() => {
                // Add card clicked
                activeScreenHandlers.handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
                marginRight: 8,
              }}
            >
              <Text style={{color: '#FFFFFF', fontSize: 14}}>📝 Card</Text>
            </TouchableOpacity>
          )}
          
          {activeScreenHandlers?.handleAddImage && (
            <TouchableOpacity
              onPress={() => {
                // Add image clicked
                activeScreenHandlers.handleAddImage(focusedIndex >= 0 ? focusedIndex : 0);
              }}
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 4,
                marginRight: 8,
              }}
            >
              <Text style={{color: '#FFFFFF', fontSize: 14}}>🖼️ Image</Text>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Done 버튼 */}
        <TouchableOpacity
          onPress={() => {
            // Done pressed
            hideKeyboard();
          }}
          style={{
            backgroundColor: '#E74C3C',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 8,
            marginLeft: 12,
            minWidth: 60,
            alignItems: 'center',
          }}
        >
          <Text style={{ 
            color: '#FFFFFF', 
            fontWeight: 'bold', 
            fontSize: 16,
          }}>Done</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export default React.memo(CustomKeyboardToolbar);