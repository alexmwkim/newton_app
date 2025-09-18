// 🎯 목적별 블록 카테고리 정의

export const BLOCK_CATEGORIES = {
  DIARY: {
    id: 'diary',
    icon: '📔',
    title: 'Daily Journal',
    color: '#FFF3E0', // 따뜻한 오렌지 톤
    blocks: [
      {
        id: 'date-block',
        icon: '📅',
        title: 'Date Block',
        type: 'text',
        template: `📅 ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric',
          year: 'numeric' 
        })}`
      },
      {
        id: 'mood-tracker',
        icon: '😊',
        title: 'Mood Tracker',
        type: 'transparent-card',
        template: '**Today\'s Mood:** \n\n**Energy Level:** ⭐⭐⭐☆☆\n\n**What affected it:**'
      },
      {
        id: 'daily-reflection',
        icon: '📋',
        title: 'Daily Reflection',
        type: 'transparent-card',
        template: '**Best moment of today:**\n\n**Something I learned:**\n\n**Tomorrow I want to:**'
      },
      {
        id: 'gratitude-list',
        icon: '✨',
        title: 'Gratitude List',
        type: 'transparent-card',
        template: '**Grateful for:**\n• \n• \n• '
      }
    ]
  },

  IDEAS: {
    id: 'ideas',
    icon: '💡',
    title: 'Ideas & Memo',
    color: '#FFF9C4', // 연한 노란색
    blocks: [
      {
        id: 'quick-thought',
        icon: '💭',
        title: 'Quick Thought',
        type: 'text',
        template: '💭 '
      },
      {
        id: 'detailed-idea',
        icon: '📝',
        title: 'Detailed Idea',
        type: 'card',
        template: '**Idea:** \n\n**Why it matters:**\n\n**Next steps:**'
      },
      {
        id: 'reference-link',
        icon: '🔗',
        title: 'Reference Link',
        type: 'text',
        template: '🔗 [Link Title](https://)'
      },
      {
        id: 'inspiration-image',
        icon: '🖼️',
        title: 'Inspiration Image',
        type: 'image',
        template: null // 이미지 선택 다이얼로그
      }
    ]
  },

  PROJECT: {
    id: 'project',
    icon: '🎯',
    title: 'Project Notes',
    color: '#E3F2FD', // 연한 파란색
    blocks: [
      {
        id: 'project-overview',
        icon: '📊',
        title: 'Project Overview',
        type: 'card',
        template: '**Project:** \n\n**Goal:** \n\n**Deadline:** \n\n**Key Metrics:**'
      },
      {
        id: 'task-checklist',
        icon: '✅',
        title: 'Task Checklist',
        type: 'card',
        template: '**Tasks:**\n☐ \n☐ \n☐ '
      },
      {
        id: 'progress-update',
        icon: '📈',
        title: 'Progress Update',
        type: 'card',
        template: '**Completed:**\n\n**In Progress:**\n\n**Blockers:**\n\n**Next:**'
      },
      {
        id: 'goal-setting',
        icon: '🎯',
        title: 'Goal Setting',
        type: 'card',
        template: '**SMART Goal:**\n\n**Specific:** \n**Measurable:** \n**Achievable:** \n**Relevant:** \n**Time-bound:**'
      }
    ]
  },

  TODO: {
    id: 'todo',
    icon: '✅',
    title: 'To-Do List',
    color: '#F3E5F5', // 연한 보라색
    blocks: [
      {
        id: 'simple-task',
        icon: '☐',
        title: 'Simple Task',
        type: 'text',
        template: '☐ '
      },
      {
        id: 'priority-task',
        icon: '⭐',
        title: 'Priority Task',
        type: 'text',
        template: '⭐ **HIGH:** '
      },
      {
        id: 'task-group',
        icon: '📋',
        title: 'Task Group',
        type: 'card',
        template: '**Project:** \n\n☐ Task 1\n☐ Task 2\n☐ Task 3\n\n**Due:** '
      },
      {
        id: 'deadline-reminder',
        icon: '⏰',
        title: 'Deadline Reminder',
        type: 'card',
        template: '⏰ **DEADLINE:** \n\n**What:** \n\n**When:** \n\n**Priority:** '
      }
    ]
  },

  CREATIVE: {
    id: 'creative',
    icon: '🎨',
    title: 'Creative Notes',
    color: '#E8F5E8', // 연한 초록색
    blocks: [
      {
        id: 'story-draft',
        icon: '✍️',
        title: 'Story Draft',
        type: 'card',
        template: '**Title:** \n\n**Character:** \n\n**Setting:** \n\n**Plot:**'
      },
      {
        id: 'creative-card',
        icon: '🎨',
        title: 'Creative Card',
        type: 'card',
        template: '**Inspiration:** \n\n**Concept:** \n\n**Medium:** \n\n**Next steps:**'
      },
      {
        id: 'inspiration-note',
        icon: '🎵',
        title: 'Inspiration',
        type: 'text',
        template: '🎵 **Inspired by:** '
      },
      {
        id: 'visual-reference',
        icon: '🖼️',
        title: 'Visual Reference',
        type: 'image',
        template: null
      }
    ]
  }
};

// 헬퍼 함수들
export const getAllCategories = () => Object.values(BLOCK_CATEGORIES);

export const getCategoryById = (categoryId) => {
  const key = categoryId.toUpperCase();
  return BLOCK_CATEGORIES[key] || null;
};

export const getBlockById = (categoryId, blockId) => {
  const category = getCategoryById(categoryId);
  if (!category) return null;
  
  return category.blocks.find(block => block.id === blockId) || null;
};

export const getAllBlocks = () => {
  return getAllCategories().flatMap(category => 
    category.blocks.map(block => ({
      ...block,
      categoryId: category.id,
      categoryTitle: category.title,
      categoryIcon: category.icon
    }))
  );
};