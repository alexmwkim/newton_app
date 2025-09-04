import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Text,
  ActivityIndicator,
  Modal,
  Keyboard
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
const useSafeAreaInsets = () => ({ bottom: 34, top: 44, left: 0, right: 0 });
import Icon from 'react-native-vector-icons/Feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../constants/Colors';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';
import { useFormatting } from '../components/toolbar/ToolbarFormatting';
import { UnifiedHeader } from '../shared/components/layout';

// Separated modules
import { 
  parseNoteContentToBlocks, 
  cleanLegacyContent,
  generateId,
  convertBlocksToContent,
  hasContent
} from '../utils/noteUtils';
import { useNoteDetailHandlers } from '../hooks/useNoteDetailHandlers';
import { NoteBlockRenderer } from '../components/NoteBlockRenderer';
import { noteDetailStyles } from '../styles/NoteDetailStyles';

const TOOLBAR_ID = 'newton-readme-toolbar'; // README 전용 TOOLBAR_ID

const ReadmeDetailScreen = ({ 
  navigation,
  route,
  onBack
}) => {
  // Route params에서 프로필 정보 가져오기
  const profileUserId = route?.params?.profileUserId || null;
  const readmeContent = route?.params?.readmeContent || '';
  const profileData = route?.params?.profileData || null;
  
  console.log('📋 ReadmeDetailScreen render with profileUserId:', profileUserId);
  
  // Context 및 상태
  const { setActiveScreenHandlers, setFocusedIndex: setGlobalFocusedIndex, hideDropdown } = useSimpleToolbar();
  const { setCurrentFocusedIndex, setCurrentBlockRef, getDynamicTextStyle, setSetBlocks } = useFormatting();
  const { user } = useAuth();
  
  // 컴포넌트 상태
  const scrollRef = useRef(null);
  const titleInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'text', content: '', ref: React.createRef() },
  ]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isRefocusFromDropdown, setIsRefocusFromDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [contentInitialized, setContentInitialized] = useState(false);
  
  const styles = noteDetailStyles;
  const insets = useSafeAreaInsets();
  
  // 권한 체크: 해당 프로필의 소유자만 편집 가능
  const isAuthor = useMemo(() => {
    if (!user || !profileUserId) return false;
    return user.id === profileUserId;
  }, [user?.id, profileUserId]);

  // 키보드 상태
  const { keyboardVisible, keyboardHeight: globalKeyboardHeight, keyboardHeightValue } = useSimpleToolbar();
  const keyboardHeight = globalKeyboardHeight;
  
  // Refs for latest state
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  
  const scrollToFocusedInput = () => {}; // KeyboardAwareScrollView가 자동 처리
  
  // 핸들러들 - NoteDetailScreen과 동일한 패턴
  const { handleAddCard, handleAddGrid, handleAddImage, handleDeleteBlock, handleKeyPress: originalHandleKeyPress, handleTextChange } = useNoteDetailHandlers(
    blocks,
    setBlocks,
    focusedIndex,
    setFocusedIndex,
    keyboardVisible,
    keyboardHeight,
    scrollToFocusedInput,
    title,
    { id: 'readme', title: 'README', content: readmeContent }, // displayNote 대신
    isAuthor,
    'readme', // noteId
    false, // loadingNote
    () => {} // updateNote - 별도 구현 예정
  );

  // 커스텀 handleKeyPress - 첫 번째 블록에서 백스페이스 시 타이틀로 이동
  const handleKeyPress = useCallback((block, index, key) => {
    if (key === 'Backspace' && index === 0 && block.content === '') {
      console.log('🎯 README: First block backspace - focusing title');
      titleInputRef.current?.focus();
      setFocusedIndex(-1);
      return;
    }
    
    // 기존 핸들러 호출
    originalHandleKeyPress(block, index, key);
  }, [originalHandleKeyPress]);

  // 키보드 blur 함수
  const blurCurrentInput = useCallback(() => {
    console.log('🎯 README BLUR: Starting at index:', focusedIndex);
    
    Keyboard.dismiss();
    
    if (focusedIndex >= 0 && focusedIndex < blocks.length) {
      const currentBlock = blocks[focusedIndex];
      if (currentBlock && currentBlock.ref && currentBlock.ref.current) {
        currentBlock.ref.current.blur();
      }
    }
    
    setFocusedIndex(-1);
    
    setTimeout(() => {
      Keyboard.dismiss();
    }, 100);
  }, [focusedIndex, blocks]);

  // 키보드 refocus 함수
  const refocusCurrentInput = useCallback(() => {
    console.log('🎯 README REFOCUS: Restoring keyboard after dropdown');
    
    setIsRefocusFromDropdown(true);
    
    const retryFocus = (attempt = 1) => {
      console.log(`🎯 README refocus attempt ${attempt}/5`);
      
      const currentBlocks = blocksRef.current;
      const textBlocks = currentBlocks.filter(block => block.type === 'text');
      console.log(`🎯 Found ${textBlocks.length} text blocks`);
      
      for (let i = textBlocks.length - 1; i >= 0; i--) {
        const block = textBlocks[i];
        console.log(`🎯 Checking block ${i}: ref=${!!block.ref}, current=${!!(block.ref?.current)}`);
        
        if (block.ref?.current) {
          console.log(`🎯 SUCCESS: Block ${i} ref is valid, focusing now`);
          try {
            block.ref.current.focus();
            const blockIndex = currentBlocks.indexOf(block);
            setFocusedIndex(blockIndex);
            console.log(`🎯 Focused on README block index ${blockIndex}`);
            
            setTimeout(() => {
              setIsRefocusFromDropdown(false);
              console.log('🎯 README refocus flag cleared');
            }, 500);
            
            return;
          } catch (error) {
            console.log(`🎯 Focus failed on block ${i}:`, error);
          }
        }
      }
      
      if (attempt < 5) {
        console.log(`🎯 All blocks failed, retrying in ${attempt * 100}ms`);
        setTimeout(() => retryFocus(attempt + 1), attempt * 100);
      } else {
        console.log('🎯 All README refocus attempts failed');
        setTimeout(() => setIsRefocusFromDropdown(false), 500);
      }
    };
    
    retryFocus(1);
  }, []);

  // 화면 진입 시 드롭다운 상태 초기화
  useEffect(() => {
    console.log('🔧 ReadmeDetailScreen: Initializing dropdown state');
    hideDropdown();
  }, []);

  // Register handlers with global toolbar
  useEffect(() => {
    if (isAuthor) {
      setActiveScreenHandlers({
        handleAddCard,
        handleAddGrid,  
        handleAddImage,
        blurCurrentInput,
        refocusCurrentInput
      });
    } else {
      setActiveScreenHandlers(null);
    }
    
    return () => {
      setActiveScreenHandlers(null);
      hideDropdown();
    };
  }, [setActiveScreenHandlers, isAuthor]);

  // Sync focusedIndex with global toolbar
  useEffect(() => {
    setGlobalFocusedIndex(focusedIndex);
    setCurrentFocusedIndex(focusedIndex);
    
    if (focusedIndex >= 0 && focusedIndex < blocks.length) {
      const currentBlock = blocks[focusedIndex];
      if (currentBlock && currentBlock.ref) {
        setCurrentBlockRef(currentBlock.ref);
      }
    } else {
      setCurrentBlockRef(null);
    }
  }, [focusedIndex, blocks, setGlobalFocusedIndex, setCurrentFocusedIndex, setCurrentBlockRef]);

  // Register setBlocks with FormattingProvider
  useEffect(() => {
    setSetBlocks(setBlocks);
  }, [setSetBlocks]);

  // README 내용 초기화
  useEffect(() => {
    if (!contentInitialized) {
      console.log('🔄 Initializing README content');
      
      // ProfileScreen에서 전달받은 profileData에서 title과 content 분리
      const readmeTitle = profileData?.readmeTitle || 'Title'; // 기본값을 Title로 변경
      const readmeContentText = readmeContent || '';
      
      // Title 설정 (기존 타이틀이 있으면 유지, 없으면 빈 문자열)
      if (profileData?.readmeTitle && profileData.readmeTitle !== 'README') {
        setTitle(profileData.readmeTitle); // 기존 커스텀 타이틀 유지 (content와 무관하게)
        console.log('🔄 Setting existing title:', profileData.readmeTitle);
      } else {
        setTitle(''); // 새로운 README인 경우 빈 상태로 시작
        console.log('🔄 Setting empty title for new README');
      }
      
      // Content 블록으로 파싱
      if (readmeContentText) {
        const readmeNote = {
          id: 'readme',
          title: readmeTitle,
          content: readmeContentText
        };
        
        try {
          const newBlocks = parseNoteContentToBlocks(readmeNote);
          console.log('🔄 Parsed README blocks:', newBlocks.length, 'blocks');
          if (newBlocks.length > 0) {
            setBlocks(newBlocks);
          }
        } catch (parseError) {
          console.log('⚠️ README content parsing failed:', parseError);
          setBlocks([
            { id: generateId(), type: 'text', content: readmeContentText, ref: React.createRef() }
          ]);
        }
      }
      
      setContentInitialized(true);
      console.log('✅ README content initialization completed');
    }
  }, [readmeContent, profileData, contentInitialized]);

  // 빈 블록 관리
  useEffect(() => {
    if (blocks.length === 0) {
      console.log('🔧 Adding initial empty block to README');
      setBlocks([
        { id: generateId(), type: 'text', content: '', ref: React.createRef() }
      ]);
    }
  }, [blocks.length]);

  // 🔍 블록 변경 추적 - 빈 줄이 언제 사라지는지 확인
  useEffect(() => {
    console.log('🔍 README blocks changed:', blocks.map((b, i) => ({
      index: i,
      type: b.type,
      content: b.content === '' ? 'EMPTY_LINE' : b.content,
      contentLength: (b.content || '').length
    })));
  }, [blocks]);

  // 뒤로가기 핸들러 (자동저장 포함)
  const handleBack = useCallback(async () => {
    console.log('📝 ReadmeDetailScreen handleBack called - auto saving');
    
    if (!isAuthor) {
      console.log('📝 Not author, skipping auto-save');
      if (navigation) {
        navigation.goBack();
      } else if (onBack) {
        onBack();
      }
      return;
    }

    try {
      const contentText = convertBlocksToContent(blocks);
      console.log('📝 Auto-saving README - Title:', title, 'Content:', contentText.substring(0, 50) + '...');
      
      // 항상 저장 (빈 상태도 저장하여 삭제를 반영)
      const readmeData = {
        title: title.trim(),
        content: contentText
      };
      
      await AsyncStorage.setItem('userReadmeData', JSON.stringify(readmeData));
      global.newReadmeData = readmeData;
      console.log('📝 Auto-save completed - Title:', title.trim(), 'Content length:', contentText.length);
      
    } catch (error) {
      console.error('❌ Auto-save failed:', error);
    }
    
    // 저장 완료 후 뒤로가기
    if (navigation) {
      navigation.goBack();
    } else if (onBack) {
      onBack();
    }
  }, [navigation, onBack, isAuthor, title, blocks]);

  // README 저장 함수
  const handleSave = useCallback(async () => {
    console.log('🔍 DEBUG: handleSave called');
    console.log('🔍 DEBUG: isAuthor =', isAuthor);
    console.log('🔍 DEBUG: title =', title);
    console.log('🔍 DEBUG: blocks length =', blocks.length);
    console.log('🔍 DEBUG: blocks content =', blocks.map(b => ({ type: b.type, content: b.content })));
    
    if (!isAuthor) {
      Alert.alert('Permission Denied', 'You can only edit your own profile README.');
      return;
    }

    try {
      setLoading(true);
      
      const contentText = convertBlocksToContent(blocks);
      console.log('💾 Saving README - Title:', title);
      console.log('💾 Saving README - Content:', contentText.substring(0, 100) + '...');
      
      // AsyncStorage에 README 저장 (ProfileScreen과 동일한 방식)
      const readmeData = {
        title: title.trim() || 'README', // 실제 입력된 타이틀 사용
        content: contentText
      };
      
      console.log('💾 Final readmeData to save:', readmeData);
      
      await AsyncStorage.setItem('userReadmeData', JSON.stringify(readmeData));
      console.log('💾 README saved to AsyncStorage successfully');
      
      // 전역 상태로 업데이트 알림 (ProfileScreen에서 확인)
      global.newReadmeData = readmeData;
      console.log('💾 Set global.newReadmeData:', global.newReadmeData);
      
      Alert.alert('Success', 'README updated successfully!');
      
      // 저장 후 뒤로가기
      setTimeout(() => {
        handleBack();
      }, 1000);
      
    } catch (error) {
      console.error('❌ README save error:', error);
      Alert.alert('Error', 'Failed to save README. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [isAuthor, blocks, title, handleBack]);

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback 
        onPress={() => {
          // Background touch 처리
        }}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {/* Header - README 전용 */}
          <UnifiedHeader
            title="README" // README 편집 페이지
            showBackButton={true}
            onBackPress={handleBack}
            rightElements={[]}
          />

          <KeyboardAwareScrollView
            ref={scrollRef}
            contentContainerStyle={[styles.scrollContent, {
              paddingBottom: 100,
              minHeight: 800
            }]}
            enableAutomaticScroll={!isRefocusFromDropdown}
            enableResetScrollToCoords={false}
            extraScrollHeight={isRefocusFromDropdown ? 0 : 25}
            extraHeight={isRefocusFromDropdown ? 0 : 15}
            keyboardVerticalOffset={0} 
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="none"
            enableOnAndroid={!isRefocusFromDropdown}
            keyboardOpeningTime={250}
            viewIsInsideTabBar={false}
            nestedScrollEnabled={false}
            removeClippedSubviews={false}
            showsVerticalScrollIndicator={true}
            automaticallyAdjustContentInsets={false}
            scrollEventThrottle={100}
          >
            {/* Title Input */}
            <TextInput
              ref={titleInputRef}
              style={styles.titleInput}
              placeholder="Title"
              placeholderTextColor={Colors.secondaryText}
              value={title}
              onChangeText={setTitle}
              onFocus={() => {
                setFocusedIndex(-1);
              }}
              onKeyPress={(e) => {
                // 타이틀에서 백스페이스 누를 때 타이틀이 비어있으면 첫 번째 블록으로 포커스
                if (e.nativeEvent.key === 'Backspace' && title === '') {
                  console.log('🎯 README: Title backspace - focusing first block');
                  if (blocks.length > 0 && blocks[0].ref?.current) {
                    blocks[0].ref.current.focus();
                    setFocusedIndex(0);
                  }
                }
              }}
              multiline
              autoCorrect={false}
              autoComplete="off"
              spellCheck={false}
            />

            {/* Content Blocks */}
            <View style={styles.blocksContainer}>
              {blocks.map((block, index) => (
                <View key={`container-${block.id}`}>
                  <NoteBlockRenderer
                    key={block.id}
                    block={block}
                    index={index}
                    blocks={blocks}
                    setBlocks={setBlocks}
                    handleTextChange={handleTextChange}
                    setFocusedIndex={setFocusedIndex}
                    keyboardVisible={keyboardVisible}
                    keyboardHeight={keyboardHeight}
                    scrollToFocusedInput={scrollToFocusedInput}
                    handleKeyPress={handleKeyPress}
                    handleDeleteBlock={handleDeleteBlock}
                    isAuthor={isAuthor}
                    dismissMenus={() => {}}
                    toolbarId={TOOLBAR_ID}
                    useGlobalKeyboard={true}
                    setIsRefocusFromDropdown={setIsRefocusFromDropdown}
                  />
                </View>
              ))}
            </View>

            <TouchableWithoutFeedback
              onPress={() => {
                console.log('🎯 README empty space touched, focusing last text block');
                const lastTextBlock = blocks.filter(b => b.type === 'text').pop();
                if (lastTextBlock?.ref?.current) {
                  lastTextBlock.ref.current.focus();
                  setFocusedIndex(blocks.indexOf(lastTextBlock));
                }
              }}
            >
              <View style={styles.touchableSpacer} />
            </TouchableWithoutFeedback>
          </KeyboardAwareScrollView>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default ReadmeDetailScreen;