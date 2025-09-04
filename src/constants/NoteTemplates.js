// 📝 노트 템플릿 정의

export const NOTE_TEMPLATES = {
  diary: {
    title: 'Daily Journal',
    category: 'diary',
    content: [
      { 
        type: 'heading', 
        text: `📔 ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}` 
      },
      { type: 'text', text: 'How was your day today?' },
      { type: 'text', text: '' },
      { type: 'text', text: '**What I\'m grateful for:**' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Tomorrow\'s goals:**' },
      { type: 'text', text: '' }
    ]
  },
  
  idea: {
    title: 'New Ideas',
    category: 'idea', 
    content: [
      { type: 'heading', text: '💡 Ideas' },
      { type: 'text', text: 'What ideas came to mind?' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Key points:**' },
      { type: 'text', text: '• ' },
      { type: 'text', text: '• ' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Next steps:**' },
      { type: 'text', text: '' }
    ]
  },
  
  project: {
    title: 'Project Notes',
    category: 'project',
    content: [
      { type: 'heading', text: '🎯 Project Planning' },
      { type: 'text', text: '**Project overview:**' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Goals:**' },
      { type: 'text', text: '• ' },
      { type: 'text', text: '• ' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Next steps:**' },
      { type: 'text', text: '1. ' },
      { type: 'text', text: '2. ' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Deadline:** ' },
      { type: 'text', text: '' }
    ]
  },
  
  todo: {
    title: 'To-Do List',
    category: 'todo',
    content: [
      { type: 'heading', text: '✅ Tasks' },
      { type: 'text', text: '**Today:**' },
      { type: 'text', text: '☐ ' },
      { type: 'text', text: '☐ ' },
      { type: 'text', text: '☐ ' },
      { type: 'text', text: '' },
      { type: 'text', text: '**This week:**' },
      { type: 'text', text: '☐ ' },
      { type: 'text', text: '☐ ' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Important:**' },
      { type: 'text', text: '⭐ ' },
      { type: 'text', text: '' }
    ]
  },
  
  creative: {
    title: 'Creative Notes',
    category: 'creative',
    content: [
      { type: 'heading', text: '🎨 Creative Work' },
      { type: 'text', text: 'Let your creativity flow...' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Inspiration:**' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Ideas:**' },
      { type: 'text', text: '' },
      { type: 'text', text: '**Story/Concept:**' },
      { type: 'text', text: '' }
    ]
  }
};

// 템플릿 가져오기 함수
export const getTemplate = (purposeId) => {
  return NOTE_TEMPLATES[purposeId] || NOTE_TEMPLATES.idea;
};

// 템플릿 목록 가져오기
export const getTemplateList = () => {
  return Object.keys(NOTE_TEMPLATES).map(key => ({
    id: key,
    ...NOTE_TEMPLATES[key]
  }));
};