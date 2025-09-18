import React from 'react';
import { Platform } from 'react-native';

// 🔧 FIX: Use timestamp + random to prevent ID collisions
export const generateId = () => `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// 🆕 포맷 정보를 JSON 문자열로 변환하여 콘텐츠에 저장하는 함수
export const formatToMarkdown = (content, formats) => {
  if (!formats || (!formats.bold && !formats.italic && !formats.heading1 && !formats.heading2 && !formats.heading3)) {
    return content; // 포맷이 없으면 원본 반환
  }
  
  let formatted = content;
  
  // 헤딩 처리 (우선순위: H1 > H2 > H3)
  if (formats.heading1) {
    formatted = `# ${formatted}`;
  } else if (formats.heading2) {
    formatted = `## ${formatted}`;
  } else if (formats.heading3) {
    formatted = `### ${formatted}`;
  } else {
    // 헤딩이 아닐 때만 볼드/이탤릭 적용
    if (formats.bold && formats.italic) {
      formatted = `***${formatted}***`; // 볼드 + 이탤릭
    } else if (formats.bold) {
      formatted = `**${formatted}**`; // 볼드만
    } else if (formats.italic) {
      formatted = `*${formatted}*`; // 이탤릭만
    }
  }
  
  return formatted;
};

// 🆕 마크다운 포맷을 파싱하여 포맷 정보와 순수 콘텐츠로 분리하는 함수
export const parseMarkdownFormat = (formattedContent) => {
  if (!formattedContent) {
    return { content: '', formats: null };
  }
  
  let content = formattedContent;
  const formats = {
    bold: false,
    italic: false,
    heading1: false,
    heading2: false,
    heading3: false
  };
  
  // 헤딩 파싱 (우선순위: H1 > H2 > H3)
  if (content.startsWith('# ')) {
    formats.heading1 = true;
    content = content.substring(2);
  } else if (content.startsWith('## ')) {
    formats.heading2 = true;
    content = content.substring(3);
  } else if (content.startsWith('### ')) {
    formats.heading3 = true;
    content = content.substring(4);
  } else {
    // 볼드 + 이탤릭 파싱
    if (content.startsWith('***') && content.endsWith('***') && content.length > 6) {
      formats.bold = true;
      formats.italic = true;
      content = content.substring(3, content.length - 3);
    } else if (content.startsWith('**') && content.endsWith('**') && content.length > 4) {
      formats.bold = true;
      content = content.substring(2, content.length - 2);
    } else if (content.startsWith('*') && content.endsWith('*') && content.length > 2) {
      formats.italic = true;
      content = content.substring(1, content.length - 1);
    }
  }
  
  // ✅ FIX: 항상 포맷 객체 반환 (새로고침 후 복원을 위해)
  // null 반환하면 새로고침 후 포맷 상태를 알 수 없음
  return { 
    content, 
    formats: formats  // 포맷이 모두 false여도 객체로 반환
  };
};

// Clean legacy markdown placeholders from note content
export const cleanLegacyContent = (content) => {
  if (!content) return content;
  
  // Remove card placeholders: 📋 [Card N](#card-id)
  let cleaned = content.replace(/📋\s*\[Card\s+\d+\]\([^)]+\)/g, '');
  
  // Remove page references: 📄 [Title](pageId) or 📄 [[Title|pageId]]
  cleaned = cleaned.replace(/📄\s*\[\[([^|]+)\|([^\]]+)\]\]/g, '$1');
  cleaned = cleaned.replace(/📄\s*\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove folder references: 📁 [FolderName](#folder-id)
  cleaned = cleaned.replace(/📁\s*\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // ✅ 빈 줄 유지 - 사용자 의도 보존
  // 정규식과 trim() 모두 제거하여 원본 개행 구조 완전 보존
  
  return cleaned;
};

// Keyboard-aware helper functions based on react-native-keyboard-aware-scroll-view
export const getKeyboardAwareConfig = () => {
  return {
    keyboardVerticalOffset: Platform.OS === 'ios' ? 56 : 0,
    extraScrollHeight: Platform.OS === 'ios' ? 80 : 100,
    paddingBottom: Platform.OS === 'ios' ? 40 : 60,
    enableOnAndroid: true,
    keyboardShouldPersistTaps: 'handled',
    scrollEventThrottle: 16
  };
};

// Initialize content from note data
export const parseNoteContentToBlocks = (noteData) => {
  console.log('🔄 PARSING START - Raw content:', {
    hasContent: !!(noteData?.content),
    contentLength: (noteData?.content || '').length,
    content: noteData?.content || 'NO_CONTENT',
    trimmedContent: (noteData?.content || '').trim() || 'EMPTY_AFTER_TRIM'
  });

  if (!noteData || !noteData.content) {
    console.log('🔄 PARSING - No content provided, creating default empty block');
    return [
      { 
        id: generateId(), 
        type: 'text', 
        content: '', 
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null,
        savedFormats: null
      }
    ];
  }

  // ✅ 빈 줄로만 구성된 콘텐츠도 처리 - trim() 조건 제거
  if (noteData.content === '') {
    console.log('🔄 PARSING - Empty string content, creating default empty block');
    return [
      { 
        id: generateId(), 
        type: 'text', 
        content: '', 
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null,
        savedFormats: null
      }
    ];
  }

  console.log('🔄 Loading note content for editing:', noteData.content);
  console.log('🔍 RAW CONTENT TYPE:', typeof noteData.content);
  console.log('🔍 RAW CONTENT LENGTH:', noteData.content?.length);
  
  const newBlocks = [];
  const content = noteData.content;
  
  // Split by double newlines first (as saved), then process each part
  const parts = content.split('\n\n');
  
  console.log('📋 Content parts:', parts);
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const trimmedPart = part.trim();
    
    console.log('📋 Processing part:', part, '(trimmed:', trimmedPart, ')');
    
    if (trimmedPart.startsWith('📋 Card:')) {
      // Card block - include all content after "📋 Card:" as card content
      const cardContent = part.replace('📋 Card:', '').trim();
      console.log('📋 Found card with multiline content:', cardContent);
      newBlocks.push({
        id: generateId(),
        type: 'card',
        content: cardContent,
        ref: React.createRef(),
        layoutMode: 'full',
        groupId: null
      });
    } else if (trimmedPart.startsWith('🔲 Grid:')) {
      // Grid card block - include all content after "🔲 Grid:" as grid card content
      const gridCardContent = part.replace('🔲 Grid:', '').trim();
      console.log('🔲 Found grid card with content:', gridCardContent);
      newBlocks.push({
        id: generateId(),
        type: 'grid-card',
        content: gridCardContent,
        ref: React.createRef(),
        layoutMode: 'grid-left',
        groupId: null
      });
    } else if (trimmedPart.startsWith('🖼️ Image:')) {
      // Image block
      const imageUri = part.replace('🖼️ Image:', '').trim();
      console.log('🖼️ Found image with URI:', imageUri);
      newBlocks.push({
        id: generateId(),
        type: 'image',
        content: imageUri,
        layoutMode: 'full',
        groupId: null
      });
    } else {
      // Text part - could be multiple lines, split and create text blocks
      // ✅ 빈 part도 처리 (연속 빈 줄 = 빈 part)
      if (!trimmedPart) {
        // 완전히 빈 part = 빈 줄
        newBlocks.push({
          id: generateId(),
          type: 'text',
          content: '',
          ref: React.createRef(),
          layoutMode: 'full',
          groupId: null,
          savedFormats: null
        });
      } else {
        const lines = part.split('\n');
        console.log('📝 Found text part with lines:', lines);
        
        lines.forEach(line => {
          // ✅ 포맷 정보 파싱하여 저장
          const parsed = parseMarkdownFormat(line);
          newBlocks.push({
            id: generateId(),
            type: 'text',
            content: parsed.content, // 순수 콘텐츠만 저장
            ref: React.createRef(),
            layoutMode: 'full',
            groupId: null,
            savedFormats: parsed.formats // 포맷 정보 저장
          });
        });
      }
    }
  }
  
  // Ensure at least one empty block at the end
  if (newBlocks.length === 0 || newBlocks[newBlocks.length - 1].type !== 'text' || newBlocks[newBlocks.length - 1].content.trim() !== '') {
    newBlocks.push({
      id: generateId(),
      type: 'text',
      content: '',
      ref: React.createRef(),
      layoutMode: 'full',
      groupId: null,
      savedFormats: null
    });
  }
  
  console.log('🔄 Created blocks from content:', newBlocks.map(b => ({ type: b.type, content: b.content?.substring(0, 50) || 'empty' })));
  return newBlocks;
};

// Convert blocks back to content string for saving
export const convertBlocksToContent = (blocks) => {
  console.log('🔍 All blocks before filtering:', blocks.map(b => ({ 
    type: b.type, 
    content: b.content === '' ? 'EMPTY_STRING' : (b.content?.substring(0, 50) || 'undefined_content'),
    contentLength: (b.content || '').length
  })));
  
  const contentParts = [];
  
  blocks.forEach((block, index) => {
    console.log(`🔍 Processing block ${index}:`, {
      type: block.type,
      content: block.content === '' ? 'EMPTY_STRING' : block.content,
      contentLength: (block.content || '').length
    });
    
    if (block.type === 'text') {
      // ✅ 포맷 정보를 마크다운으로 변환하여 저장
      const content = block.content || '';
      const formats = block.savedFormats || null;
      const formattedContent = formatToMarkdown(content, formats);
      contentParts.push(formattedContent);
      console.log(`🔍 Added text block ${index} to parts:`, formattedContent === '' ? 'EMPTY_STRING' : formattedContent);
      if (formats) {
        console.log(`🎨 Block ${index} has formats:`, formats);
      }
    } else if (block.type === 'card') {
      // Save card even if empty
      const cardContent = block.content?.trim() || '';
      contentParts.push(`📋 Card: ${cardContent}`);
    } else if (block.type === 'grid-card') {
      // Save grid card even if empty
      const gridCardContent = block.content?.trim() || '';
      contentParts.push(`🔲 Grid: ${gridCardContent}`);
    } else if (block.type === 'image' && block.content) {
      contentParts.push(`🖼️ Image: ${block.content}`);
    }
  });
  
  const blockContent = contentParts.join('\n\n');
  // ✅ trim() 제거 - 앞뒤 빈 줄도 유지
  const contentText = cleanLegacyContent(blockContent);
  
  console.log('💾 Content conversion details:', {
    totalBlocks: blocks.length,
    contentParts: contentParts.length,
    rawBlockContent: blockContent.substring(0, 200) + '...',
    finalContent: contentText.substring(0, 200) + '...',
    contentLength: contentText.length
  });
  
  return contentText;
};

// Check if blocks have any content
export const hasContent = (title, blocks) => {
  const titleHasContent = title.trim().length > 0;
  const blocksHaveContent = blocks.some(block => 
    (block.type === 'text' && block.content?.trim()) ||
    (block.type === 'card' && block.content?.trim()) ||
    (block.type === 'grid-card' && block.content?.trim()) ||
    (block.type === 'image' && block.content)
  );
  return titleHasContent || blocksHaveContent;
};