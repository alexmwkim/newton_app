/**
 * 블록 관련 유틸리티 함수들
 * 블록 조작과 관련된 공통 로직을 모아둔 파일
 */

/**
 * 새로운 블록 생성
 */
export const createBlock = (type, content = '', additionalProps = {}) => {
  const blockId = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseBlock = {
    id: blockId,
    type,
    content,
    ref: null, // React ref는 컴포넌트에서 할당
    ...additionalProps
  };

  return baseBlock;
};

/**
 * 블록 배열에서 특정 인덱스의 블록을 안전하게 가져오기
 */
export const getBlockAtIndex = (blocks, index) => {
  if (index < 0 || index >= blocks.length) {
    return null;
  }
  return blocks[index];
};

/**
 * 블록 ID로 블록과 인덱스 찾기
 */
export const findBlockById = (blocks, blockId) => {
  const index = blocks.findIndex(block => block.id === blockId);
  return {
    block: index !== -1 ? blocks[index] : null,
    index: index !== -1 ? index : -1
  };
};

/**
 * 블록 배열에서 특정 인덱스에 새 블록 삽입
 */
export const insertBlockAtIndex = (blocks, newBlock, index) => {
  const updatedBlocks = [...blocks];
  updatedBlocks.splice(index, 0, newBlock);
  return updatedBlocks;
};

/**
 * 블록 배열에서 특정 인덱스의 블록 제거
 */
export const removeBlockAtIndex = (blocks, index) => {
  if (index < 0 || index >= blocks.length) {
    console.warn(`Cannot remove block at index ${index}: out of bounds`);
    return blocks;
  }
  
  const updatedBlocks = [...blocks];
  updatedBlocks.splice(index, 1);
  return updatedBlocks;
};

/**
 * 블록 배열에서 특정 인덱스의 블록 내용 업데이트
 */
export const updateBlockContent = (blocks, index, newContent) => {
  if (index < 0 || index >= blocks.length) {
    console.warn(`Cannot update block at index ${index}: out of bounds`);
    return blocks;
  }

  const updatedBlocks = [...blocks];
  updatedBlocks[index] = {
    ...updatedBlocks[index],
    content: newContent
  };
  return updatedBlocks;
};

/**
 * 블록 배열에서 fromIndex의 블록을 toIndex로 이동
 */
export const moveBlock = (blocks, fromIndex, toIndex) => {
  if (fromIndex < 0 || fromIndex >= blocks.length) {
    console.warn(`Cannot move block from index ${fromIndex}: out of bounds`);
    return blocks;
  }
  
  if (toIndex < 0 || toIndex >= blocks.length) {
    console.warn(`Cannot move block to index ${toIndex}: out of bounds`);
    return blocks;
  }

  if (fromIndex === toIndex) {
    return blocks; // 같은 위치로 이동하는 경우 변경 없음
  }

  const updatedBlocks = [...blocks];
  const [movedBlock] = updatedBlocks.splice(fromIndex, 1);
  updatedBlocks.splice(toIndex, 0, movedBlock);
  
  return updatedBlocks;
};

/**
 * 블록 타입별 기본 스타일 매핑
 */
export const getBlockTypeStyles = (blockType) => {
  const styleMap = {
    text: {
      minHeight: 24,
      placeholder: 'Type here...',
    },
    card: {
      minHeight: 80,
      placeholder: 'Write something',
      borderRadius: 10,
    },
    'grid-card': {
      minHeight: 60,
      placeholder: 'Small note',
      width: '48%',
    },
    image: {
      minHeight: 200,
      borderRadius: 10,
    }
  };

  return styleMap[blockType] || styleMap.text;
};

/**
 * 블록 유형별 유효성 검사
 */
export const validateBlockContent = (blockType, content) => {
  switch (blockType) {
    case 'text':
    case 'card':
    case 'grid-card':
      return typeof content === 'string';
    case 'image':
      return typeof content === 'string' && content.startsWith('http');
    default:
      return true;
  }
};

/**
 * 빈 블록인지 확인
 */
export const isEmptyBlock = (block) => {
  if (!block || !block.content) return true;
  
  if (typeof block.content === 'string') {
    return block.content.trim().length === 0;
  }
  
  return false;
};

/**
 * 연속된 빈 텍스트 블록들을 찾아서 제거
 */
export const removeEmptyTextBlocks = (blocks, keepAtLeastOne = true) => {
  let filteredBlocks = blocks.filter(block => {
    if (block.type === 'text') {
      return !isEmptyBlock(block);
    }
    return true; // 텍스트가 아닌 블록은 유지
  });

  // 최소 하나의 텍스트 블록은 유지
  if (keepAtLeastOne && filteredBlocks.length === 0) {
    filteredBlocks = [createBlock('text')];
  }

  return filteredBlocks;
};

/**
 * 블록 배열의 깊은 복사
 */
export const cloneBlocks = (blocks) => {
  return blocks.map(block => ({ ...block }));
};

/**
 * 블록 ID 생성기
 */
export const generateBlockId = (prefix = 'block') => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};