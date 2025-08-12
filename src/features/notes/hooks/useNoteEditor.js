/**
 * useNoteEditor - 노트 에디터 상태 및 로직 관리 훅
 * 블록 시스템, 드래그 앤 드롭, 포커스 관리 등을 통합 관리
 */

import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Alert } from 'react-native';
import { useNotesStore } from '../../../store/NotesStore';
import { useAuth } from '../../../contexts/AuthContext';
import { 
  parseNoteContentToBlocks, 
  cleanLegacyContent,
  generateId 
} from '../../../utils/noteUtils';
import logger from '../../../utils/Logger';

export const useNoteEditor = (initialNote = null, noteId = null) => {
  // Refs
  const scrollRef = useRef(null);
  const titleInputRef = useRef(null);

  // Auth & Store
  const { user, profile } = useAuth();
  const { 
    updateNote, 
    createNote, 
    deleteNote, 
    toggleStarred, 
    isStarred,
    getNoteById
  } = useNotesStore();

  // Basic States
  const [title, setTitle] = useState(initialNote?.title || '');
  const [blocks, setBlocks] = useState([
    { id: generateId(), type: 'text', content: '', ref: React.createRef() },
  ]);
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [loadingNote, setLoadingNote] = useState(!!noteId);
  const [storeNote, setStoreNote] = useState(initialNote);
  const [contentInitialized, setContentInitialized] = useState(false);

  // Drag & Drop States
  const [draggingBlockId, setDraggingBlockId] = useState(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [hoverTargetBlockId, setHoverTargetBlockId] = useState(null);
  const [hoveredBlockId, setHoveredBlockId] = useState(null);
  const [dragMode, setDragMode] = useState('none'); // 'none', 'resize', 'reorder'
  const [blockPositions, setBlockPositions] = useState({});
  const [cardLayouts, setCardLayouts] = useState({});
  const [cardLayoutModes, setCardLayoutModes] = useState({});
  const [dragGuideline, setDragGuideline] = useState({ visible: false, position: 'center' });

  // UI States
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [showPageInfoModal, setShowPageInfoModal] = useState(false);

  // 노트 정규화
  const normalizedNote = useMemo(() => {
    if (!storeNote) return null;
    return {
      ...storeNote,
      isPublic: storeNote.isPublic || storeNote.is_public || false,
      username: storeNote.username || storeNote.profiles?.username || 'Unknown',
      starCount: storeNote.star_count || storeNote.starCount || 0,
      forkCount: storeNote.fork_count || storeNote.forkCount || 0,
      content: cleanLegacyContent(storeNote.content)
    };
  }, [storeNote]);

  // 블록 관리 함수들
  const addBlock = useCallback((type = 'text', afterIndex = focusedIndex) => {
    const newBlock = {
      id: generateId(),
      type,
      content: '',
      ref: React.createRef()
    };

    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      newBlocks.splice(afterIndex + 1, 0, newBlock);
      return newBlocks;
    });

    // 새 블록에 포커스
    setTimeout(() => {
      setFocusedIndex(afterIndex + 1);
      newBlock.ref.current?.focus();
    }, 50);

    logger.debug('📝 Added new block:', type, 'at index', afterIndex + 1);
  }, [focusedIndex]);

  const removeBlock = useCallback((index) => {
    if (blocks.length <= 1) {
      logger.warn('📝 Cannot remove last block');
      return;
    }

    setBlocks(prevBlocks => prevBlocks.filter((_, i) => i !== index));
    
    // 포커스 조정
    const newFocusIndex = index > 0 ? index - 1 : 0;
    setFocusedIndex(newFocusIndex);
    
    setTimeout(() => {
      blocks[newFocusIndex]?.ref.current?.focus();
    }, 50);

    logger.debug('📝 Removed block at index:', index);
  }, [blocks]);

  const updateBlock = useCallback((index, content) => {
    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      if (newBlocks[index]) {
        newBlocks[index] = { ...newBlocks[index], content };
      }
      return newBlocks;
    });
  }, []);

  const moveBlock = useCallback((fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    setBlocks(prevBlocks => {
      const newBlocks = [...prevBlocks];
      const [movedBlock] = newBlocks.splice(fromIndex, 1);
      newBlocks.splice(toIndex, 0, movedBlock);
      return newBlocks;
    });

    setFocusedIndex(toIndex);
    logger.debug('📝 Moved block from', fromIndex, 'to', toIndex);
  }, []);

  // 자동 저장
  const autoSave = useCallback(async () => {
    if (!user || !contentInitialized) return;

    try {
      const contentString = blocks
        .map(block => `${block.type}:${block.content}`)
        .join('\n');

      const noteData = {
        title: title.trim() || 'Untitled',
        content: contentString,
        user_id: user.id,
        is_public: normalizedNote?.isPublic || false
      };

      if (noteId && storeNote) {
        // 기존 노트 업데이트
        await updateNote(noteId, noteData);
        logger.debug('💾 Auto-saved existing note:', noteId);
      } else if (title.trim() || blocks.some(b => b.content.trim())) {
        // 새 노트 생성
        const newNote = await createNote(noteData);
        setStoreNote(newNote);
        logger.debug('💾 Auto-saved new note:', newNote.id);
      }
    } catch (error) {
      logger.error('💾 Auto-save failed:', error);
    }
  }, [
    user, 
    contentInitialized, 
    blocks, 
    title, 
    noteId, 
    storeNote, 
    normalizedNote?.isPublic, 
    updateNote, 
    createNote
  ]);

  // 포맷팅 함수들
  const toggleFormat = useCallback((format) => {
    if (focusedIndex >= 0 && blocks[focusedIndex]) {
      const currentBlock = blocks[focusedIndex];
      let newContent = currentBlock.content;

      switch (format) {
        case 'bold':
          newContent = newContent.startsWith('**') && newContent.endsWith('**')
            ? newContent.slice(2, -2)
            : `**${newContent}**`;
          break;
        case 'italic':
          newContent = newContent.startsWith('*') && newContent.endsWith('*')
            ? newContent.slice(1, -1)
            : `*${newContent}*`;
          break;
        case 'heading':
          newContent = newContent.startsWith('# ')
            ? newContent.slice(2)
            : `# ${newContent}`;
          break;
        case 'bullet':
          newContent = newContent.startsWith('- ')
            ? newContent.slice(2)
            : `- ${newContent}`;
          break;
      }

      updateBlock(focusedIndex, newContent);
      logger.debug('📝 Applied format:', format, 'to block', focusedIndex);
    }
  }, [focusedIndex, blocks, updateBlock]);

  // 드래그 관련 함수들
  const startDrag = useCallback((blockId, mode = 'reorder') => {
    setDraggingBlockId(blockId);
    setDragMode(mode);
    logger.debug('🎯 Started drag:', blockId, mode);
  }, []);

  const endDrag = useCallback(() => {
    setDraggingBlockId(null);
    setDragMode('none');
    setHoverTargetBlockId(null);
    setHoveredBlockId(null);
    setDragGuideline({ visible: false, position: 'center' });
    logger.debug('🎯 Ended drag');
  }, []);

  // 초기화
  const initializeNote = useCallback(async (noteData) => {
    if (noteData) {
      setTitle(noteData.title || '');
      setStoreNote(noteData);

      // 블록으로 파싱
      if (noteData.content) {
        const parsedBlocks = parseNoteContentToBlocks(noteData.content);
        if (parsedBlocks.length > 0) {
          setBlocks(parsedBlocks.map(block => ({
            ...block,
            ref: React.createRef()
          })));
        }
      }

      setContentInitialized(true);
      logger.debug('📝 Initialized note:', noteData.id);
    }
    setLoadingNote(false);
  }, []);

  // 노트 로딩 useEffect - TODO 구현
  useEffect(() => {
    const loadNote = async () => {
      // 이미 initialNote가 있으면 초기화
      if (initialNote) {
        logger.debug('📝 Using initial note:', initialNote.id);
        await initializeNote(initialNote);
        return;
      }

      // noteId가 있으면 스토어에서 노트 로드
      if (noteId && !storeNote) {
        logger.debug('🔍 Loading note from store:', noteId);
        try {
          setLoadingNote(true);
          const foundNote = await getNoteById(noteId);
          
          if (foundNote) {
            logger.debug('✅ Note loaded successfully:', foundNote.title);
            await initializeNote(foundNote);
          } else {
            logger.warn('❌ Note not found:', noteId);
            // 노트를 찾을 수 없는 경우 빈 노트로 초기화
            await initializeNote({
              id: noteId,
              title: 'Note Not Found',
              content: 'This note could not be loaded.',
              created_at: new Date().toISOString(),
              is_public: false
            });
          }
        } catch (error) {
          logger.error('❌ Error loading note:', error);
          // 에러 발생 시 빈 노트로 초기화
          await initializeNote({
            id: noteId,
            title: 'Error Loading Note',
            content: 'An error occurred while loading this note.',
            created_at: new Date().toISOString(),
            is_public: false
          });
        }
      } else if (!noteId && !initialNote) {
        // 새 노트 생성 모드
        logger.debug('📝 Creating new note');
        setLoadingNote(false);
        setContentInitialized(true);
      }
    };

    loadNote();
  }, [noteId, initialNote, storeNote, initializeNote, getNoteById]);

  return {
    // Refs
    scrollRef,
    titleInputRef,

    // Basic States
    title,
    setTitle,
    blocks,
    setBlocks,
    focusedIndex,
    setFocusedIndex,
    loadingNote,
    storeNote,
    normalizedNote,
    contentInitialized,

    // Drag States
    draggingBlockId,
    dragPosition,
    setDragPosition,
    hoverTargetBlockId,
    setHoverTargetBlockId,
    hoveredBlockId,
    setHoveredBlockId,
    dragMode,
    blockPositions,
    setBlockPositions,
    cardLayouts,
    setCardLayouts,
    cardLayoutModes,
    setCardLayoutModes,
    dragGuideline,
    setDragGuideline,

    // UI States
    showSettingsMenu,
    setShowSettingsMenu,
    showPageInfoModal,
    setShowPageInfoModal,

    // Functions
    addBlock,
    removeBlock,
    updateBlock,
    moveBlock,
    autoSave,
    toggleFormat,
    startDrag,
    endDrag,
    initializeNote,

    // Store functions
    toggleStarred,
    isStarred,
    deleteNote,

    // User info
    user,
    profile
  };
};