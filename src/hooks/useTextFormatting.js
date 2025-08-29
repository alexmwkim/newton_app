import { useCallback } from 'react';

/**
 * 텍스트 포맷팅 훅 - 선택된 텍스트 영역에 마크다운 스타일 적용
 */
export const useTextFormatting = () => {
  
  /**
   * 선택된 텍스트에 포맷 적용
   * @param {string} text - 전체 텍스트
   * @param {Object} selection - 선택 영역 {start, end}
   * @param {string} format - 포맷 타입 ('bold', 'italic', 'heading1', 'heading2', 'heading3')
   * @returns {Object} {newText, newCursorPos}
   */
  const applyFormatToSelection = useCallback((text, selection, format) => {
    const { start, end } = selection;
    const selectedText = text.substring(start, end);
    
    let formattedText;
    let prefix = '';
    let suffix = '';
    
    switch (format) {
      case 'bold':
        // 이미 볼드인지 체크
        if (selectedText.startsWith('**') && selectedText.endsWith('**')) {
          // 볼드 제거
          formattedText = selectedText.slice(2, -2);
        } else {
          // 볼드 적용
          formattedText = `**${selectedText}**`;
        }
        break;
        
      case 'italic':
        // 이미 이탤릭인지 체크 (볼드와 겹치지 않게)
        if (selectedText.startsWith('*') && selectedText.endsWith('*') && !selectedText.startsWith('**')) {
          // 이탤릭 제거
          formattedText = selectedText.slice(1, -1);
        } else {
          // 이탤릭 적용
          formattedText = `*${selectedText}*`;
        }
        break;
        
      case 'heading1':
        // 줄의 시작에서 # 처리
        const lines1 = text.split('\n');
        const lineIndex1 = text.substring(0, start).split('\n').length - 1;
        const currentLine1 = lines1[lineIndex1];
        
        if (currentLine1.startsWith('# ')) {
          // 헤딩 제거
          lines1[lineIndex1] = currentLine1.substring(2);
        } else if (currentLine1.startsWith('## ') || currentLine1.startsWith('### ')) {
          // 다른 헤딩을 H1으로 변경
          lines1[lineIndex1] = currentLine1.replace(/^#{2,3}\s/, '# ');
        } else {
          // H1 추가
          lines1[lineIndex1] = `# ${currentLine1}`;
        }
        
        const newText1 = lines1.join('\n');
        const newCursorPos1 = start + (lines1[lineIndex1].length - currentLine1.length);
        return { newText: newText1, newCursorPos: newCursorPos1 };
        
      case 'heading2':
        const lines2 = text.split('\n');
        const lineIndex2 = text.substring(0, start).split('\n').length - 1;
        const currentLine2 = lines2[lineIndex2];
        
        if (currentLine2.startsWith('## ')) {
          // H2 제거
          lines2[lineIndex2] = currentLine2.substring(3);
        } else if (currentLine2.startsWith('# ') || currentLine2.startsWith('### ')) {
          // 다른 헤딩을 H2로 변경
          lines2[lineIndex2] = currentLine2.replace(/^#{1}|^#{3}\s/, '## ');
        } else {
          // H2 추가
          lines2[lineIndex2] = `## ${currentLine2}`;
        }
        
        const newText2 = lines2.join('\n');
        const newCursorPos2 = start + (lines2[lineIndex2].length - currentLine2.length);
        return { newText: newText2, newCursorPos: newCursorPos2 };
        
      case 'heading3':
        const lines3 = text.split('\n');
        const lineIndex3 = text.substring(0, start).split('\n').length - 1;
        const currentLine3 = lines3[lineIndex3];
        
        if (currentLine3.startsWith('### ')) {
          // H3 제거
          lines3[lineIndex3] = currentLine3.substring(4);
        } else if (currentLine3.startsWith('# ') || currentLine3.startsWith('## ')) {
          // 다른 헤딩을 H3로 변경
          lines3[lineIndex3] = currentLine3.replace(/^#{1,2}\s/, '### ');
        } else {
          // H3 추가
          lines3[lineIndex3] = `### ${currentLine3}`;
        }
        
        const newText3 = lines3.join('\n');
        const newCursorPos3 = start + (lines3[lineIndex3].length - currentLine3.length);
        return { newText: newText3, newCursorPos: newCursorPos3 };
        
      default:
        formattedText = selectedText;
    }
    
    // 텍스트 교체 (bold, italic의 경우)
    const newText = text.substring(0, start) + formattedText + text.substring(end);
    const newCursorPos = start + formattedText.length;
    
    return { newText, newCursorPos };
  }, []);

  /**
   * 텍스트에서 특정 포맷 제거
   * @param {string} text - 전체 텍스트
   * @param {Object} selection - 선택 영역
   * @param {string} format - 제거할 포맷 타입
   * @returns {Object} {newText, newCursorPos}
   */
  const removeFormatFromSelection = useCallback((text, selection, format) => {
    const { start, end } = selection;
    const selectedText = text.substring(start, end);
    
    let cleanedText;
    switch (format) {
      case 'bold':
        cleanedText = selectedText.replace(/\*\*(.*?)\*\*/g, '$1');
        break;
      case 'italic':
        cleanedText = selectedText.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '$1');
        break;
      case 'heading':
        cleanedText = selectedText.replace(/^#{1,3}\s/, '');
        break;
      default:
        cleanedText = selectedText;
    }
    
    const newText = text.substring(0, start) + cleanedText + text.substring(end);
    return { newText, newCursorPos: start + cleanedText.length };
  }, []);

  /**
   * 현재 선택 영역의 포맷 상태 확인
   * @param {string} text - 전체 텍스트
   * @param {Object} selection - 선택 영역
   * @returns {Object} 현재 포맷 상태
   */
  const getFormatStatus = useCallback((text, selection) => {
    const { start, end } = selection;
    const selectedText = text.substring(start, end);
    
    const isBold = selectedText.startsWith('**') && selectedText.endsWith('**');
    const isItalic = selectedText.startsWith('*') && selectedText.endsWith('*') && !selectedText.startsWith('**');
    
    // 헤딩은 줄 단위로 체크
    const lineStart = text.lastIndexOf('\n', start) + 1;
    const lineEnd = text.indexOf('\n', end);
    const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);
    
    const isH1 = line.startsWith('# ');
    const isH2 = line.startsWith('## ');
    const isH3 = line.startsWith('### ');
    
    return {
      bold: isBold,
      italic: isItalic,
      heading1: isH1,
      heading2: isH2,
      heading3: isH3
    };
  }, []);

  return { 
    applyFormatToSelection, 
    removeFormatFromSelection,
    getFormatStatus
  };
};