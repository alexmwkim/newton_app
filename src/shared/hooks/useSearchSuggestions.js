/**
 * useSearchSuggestions - 검색 제안 생성 커스텀 훅
 */

import { useMemo } from 'react';

export const useSearchSuggestions = (notes, maxSuggestions = 8) => {
  const suggestions = useMemo(() => {
    const words = new Set();
    
    notes.forEach(note => {
      // 제목에서 단어 추출
      if (note.title) {
        const titleWords = note.title.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 2) // 2글자 이상만
          .filter(word => !/^\d+$/.test(word)) // 숫자만 있는 단어 제외
          .filter(word => !word.includes('📏') && !word.includes('✅')); // 이모지 포함 단어 제외
        
        titleWords.forEach(word => words.add(word));
      }
      
      // 내용에서 의미있는 단어 추출
      if (note.content) {
        const contentWords = note.content.toLowerCase()
          .split(/\s+/)
          .filter(word => word.length > 3) // 내용에서는 3글자 이상만
          .filter(word => !/^\d+$/.test(word))
          .filter(word => !word.includes('📏') && !word.includes('✅'))
          .slice(0, 10); // 내용에서는 처음 10개 단어만
        
        contentWords.forEach(word => words.add(word));
      }
    });
    
    return Array.from(words).slice(0, maxSuggestions);
  }, [notes, maxSuggestions]);

  return suggestions;
};