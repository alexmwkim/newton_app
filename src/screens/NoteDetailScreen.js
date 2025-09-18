import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  TextInput,
  ScrollView,
  Platform,
  TouchableWithoutFeedback,
  TouchableOpacity,
  SafeAreaView,
  InputAccessoryView,
  Alert,
  Text,
  ActivityIndicator,
  Modal,
  Image,
  Keyboard
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
// SafeArea fallback - use React Native's built-in SafeAreaView instead
const useSafeAreaInsets = () => ({ bottom: 34, top: 44, left: 0, right: 0 });
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';
import { useNotesStore } from '../store/NotesStore';
import { useAuth } from '../contexts/AuthContext';
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';
import { useFormatting } from '../components/toolbar/ToolbarFormatting';
// UnifiedToolbar는 App.js에서 전역 렌더링
import SocialInteractionBar from '../components/SocialInteractionBar';
import { UnifiedHeader } from '../shared/components/layout';

// Separated modules
import { 
  parseNoteContentToBlocks, 
  cleanLegacyContent,
  generateId 
} from '../utils/noteUtils';
import { useKeyboardHandlers } from '../hooks/useKeyboardHandlers';
import { useNoteDetailHandlers } from '../hooks/useNoteDetailHandlers';
import { NoteBlockRenderer } from '../components/NoteBlockRenderer';
import { noteDetailStyles } from '../styles/NoteDetailStyles';
import Avatar from '../components/Avatar';
import { getConsistentAvatarUrl, getConsistentUsername } from '../utils/avatarUtils';


// Normalize note data outside component to prevent recreation
const normalizeNote = (noteData) => {
  if (!noteData) return null;
  return {
    ...noteData,
    isPublic: noteData.isPublic || noteData.is_public || false,
    username: noteData.username || noteData.profiles?.username || 'Unknown',
    starCount: noteData.star_count || noteData.starCount || 0,
    forkCount: noteData.fork_count || noteData.forkCount || 0,
    // Clean legacy markdown content
    content: cleanLegacyContent(noteData.content)
  };
};

const TOOLBAR_ID = 'newton-detail-toolbar'; // ✅ NoteDetailScreen 전용 TOOLBAR_ID

const NoteDetailScreen = ({ 
  noteId, 
  note = null, 
  isStarredNote = false, 
  returnToScreen,
  returnToTab,
  onStarredRemove,
  onBack, 
  navigation,
  route,
  onEdit,
  onFork,
  onUnstar
}) => {
  // README 모드 감지
  const isReadmeMode = route?.params?.isReadmeMode || false;
  const profileUserId = route?.params?.profileUserId || null;
  
  // 최소 로그: 첫 렌더와 noteId 변경시만
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  if (renderCountRef.current === 1) {
    console.log('🔍 NoteDetailScreen FIRST render with noteId:', noteId, 'note:', note?.title || 'no note', 'README mode:', isReadmeMode);
  } else if (renderCountRef.current <= 3) {
    console.log('🔍 NoteDetailScreen re-render #' + renderCountRef.current);
  }
  
  // Component state  
  // 🔧 로그 비활성화 - 무한 출력 방지
  // console.log('🔧 NoteDetailScreen: Component mounting/rendering');
  const { setActiveScreenHandlers, setFocusedIndex: setGlobalFocusedIndex, hideDropdown } = useSimpleToolbar();
  // 🔧 FIX: FormattingProvider 연결 추가
  const { setSetBlocks } = useFormatting();
  const scrollRef = useRef(null);
  const titleInputRef = useRef(null);
  const [title, setTitle] = useState('');
  const [titleSelection, setTitleSelection] = useState({ start: 0, end: 0 });
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'text', content: '', ref: React.createRef(), layoutMode: 'full', groupId: null },
  ]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loadingNote, setLoadingNote] = useState(true);
  const [storeNote, setStoreNote] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPageInfoModal, setShowPageInfoModal] = useState(false);
  const [contentInitialized, setContentInitialized] = useState(false);
  
  // Drag-to-resize states (legacy - will be replaced)
  const [cardLayoutModes, setCardLayoutModes] = useState({});
  const [dragGuideline, setDragGuideline] = useState({ visible: false, position: 'center' });
  
  // Drag and drop states
  const [draggingBlockId, setDraggingBlockId] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [hoverTargetBlockId, setHoverTargetBlockId] = useState(null);
  const [dragMode, setDragMode] = useState('none'); // 'none', 'resize', 'reorder'
  const [preventAutoScroll, setPreventAutoScroll] = useState(false); // TextInput 자동 스크롤 방지
  const [isRefocusFromDropdown, setIsRefocusFromDropdown] = useState(false); // 드롭다운에서 온 refocus인지 추적
  const [blockPositions, setBlockPositions] = useState({}); // Track block positions for drag targeting
  const [cardLayouts, setCardLayouts] = useState({}); // Simple card position tracking
  
  // Wrap setCardLayouts to track when it's called
  const trackedSetCardLayouts = useCallback((newLayouts) => {
    if (typeof newLayouts === 'function') {
      setCardLayouts(prev => {
        const result = newLayouts(prev);
        console.log('🔧 setCardLayouts function call: prev =', Object.keys(prev), '→ result =', Object.keys(result));
        return result;
      });
    } else {
      console.log('🔧 setCardLayouts direct call:', Object.keys(newLayouts));
      setCardLayouts(newLayouts);
    }
  }, []);
  const [hoveredBlockId, setHoveredBlockId] = useState(null); // Which block is being hovered over

  // Debug effects removed for performance




  
  // Store and auth
  const notesStore = useNotesStore();
  const { getNoteById, updateNote, deleteNote, toggleFavorite, isFavorite, toggleStarred, isStarred } = notesStore;
  const { user, profile } = useAuth();
  
  // Get current user's username for display (used for current user context)
  const getCurrentUserForDisplay = () => {
    return profile?.username || user?.username || user?.email?.split('@')[0] || 'alexkim';
  };

  // Get note author's username for display
  const getNoteAuthorForDisplay = () => {
    return displayNote?.profiles?.username || 
           displayNote?.username || 
           displayNote?.user?.username || 
           'Unknown Author';
  };
  const insets = useSafeAreaInsets();
  const styles = noteDetailStyles;

  // Get display note with fallback - memoized to prevent unnecessary re-renders
  const displayNote = useMemo(() => {
    if (storeNote) {
      return normalizeNote(storeNote);
    }
    
    // Only show loading state, don't depend on loadingNote in memo
    return {
      id: noteId || 1,
      title: 'Loading...',
      content: 'Loading note content...',
      timeAgo: 'Unknown',
      isPublic: false,
      starCount: 0,
      forkCount: 0
    };
  }, [storeNote, noteId]);
  
  // Check if user is author (README 모드 고려)
  const isAuthor = useMemo(() => {
    if (!user) return false;
    
    // README 모드: 해당 프로필의 소유자만 편집 가능
    if (isReadmeMode) {
      return user.id === profileUserId;
    }
    
    // 일반 노트 모드
    if (!displayNote) return false;
    
    // 🚧 임시: 개발 중이므로 항상 편집 가능하도록 설정
    if (__DEV__) {
      return true; // 개발 모드에서는 항상 편집 가능
    }
    
    return displayNote.user_id === user.id || !displayNote.user_id;
  }, [displayNote?.user_id, user?.id, isReadmeMode, profileUserId]);

  // Use separated hooks - focusedIndex와 blocks를 ref로 최신값 보장
  const focusedIndexRef = useRef(focusedIndex);
  focusedIndexRef.current = focusedIndex;
  
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;
  
  const cardLayoutsRef = useRef(cardLayouts);
  cardLayoutsRef.current = cardLayouts; // 항상 최신 상태 유지
  
  // 🔧 useKeyboardHandlers 제거 - SimpleToolbarContext의 전역 키보드 관리 사용
  const { keyboardVisible, keyboardHeight: globalKeyboardHeight, keyboardHeightValue } = useSimpleToolbar();
  const keyboardHeight = globalKeyboardHeight;
  
  // 안전한 스크롤 함수 - content size 변화 감지
  const scrollToFocusedInput = useCallback(() => {
    if (scrollRef.current) {
      console.log('📍 Triggering content re-measurement for auto-scroll');
      // 안전한 방법: KeyboardAwareScrollView가 다시 측정하도록 유도
      try {
        // scrollToEnd를 아주 짧게 호출했다가 원래 위치로 복귀
        // 이렇게 하면 KeyboardAwareScrollView가 content를 다시 측정함
        const currentScrollY = scrollRef.current.contentOffset?.y || 0;
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTo({ y: currentScrollY, animated: true });
          }
        }, 10);
      } catch (error) {
        console.log('📍 Scroll adjustment skipped due to error:', error.message);
      }
    }
  }, []);

  const { handleAddCard, handleAddImage, handleDeleteBlock, handleKeyPress, handleTextChange } = useNoteDetailHandlers(
    blocks,
    setBlocks,
    focusedIndex,
    setFocusedIndex,
    keyboardVisible,
    keyboardHeight,
    scrollToFocusedInput,
    title,
    displayNote,
    isAuthor,
    noteId,
    loadingNote,
    updateNote,
    setIsActivelyEditing
  );

  // 포맷팅 관리는 이제 FormattingProvider에서 처리됨

  // 화면 진입 시 드롭다운 상태 초기화
  useEffect(() => {
    console.log('🔧 NoteDetailScreen: Initializing dropdown state - calling hideDropdown()');
    hideDropdown(); // 드롭다운 상태 초기화
    console.log('🔧 NoteDetailScreen: hideDropdown() called');
  }, []); // 의존성 배열을 빈 배열로 변경하여 마운트 시에만 실행

  // 현재 입력 필드 blur 함수 (키보드 dismiss)
  const blurCurrentInput = useCallback(() => {
    console.log('🎯 AGGRESSIVE BLUR: Starting at index:', focusedIndex);
    
    // 1. 즉시 전역 키보드 dismiss 호출
    Keyboard.dismiss();
    console.log('🎯 STEP 1: Immediate global Keyboard.dismiss() called');
    
    // 2. 현재 포커스된 TextInput blur 시도
    if (focusedIndex >= 0 && focusedIndex < blocks.length) {
      const currentBlock = blocks[focusedIndex];
      if (currentBlock && currentBlock.ref && currentBlock.ref.current) {
        console.log('🎯 STEP 2: Calling blur() on TextInput ref');
        currentBlock.ref.current.blur();
      }
    }
    
    // 3. 포커스 인덱스 초기화로 완전한 blur 상태 보장
    setFocusedIndex(-1);
    console.log('🎯 STEP 3: FocusedIndex set to -1 for complete blur');
    
    // 4. 추가 안전장치 - 강제 키보드 숨김
    setTimeout(() => {
      Keyboard.dismiss();
      console.log('🎯 STEP 4: Safety Keyboard.dismiss() called after 100ms');
    }, 100);
  }, [focusedIndex, blocks]);

  // 키보드 다시 포커스 함수 - 드롭다운 전환용 (자동 스크롤 방지)
  const refocusCurrentInput = useCallback(() => {
    console.log('🎯 DROPDOWN REFOCUS: No auto-scroll needed');
    
    // 🔧 드롭다운에서 온 refocus 표시 (자동 스크롤 방지용)
    setIsRefocusFromDropdown(true);
    
    // 🆕 블록 상태를 실시간으로 다시 확인
    const retryFocus = (attempt = 1) => {
      console.log(`🎯 Refocus attempt ${attempt}/5`);
      
      // 현재 블록 배열에서 최신 상태 사용
      const currentBlocks = blocksRef.current;
      const textBlocks = currentBlocks.filter(block => block.type === 'text');
      console.log(`🎯 Found ${textBlocks.length} text blocks`);
      
      // 마지막 텍스트 블록부터 시도 (일반적으로 비어있고 포커스되어야 할 블록)
      for (let i = textBlocks.length - 1; i >= 0; i--) {
        const block = textBlocks[i];
        console.log(`🎯 Checking block ${i}: ref=${!!block.ref}, current=${!!(block.ref?.current)}`);
        
        if (block.ref?.current) {
          console.log(`🎯 SUCCESS: Block ${i} ref is valid, focusing now`);
          try {
            // 즉시 포커스 (지연 제거)
            block.ref.current.focus();
            const blockIndex = currentBlocks.indexOf(block);
            setFocusedIndex(blockIndex);
            console.log(`🎯 Focused on block index ${blockIndex}`);
            
            // 🔧 드롭다운 refocus 완료 후 플래그 초기화
            setTimeout(() => {
              setIsRefocusFromDropdown(false);
              console.log('🎯 Dropdown refocus flag cleared');
            }, 500); // 키보드 애니메이션 완료 후
            
            return; // 성공하면 종료
          } catch (error) {
            console.log(`🎯 Focus failed on block ${i}:`, error);
          }
        }
      }
      
      // 모든 블록에서 실패했으면 재시도
      if (attempt < 5) {
        console.log(`🎯 All blocks failed, retrying in ${attempt * 100}ms`);
        setTimeout(() => retryFocus(attempt + 1), attempt * 100);
      } else {
        console.log('🎯 All refocus attempts failed');
        // 최후 수단: 강제로 포커스 인덱스 설정
        const lastTextBlockIndex = currentBlocks.length - 1;
        if (lastTextBlockIndex >= 0 && currentBlocks[lastTextBlockIndex].type === 'text') {
          console.log('🎯 FALLBACK: Setting focus index without ref');
          setFocusedIndex(lastTextBlockIndex);
        }
        // 실패해도 플래그 초기화
        setTimeout(() => setIsRefocusFromDropdown(false), 500);
      }
    };
    
    // 즉시 시도 (지연 제거)
    retryFocus(1);
  }, []);

  // Register handlers with global toolbar
  useEffect(() => {
    // 🔧 TEMP FIX: 조건 제거하여 항상 handlers 설정 (테스트용)
    setActiveScreenHandlers({
      handleAddCard,
      handleAddImage,
      blurCurrentInput, // 키보드 blur 함수 추가
      refocusCurrentInput // 키보드 재포커스 함수 추가
    });
    
    return () => {
      setActiveScreenHandlers(null);
      hideDropdown(); // 화면 떠날 때도 드롭다운 정리
    };
  }, [setActiveScreenHandlers]); // isAuthor 의존성 제거

  // 🔧 FIX: FormattingProvider에 setBlocks 함수 등록
  useEffect(() => {
    setSetBlocks(setBlocks);
    
    return () => {
      setSetBlocks(null);
    };
  }, [setSetBlocks, setBlocks]);

  // Sync focusedIndex with global toolbar - CreateNoteScreen style
  useEffect(() => {
    setGlobalFocusedIndex(focusedIndex);
  }, [focusedIndex, setGlobalFocusedIndex]);

  
  // Load note data - SINGLE useEffect to prevent loops
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounted
    
    const loadNote = async () => {
      console.log('🔍 ===== LOAD NOTE STARTED =====');
      console.log('🔍 Loading note for ID:', noteId);
      console.log('🔍 Passed note prop:', note ? `${note.title} (${note.id})` : 'no note prop');
      
      if (!isMounted) return;
      setLoadingNote(true);
      setContentInitialized(false);
      
      // PRIORITY 1: Use passed note if available
      if (note && note.title !== undefined) {
        console.log('✅ Using passed note (PRIORITY 1):', note.title);
        if (isMounted) {
          setStoreNote(note);
          setLoadingNote(false);
        }
        console.log('🔍 ===== LOAD NOTE COMPLETED (used passed note) =====');
        return;
      }
      
      // PRIORITY 2: Try to get note from store
      try {
        console.log('🔄 Calling getNoteById...');
        const foundNote = await getNoteById(noteId);
        
        if (!isMounted) return;
        
        if (foundNote && foundNote.title) {
          console.log('✅ getNoteById SUCCESS:', foundNote.title);
          setStoreNote(foundNote);
        } else {
          console.log('⚠️ getNoteById returned empty/null result');
          throw new Error('Note not found or empty result');
        }
        
      } catch (error) {
        console.error('❌ getNoteById failed:', error?.message);
        
        if (!isMounted) return;
        
        // PRIORITY 3: Create fallback note to prevent infinite loading
        console.log('🔄 Creating fallback note to prevent infinite loading');
        const fallbackNote = {
          id: noteId,
          title: 'Note Not Found',
          content: 'This note could not be loaded. It may not exist or there may be a connection issue.',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_public: false,
          user_id: user?.id || null
        };
        
        setStoreNote(fallbackNote);
      } finally {
        if (isMounted) {
          console.log('🏁 setLoadingNote(false) called');
          setLoadingNote(false);
          console.log('🔍 ===== LOAD NOTE COMPLETED =====');
        }
      }
    };

    // More lenient noteId validation - accept any truthy value
    if (noteId && noteId !== 'MISSING_NOTE_ID' && noteId !== 'undefined' && noteId !== 'null') {
      console.log('🚀 Starting loadNote for noteId:', noteId);
      loadNote();
    } else {
      console.warn('⚠️ NoteDetailScreen: noteId is missing or invalid:', noteId);
      console.warn('⚠️ Creating empty fallback note');
      
      const emptyNote = {
        id: 'empty',
        title: 'Empty Note',
        content: 'This is a new empty note.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_public: false,
        user_id: user?.id || null
      };
      
      setStoreNote(emptyNote);
      setLoadingNote(false);
    }
    
    // Cleanup function to prevent state updates on unmounted component
    return () => {
      isMounted = false;
    };
  }, [noteId]); // ONLY noteId dependency to prevent infinite loops
  
  // Track if user is actively editing to prevent data overwrites
  const [isActivelyEditing, setIsActivelyEditing] = useState(false);
  
  // Initialize content from note data - only run once when note loads
  useEffect(() => {
    // 🚨 FIX: 사용자가 편집 중일 때는 서버 데이터로 덮어쓰지 않음
    if (displayNote && !loadingNote && displayNote.id && !contentInitialized && !isActivelyEditing) {
      console.log('🔄 Initializing content for note:', displayNote.id);
      console.log('🔄 DisplayNote content:', displayNote.content);
      
      setTitle(displayNote.title || '');
      
      // Convert existing content to blocks using shared utility
      if (displayNote.content && displayNote.content.trim()) {
        console.log('🔄 Content exists, parsing to blocks...');
        try {
          const newBlocks = parseNoteContentToBlocks(displayNote);
          console.log('🔄 Parsed blocks:', newBlocks.length, 'blocks');
          if (newBlocks.length > 0) {
            // ref는 이미 parseNoteContentToBlocks에서 생성됨 - 덮어쓰지 말자
            setBlocks(newBlocks);
          } else {
            // Fallback if parsing fails
            setBlocks([
              { id: generateId(), type: 'text', content: displayNote.content || '', ref: React.createRef(), layoutMode: 'full', groupId: null, savedFormats: null }
            ]);
          }
        } catch (parseError) {
          console.log('⚠️ Content parsing failed, using fallback:', parseError);
          setBlocks([
            { id: generateId(), type: 'text', content: displayNote.content || '', ref: React.createRef(), layoutMode: 'full', groupId: null, savedFormats: null }
          ]);
        }
      } else {
        console.log('🔄 No content, creating empty text block');
        // Ensure we have at least one text block
        setBlocks([
          { id: generateId(), type: 'text', content: '', ref: React.createRef(), layoutMode: 'full', groupId: null, savedFormats: null }
        ]);
      }
      
      setContentInitialized(true);
      console.log('✅ Content initialization completed');
    }
  }, [displayNote?.id, loadingNote, contentInitialized]); // 🚨 FIX: isActivelyEditing 제거 - 무한루프 방지

  // Ensure there's always an empty text block at the end

  // 블록 마이그레이션 및 관리
  useEffect(() => {
    if (blocks.length === 0) {
      console.log('🔧 Adding initial empty block');
      setBlocks([
        { id: generateId(), type: 'text', content: '', ref: React.createRef(), layoutMode: 'full', groupId: null }
      ]);
      return;
    }

    // 🚨 FIX: 편집 중이거나 콘텐츠 초기화가 완료되지 않은 경우 마이그레이션 실행 안함
    if (isActivelyEditing || !contentInitialized) {
      console.log('🔄 Skipping migration - user is actively editing or content not initialized');
      return;
    }

    // Notion 방식 마이그레이션: 멀티라인 텍스트 블록을 단일 라인 블록들로 분리
    const needsMigration = blocks.some(block => 
      block.type === 'text' && block.content.includes('\n')
    );

    if (needsMigration) {
      console.log('🔄 Migrating multiline blocks to single-line blocks (Notion style)');
      
      const migratedBlocks = [];
      
      blocks.forEach(block => {
        if (block.type === 'text' && block.content.includes('\n')) {
          // 멀티라인 블록을 여러 단일라인 블록으로 분리
          const lines = block.content.split('\n');
          lines.forEach(line => {
            // ✅ 빈 줄도 유지 - 사용자 의도대로 저장
            migratedBlocks.push({
              id: generateId(),
              type: 'text',
              content: line, // 빈 줄도 포함
              ref: React.createRef(),
              layoutMode: 'full',
              groupId: null
            });
          });
        } else {
          // 일반 블록은 그대로 유지
          migratedBlocks.push({
            ...block,
            ref: React.createRef() // ref 새로 생성
          });
        }
      });
      
      // 마지막에 빈 블록 추가
      const lastBlock = migratedBlocks[migratedBlocks.length - 1];
      if (!lastBlock || lastBlock.type !== 'text' || lastBlock.content.trim() !== '') {
        migratedBlocks.push({
          id: generateId(),
          type: 'text',
          content: '',
          ref: React.createRef(),
          layoutMode: 'full',
          groupId: null
        });
      }
      
      setBlocks(migratedBlocks);
      console.log('✅ Block migration completed:', migratedBlocks.length, 'blocks');
    } else if (!isActivelyEditing) {
      // 🚨 FIX: 편집 중이 아닐 때만 빈 블록 관리
      // 마이그레이션이 필요 없는 경우, 빈 블록만 관리
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock.type !== 'text' || lastBlock.content.trim() !== '') {
        console.log('🔧 Adding trailing empty text block');
        setBlocks(prev => ([
          ...prev,
          { id: generateId(), type: 'text', content: '', ref: React.createRef(), layoutMode: 'full', groupId: null }
        ]));
      }
    }
  }, [blocks.length, isActivelyEditing, contentInitialized]); // 🔧 FIX: contentInitialized 추가하여 초기화 완료 후에만 실행

  // Header handlers
  const handleBack = useCallback(() => {
    console.log('📝 NoteDetailScreen handleBack called');
    console.log('📝 onBack prop exists:', !!onBack);
    console.log('📝 onBack type:', typeof onBack);
    if (onBack) {
      console.log('📝 Calling onBack...');
      onBack();
      console.log('📝 onBack called successfully');
    } else {
      console.log('❌ onBack prop is missing');
    }
  }, [onBack]);

  const handleSettingsPress = useCallback(() => {
    setShowSettingsMenu(!showSettingsMenu);
  }, [showSettingsMenu]);

  const handleDeleteNote = useCallback(() => {
    setShowSettingsMenu(false);
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteNote(noteId, displayNote.isPublic);
            if (onBack) onBack();
          }
        }
      ]
    );
  }, [noteId, displayNote.isPublic, deleteNote, onBack]);

  const handlePageInfo = useCallback(() => {
    setShowSettingsMenu(false);
    setShowPageInfoModal(true);
  }, []);

  // Format dates properly
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const createdDate = displayNote.created_at || displayNote.createdAt;
  const updatedDate = displayNote.updated_at || displayNote.updatedAt;
  const createdDateFormatted = formatDate(createdDate);
  const lastModifiedFormatted = formatDate(updatedDate);
  const isPublicNote = displayNote.isPublic || displayNote.is_public;
  const authorName = displayNote.username || displayNote.author || 'Unknown';

  // Dismiss all modals and menus
  const dismissMenus = useCallback(() => {
    if (showSettingsMenu) setShowSettingsMenu(false);
    if (showPageInfoModal) setShowPageInfoModal(false);
  }, [showSettingsMenu, showPageInfoModal]);

  // Block manipulation functions
  const generateGroupId = () => `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const updateBlockLayoutMode = useCallback((blockId, layoutMode, groupId = null) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, layoutMode, groupId }
        : block
    ));
  }, []);

  const reorderBlocks = useCallback((fromIndex, toIndex) => {
    setBlocks(prev => {
      const newBlocks = [...prev];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      return newBlocks;
    });
  }, []);

  const groupBlocks = useCallback((blockId1, blockId2) => {
    const groupId = generateGroupId();
    setBlocks(prev => {
      const block1Index = prev.findIndex(b => b.id === blockId1);
      const block2Index = prev.findIndex(b => b.id === blockId2);
      
      if (block1Index === -1 || block2Index === -1) return prev;
      
      return prev.map(block => {
        if (block.id === blockId1) {
          return { ...block, layoutMode: 'grid-left', groupId };
        } else if (block.id === blockId2) {
          return { ...block, layoutMode: 'grid-right', groupId };
        }
        return block;
      });
    });
  }, []);

  const ungroupBlock = useCallback((blockId) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, layoutMode: 'full', groupId: null }
        : block
    ));
  }, []);

  const handleAddToPinned = useCallback(() => {
    setShowSettingsMenu(false);
    const wasPinned = isFavorite(noteId);
    toggleFavorite(noteId);
    
    Alert.alert(
      wasPinned ? 'Removed from Pinned' : 'Added to Pinned',
      wasPinned ? 'Note removed from pinned notes.' : 'Note added to pinned notes.',
      [{ text: 'OK' }]
    );
  }, [noteId, isFavorite, toggleFavorite]);
  


  // Show loading spinner
  if (loadingNote) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.floatingButton} />
          <Text style={styles.loadingText}>Loading note...</Text>
        </View>
      </View>
    );
  }

  return (
    <>
    <View style={styles.container}>
      {/* ✅ KeyboardAvoidingView 제거 - KeyboardAwareScrollView와 충돌 방지 */}
        {/* Settings menu */}
        {showSettingsMenu && (
          <View style={styles.settingsMenu}>
            {isAuthor && (
              <>
                <TouchableOpacity onPress={handleDeleteNote} style={styles.menuItem}>
                  <Icon name="trash-2" size={16} color={Colors.primaryText} />
                  <Text style={styles.menuItemText}>Delete</Text>
                </TouchableOpacity>
              </>
            )}
            <TouchableOpacity onPress={handlePageInfo} style={styles.menuItem}>
              <Icon name="info" size={16} color={Colors.primaryText} />
              <Text style={styles.menuItemText}>Page Info</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleAddToPinned} style={styles.menuItem}>
              <Icon 
                name="bookmark" 
                size={16} 
                color={isFavorite(noteId) ? Colors.floatingButton : Colors.primaryText}
              />
              <Text style={styles.menuItemText}>
                {isFavorite(noteId) ? 'Remove from Pinned' : 'Add to Pinned'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Background touch to close menu and page info modal */}
        <TouchableWithoutFeedback 
          onPress={() => {
            if (showSettingsMenu) {
              setShowSettingsMenu(false);
            }
            if (showPageInfoModal) {
              setShowPageInfoModal(false);
            }
            // Don't call Keyboard.dismiss() here to prevent interference with TextInput focus
          }}
          style={{ flex: 1 }}
        >
          <View 
            style={{ flex: 1 }}
            onTouchStart={() => {
              dismissMenus();
            }}
          >
            {/* Header */}
            <UnifiedHeader
              showBackButton={true}
              onBackPress={handleBack}
              rightElements={[
                // Star button (퍼블릭 노트일 때만)
                ...(displayNote.isPublic ? [{
                  component: (
                    <TouchableOpacity 
                      style={styles.actionButton} 
                      onPress={() => toggleStarred(noteId)}
                    >
                      {isStarred(noteId) ? (
                        <Text style={[styles.solidStar, { color: Colors.floatingButton, fontSize: 20 }]}>★</Text>
                      ) : (
                        <Text style={[styles.outlineStar, { color: Colors.secondaryText, fontSize: 20 }]}>☆</Text>
                      )}
                    </TouchableOpacity>
                  )
                }] : []),
                // Fork button (퍼블릭 노트일 때만)
                ...(displayNote.isPublic ? [{
                  name: 'git-branch',
                  size: 20,
                  color: Colors.secondaryText,
                  onPress: () => {
                    console.log('Fork button pressed');
                  }
                }] : []),
                // Status icon (지구본/자물쇠) - more 아이콘 바로 왼쪽
                {
                  component: (
                    <View style={styles.statusIcon}>
                      <Icon 
                        name={displayNote.isPublic ? "globe" : "lock"} 
                        size={16} 
                        color={Colors.secondaryText} 
                      />
                    </View>
                  )
                },
                // Settings button (항상 표시)
                {
                  name: 'more-horizontal',
                  size: 24,
                  color: Colors.primaryText,
                  onPress: handleSettingsPress
                }
              ]}
            />

            <KeyboardAwareScrollView
              ref={scrollRef}
              contentContainerStyle={[styles.scrollContent, {
                paddingBottom: 100, // ✅ 줄인 패딩 - KeyboardAwareScrollView가 자동 처리
                minHeight: 800 // ✅ 줄인 최소 높이 - 자동 스크롤 시스템 사용
              }]}
              // 🔧 FIX: 키보드 글씨 움직임 완전 제거 - 모든 자동 스크롤 비활성화
              enableAutomaticScroll={false} // 완전 비활성화
              enableResetScrollToCoords={false}
              extraScrollHeight={0} // 🔧 FIX: 0으로 설정하여 키보드 움직임 방지
              extraHeight={0} // 🔧 FIX: 0으로 설정하여 키보드 움직임 방지
              keyboardVerticalOffset={0} 
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="none"
              enableOnAndroid={!isRefocusFromDropdown} // 드롭다운 refocus 시에만 비활성화
              keyboardOpeningTime={250}
              viewIsInsideTabBar={false}
              // ✅ 기존 기능 유지
              nestedScrollEnabled={false}
              removeClippedSubviews={false}
              scrollEnabled={(() => {
                const isEnabled = !dragGuideline.visible && dragMode === 'none' && !preventAutoScroll;
                return isEnabled;
              })()}
              showsVerticalScrollIndicator={true}
              automaticallyAdjustContentInsets={false}
              onTouchStart={() => {
                dismissMenus();
              }}
              onScroll={(event) => {
                // ✅ 성능 최적화: 개발 모드에서만 간소화된 로그
                if (__DEV__ && event.nativeEvent.contentOffset.y % 100 < 16) {
                  console.log('📍 🔄 Scroll Y:', Math.round(event.nativeEvent.contentOffset.y));
                }
              }}
              onScrollBeginDrag={() => {
                if (__DEV__) console.log('📍 🚀 Scroll Begin');
              }}
              onScrollEndDrag={(event) => {
                if (__DEV__) {
                  const scrollY = Math.round(event.nativeEvent.contentOffset.y);
                  const extraScrollCalc = Math.max(80, keyboardHeight * 0.3);
                  const extraHeightCalc = keyboardHeight + 48;
                  console.log(`📍 ✅ Scroll End: Y=${scrollY}px | Config: KB=${keyboardHeight}px, Total=${Math.round(extraScrollCalc + extraHeightCalc)}px`);
                }
              }}
              scrollEventThrottle={100} // ✅ 로그 빈도 줄임 (16ms → 100ms)
            >
              {/* Drag Guidelines */}
              {dragGuideline.visible && (
                <View style={[
                  styles.dragGuideline,
                  dragGuideline.position === 'left' && styles.dragGuidelineLeft,
                  dragGuideline.position === 'right' && styles.dragGuidelineRight
                ]} />
              )}
              
              {/* Author info for public notes */}
              {displayNote.isPublic && (
                <View style={styles.authorSection}>
                  <View style={styles.authorInfo}>
                    <Avatar
                      size="medium"
                      imageUrl={getConsistentAvatarUrl({
                        userId: displayNote.user_id,
                        currentUser: user,
                        currentProfile: profile,
                        currentProfilePhoto: profile?.avatar_url,
                        profiles: displayNote.profiles,
                        avatarUrl: displayNote.avatar_url || displayNote.user?.avatar_url,
                        username: getNoteAuthorForDisplay()
                      })}
                      username={getConsistentUsername({
                        userId: displayNote.user_id,
                        currentUser: user,
                        currentProfile: profile,
                        profiles: displayNote.profiles,
                        username: displayNote.username
                      })}
                    />
                    <View style={styles.authorDetails}>
                      <Text style={styles.authorName}>{getNoteAuthorForDisplay()}</Text>
                      <Text style={styles.authorUserId}>@{getNoteAuthorForDisplay()}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Social Interaction Bar for public notes or when viewing others' notes */}
              {displayNote && (displayNote.isPublic || displayNote.user_id !== user?.id) && (
                <SocialInteractionBar
                  noteId={displayNote.id}
                  authorId={displayNote.user_id || displayNote.userId}
                  initialStarCount={displayNote.starCount || displayNote.star_count || 0}
                  initialForkCount={displayNote.forkCount || displayNote.fork_count || 0}
                />
              )}

              {/* Title Input */}
              <TextInput
                ref={titleInputRef}
                style={styles.titleInput}
                placeholder="Title"
                value={title}
                onChangeText={(newTitle) => {
                  // 🔧 FIX: multiline에서 Enter 키로 인한 줄바꿈 제거 - 타이틀은 단일 제목
                  const cleanTitle = newTitle.replace(/\n/g, '');
                  console.log('🏷️ Title changed:', cleanTitle.length, 'characters');
                  setTitle(cleanTitle);
                }}
                // ✅ 플로팅 툴바 사용으로 inputAccessoryViewID 제거
                onPressIn={(event) => {
                  console.log('🎯 Title input pressed');
                  
                  // 🔧 FIX: iOS에서 클릭 위치 기반 커서 설정
                  if (Platform.OS === 'ios' && event.nativeEvent && event.nativeEvent.locationX !== undefined) {
                    const { locationX } = event.nativeEvent;
                    const charWidth = 13.5; // 22px fontSize + 28px lineHeight의 대략적 문자 너비
                    const clickedCharIndex = Math.floor(locationX / charWidth);
                    const targetIndex = Math.max(0, Math.min(clickedCharIndex, title.length));
                    
                    console.log('🎯 PressIn: Setting cursor to position:', targetIndex);
                    setTimeout(() => {
                      setTitleSelection({ start: targetIndex, end: targetIndex });
                    }, 50);
                  }
                  
                  // 메뉴 해제는 더 늦게
                  setTimeout(() => {
                    dismissMenus();
                  }, 100);
                }}
                onFocus={() => {
                  console.log('🎯 Title input focused - user direct interaction');
                  // 🔧 FIX: 포커스 관련 작업을 setTimeout으로 지연 - 클릭 위치 방해 방지
                  setTimeout(() => {
                    dismissMenus();
                    setFocusedIndex(-1);
                    setIsRefocusFromDropdown(false);
                  }, 10);
                }}
                onContentSizeChange={({ nativeEvent }) => {
                  console.log('📏 Title content size changed:', nativeEvent.contentSize);
                  // No action needed - KeyboardAvoidingView handles positioning
                }}
                onSelectionChange={({ nativeEvent }) => {
                  console.log('🎯 Title selection changed:', nativeEvent.selection);
                  setTitleSelection(nativeEvent.selection);
                }}
                selection={titleSelection}
                onTouchStart={(event) => {
                  const { locationX, locationY } = event.nativeEvent;
                  console.log('🎯 Title touch at:', { locationX, locationY });
                  
                  // 🔧 FIX: iOS 클릭 위치 기반 커서 위치 계산
                  if (Platform.OS === 'ios') {
                    // 대략적인 문자 너비 계산 (fontSize 기반)
                    const charWidth = 13.5; // 22px fontSize + 28px lineHeight의 대략적 문자 너비
                    const clickedCharIndex = Math.floor(locationX / charWidth);
                    const targetIndex = Math.max(0, Math.min(clickedCharIndex, title.length));
                    
                    console.log('🎯 Setting cursor to position:', targetIndex);
                    setTitleSelection({ start: targetIndex, end: targetIndex });
                  }
                }}
                multiline={true}
                scrollEnabled={false}
                {...(Platform.OS === 'ios' && {
                  textBreakStrategy: 'simple', // iOS 텍스트 처리 최적화
                  dataDetectorTypes: 'none', // 불필요한 데이터 감지 비활성화
                })}
                autoCorrect={false}
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="none" // 🔧 FIX: 자동 대문자 변환 비활성화로 키보드 움직임 방지
                editable={isAuthor}
              />

              {/* Content Blocks */}
              <View style={styles.blocksContainer}>
                {blocks.map((block, index) => (
                  <View key={`container-${block.id}`} style={{marginVertical: 0, paddingVertical: 0}}>
                    {/* Drop zone indicator before each block (except first) */}
                    {index > 0 && dragMode === 'reorder' && draggingBlockId && (
                      <View 
                        style={[
                          styles.dropZoneIndicator,
                          hoverTargetBlockId === block.id && styles.dropZoneActive
                        ]} 
                      />
                    )}
                    
                    <NoteBlockRenderer
                      key={block.id}
                      block={block}
                      index={index}
                      blocks={blocks} // Pass blocks array for reorder logic
                      setBlocks={setBlocks} // Add setBlocks for reordering
                    handleTextChange={handleTextChange}
                    setFocusedIndex={setFocusedIndex}
                    keyboardVisible={keyboardVisible}
                    keyboardHeight={keyboardHeight}
                    scrollToFocusedInput={scrollToFocusedInput}
                    handleKeyPress={handleKeyPress}
                    handleDeleteBlock={handleDeleteBlock}
                    // Legacy props
                    cardLayoutModes={cardLayoutModes}
                    setCardLayoutModes={setCardLayoutModes}
                    dragGuideline={dragGuideline}
                    setDragGuideline={setDragGuideline}
                    // New drag and drop props
                    draggingBlockId={draggingBlockId}
                    dragPosition={dragPosition}
                    hoverTargetBlockId={hoverTargetBlockId}
                    dragMode={dragMode}
                    setDraggingBlockId={setDraggingBlockId}
                    setDragPosition={setDragPosition}
                    setHoverTargetBlockId={setHoverTargetBlockId}
                    setDragMode={setDragMode}
                    updateBlockLayoutMode={updateBlockLayoutMode}
                    reorderBlocks={reorderBlocks}
                    groupBlocks={groupBlocks}
                    ungroupBlock={ungroupBlock}
                    // Block position tracking
                    blockPositions={blockPositions}
                    setBlockPositions={(newPositions) => {
                      console.log('📍 NoteDetailScreen setBlockPositions called');
                      setBlockPositions(newPositions);
                    }}
                    // Simple card layout tracking
                    cardLayouts={cardLayouts}
                    setCardLayouts={trackedSetCardLayouts}
                    hoveredBlockId={hoveredBlockId}
                    setHoveredBlockId={setHoveredBlockId}
                    isAuthor={isAuthor}
                    dismissMenus={dismissMenus}
                    toolbarId={TOOLBAR_ID}
                    useGlobalKeyboard={true}
                    setIsRefocusFromDropdown={setIsRefocusFromDropdown} // 드롭다운 플래그 초기화 함수 전달
                    />
                  </View>
                ))}
              </View>

              <TouchableWithoutFeedback
                onPress={() => {
                  console.log('🎯 Empty space touched, focusing last text block');
                  // Close all modals/menus if open
                  if (showPageInfoModal || showSettingsMenu) {
                    dismissMenus();
                    return; // Don't focus input if closing modal/menu
                  }
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

    {/* Page Info Modal */}
    <Modal
        visible={showPageInfoModal}
        animationType="fade"
        transparent={true}
        presentationStyle="overFullScreen"  // ✅ InputAccessoryView 문제 해결
        onRequestClose={() => setShowPageInfoModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPageInfoModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.pageInfoModal}>
                <View style={styles.pageInfoHeader}>
                  <Text style={styles.pageInfoTitle}>Page Information</Text>
                  <TouchableOpacity 
                    onPress={() => setShowPageInfoModal(false)}
                    style={styles.pageInfoCloseButton}
                  >
                    <Icon name="x" size={20} color={Colors.primaryText} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.pageInfoContent}>
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Title</Text>
                    <Text style={styles.pageInfoValue}>{displayNote.title || 'Untitled'}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Created</Text>
                    <Text style={styles.pageInfoValue}>{createdDateFormatted}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Last Modified</Text>
                    <Text style={styles.pageInfoValue}>{lastModifiedFormatted}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Author</Text>
                    <Text style={styles.pageInfoValue}>{authorName}</Text>
                  </View>
                  
                  <View style={styles.pageInfoRow}>
                    <Text style={styles.pageInfoLabel}>Visibility</Text>
                    <View style={styles.visibilityContainer}>
                      <Icon 
                        name={isPublicNote ? "globe" : "lock"} 
                        size={14} 
                        color={Colors.secondaryText} 
                        style={styles.visibilityIcon}
                      />
                      <Text style={styles.pageInfoValue}>
                        {isPublicNote ? 'Public' : 'Private'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* ✅ 플로팅 툴바 사용 (키보드 안정성 유지) */}
      {/* UnifiedToolbar는 App.js에서 전역 렌더링됨 */}
    </>
  );
};

export default NoteDetailScreen;