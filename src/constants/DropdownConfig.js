// 🎯 드롭다운 시스템 설정 및 상수

export const DROPDOWN_TYPES = {
  NONE: 'none',
  PURPOSE: 'purpose',
  BLOCKS: 'blocks',
  FORMATTING: 'formatting'
};

// 목적별 노트 옵션
export const PURPOSE_ITEMS = [
  {
    id: 'diary',
    icon: '📔',
    label: 'Daily Journal',
    description: 'Personal daily records, emotions, experiences'
  },
  {
    id: 'idea',
    icon: '💡', 
    label: 'Ideas & Memo',
    description: 'Thoughts, inspirations, quick notes'
  },
  {
    id: 'project',
    icon: '🎯',
    label: 'Project Notes', 
    description: 'Work projects, planning, progress tracking'
  },
  {
    id: 'todo',
    icon: '✅',
    label: 'To-Do List',
    description: 'Checklists, task management, planning'
  },
  {
    id: 'creative',
    icon: '🎨',
    label: 'Creative Notes',
    description: 'Writing, poems, stories, creative work'
  }
];

// 드롭다운 설정
export const DROPDOWN_CONFIG = {
  [DROPDOWN_TYPES.PURPOSE]: {
    title: 'Purpose Notes',
    layout: 'grid-2col',
    items: PURPOSE_ITEMS,
    scrollable: true,
    maxHeight: 400
  }
};

// 애니메이션 설정
export const DROPDOWN_ANIMATION = {
  duration: 250,
  easing: 'ease-out',
  useNativeDriver: true
};