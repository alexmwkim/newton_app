# 🎯 목적별 노트 생성 메뉴 구현 계획서

## 📋 프로젝트 개요

**목표**: 툴바의 [+] 버튼을 클릭하면 목적별 노트 유형을 선택할 수 있는 드롭다운 메뉴를 구현

**UI 목표**:
```
기본 툴바: [+] [B] [I] [📷] [🔗]

+ 클릭하면:
┌─────────────────────┐
│ 📔 Daily Journal    │
│ 💡 Ideas & Memo     │  
│ 🎯 Project Notes    │
│ ✅ To-Do List       │
│ 🎨 Creative Notes   │
└─────────────────────┘
```

## 🔍 현재 시스템 분석

### ✅ 준비된 요소들
- **툴바 시스템**: `UnifiedToolbar.js` - 통합된 툴바 아키텍처 완성
- **컨텍스트 관리**: `SimpleToolbarContext.js` - 핸들러 등록 시스템 구축
- **노트 생성 서비스**: `NotesService.createNote()` - 데이터베이스 저장 로직
- **노트 상태 관리**: `useNotesStore.js` - Zustand 기반 상태 관리
- **노트 생성 화면**: `CreateNoteScreen.js` - UI 및 에디터 완성
- **키보드 동기화**: 툴바-키보드 애니메이션 시스템 완성

### ⚠️ 추가 필요 요소들
1. **드롭다운 메뉴 컴포넌트** - 현재 존재하지 않음
2. **노트 카테고리 시스템** - 데이터베이스 스키마 확장 필요
3. **목적별 템플릿** - 각 카테고리별 초기 구조 정의 필요
4. **네비게이션 연결** - 드롭다운 → CreateNoteScreen 파라미터 전달

## 🎯 5가지 목적별 노트 유형

| 이모지 | 이름 (영어) | 설명 | 카테고리 코드 |
|--------|-------------|------|--------------|
| 📔 | Daily Journal | Personal daily records, emotions, experiences | `diary` |
| 💡 | Ideas & Memo | Thoughts, inspirations, quick notes | `idea` |
| 🎯 | Project Notes | Work projects, planning, progress tracking | `project` |
| ✅ | To-Do List | Checklists, task management, planning | `todo` |
| 🎨 | Creative Notes | Writing, poems, stories, creative work | `creative` |

## 🏗️ 구현 계획

### Phase 1: 드롭다운 메뉴 컴포넌트 구현
**파일**: `src/components/toolbar/PurposeDropdown.js`

**기능 요구사항**:
- 툴바 [+] 버튼 위치 기준으로 드롭다운 표시
- 키보드가 올라온 상태에서도 정확한 위치 계산
- 부드러운 애니메이션 (fade in/out, slide)
- 외부 터치 시 자동 닫힘
- 5가지 옵션 아이콘 + 텍스트 표시

**기술적 고려사항**:
- `Animated.View`를 사용한 애니메이션
- `Modal` 또는 `Overlay` 방식으로 전체 화면 덮기
- 터치 이벤트 처리를 위한 `TouchableWithoutFeedback`
- 툴바 위치 계산을 위한 `measure()` API 활용

### Phase 2: 데이터베이스 스키마 확장
**테이블**: `notes`

**추가할 컬럼**:
```sql
ALTER TABLE notes 
ADD COLUMN category VARCHAR(20) DEFAULT 'general';

-- 인덱스 추가 (검색 성능)
CREATE INDEX idx_notes_category ON notes(category);

-- 카테고리 제약조건
ALTER TABLE notes 
ADD CONSTRAINT chk_notes_category 
CHECK (category IN ('diary', 'idea', 'project', 'todo', 'creative', 'general'));
```

### Phase 3: 목적별 템플릿 시스템
**파일**: `src/constants/NoteTemplates.js`

각 카테고리별 초기 구조:
```javascript
export const NOTE_TEMPLATES = {
  diary: {
    title: 'Daily Journal',
    content: [
      { type: 'heading', text: '📔 ' + new Date().toLocaleDateString() },
      { type: 'text', text: 'How was your day today?' },
      { type: 'text', text: '' }
    ]
  },
  idea: {
    title: 'New Ideas',
    content: [
      { type: 'heading', text: '💡 Ideas' },
      { type: 'text', text: 'What ideas came to mind?' }
    ]
  },
  project: {
    title: 'Project Notes',
    content: [
      { type: 'heading', text: '🎯 Project Planning' },
      { type: 'text', text: 'Project overview:' },
      { type: 'text', text: 'Goals:' },
      { type: 'text', text: 'Next steps:' }
    ]
  },
  todo: {
    title: 'To-Do List',
    content: [
      { type: 'heading', text: '✅ Tasks' },
      { type: 'text', text: '□ ' },
      { type: 'text', text: '□ ' },
      { type: 'text', text: '□ ' }
    ]
  },
  creative: {
    title: 'Creative Notes',
    content: [
      { type: 'heading', text: '🎨 Creative Work' },
      { type: 'text', text: 'Let your creativity flow...' }
    ]
  }
};
```

### Phase 4: 툴바 통합
**수정 파일**: `src/components/toolbar/UnifiedToolbar.js`

**변경 사항**:
- [+] 버튼에 `onPress` 이벤트 연결
- `PurposeDropdown` 상태 관리
- 드롭다운 표시/숨김 토글 기능

## 🔄 데이터 플로우

```
1. 사용자가 [+] 버튼 클릭
   ↓
2. PurposeDropdown 컴포넌트 표시
   ↓ 
3. 사용자가 목적별 옵션 선택 (예: 📔 일기 쓰기)
   ↓
4. 선택된 카테고리와 템플릿 정보를 CreateNoteScreen에 전달
   ↓
5. CreateNoteScreen에서 템플릿 기반으로 초기 노트 구조 설정
   ↓
6. 사용자가 노트 작성 완료 후 저장
   ↓
7. NotesService.createNote()에서 category 포함하여 DB 저장
```

## 📁 파일 구조 변경

### 새로 생성할 파일들
```
src/
├── components/toolbar/
│   └── PurposeDropdown.js          # 목적별 메뉴 드롭다운
├── constants/
│   └── NoteTemplates.js           # 카테고리별 템플릿 정의
└── utils/
    └── categoryUtils.js           # 카테고리 관련 유틸리티
```

### 수정할 파일들
```
src/
├── components/toolbar/
│   └── UnifiedToolbar.js          # [+] 버튼 이벤트 연결
├── screens/
│   └── CreateNoteScreen.js        # 카테고리 파라미터 처리
├── services/
│   └── notes.js                   # category 필드 추가
└── store/
    └── useNotesStore.js           # 카테고리별 필터링 기능
```

## 🎨 디자인 가이드라인

### 드롭다운 메뉴 스타일
- **배경색**: `#FFFFFF` (완전 불투명)
- **테두리**: `#F8F6F3` 1px, 모서리 10px 둥글게
- **그림자**: iOS/Android 네이티브 스타일
- **높이**: 각 옵션 44px (터치하기 편한 크기)
- **너비**: 160px (아이콘 + 텍스트에 적합)

### 옵션 아이템 스타일
- **아이콘 크기**: 20px
- **텍스트**: Avenir Next, 14pt, `#000000`
- **패딩**: 12px 좌우, 10px 상하
- **호버 효과**: 배경색 `#F8F6F3`로 변경

### 애니메이션 스펙
- **등장**: 250ms easeOutQuart, opacity 0→1, scale 0.95→1.0
- **퇴장**: 200ms easeInQuart, opacity 1→0, scale 1.0→0.95

## 🧪 테스트 계획

### 단위 테스트
- [ ] PurposeDropdown 컴포넌트 렌더링
- [ ] 각 카테고리별 템플릿 로딩
- [ ] 드롭다운 위치 계산 정확성
- [ ] 애니메이션 동작

### 통합 테스트  
- [ ] [+] 버튼 → 드롭다운 → 노트 생성 전체 플로우
- [ ] 키보드 올라온 상태에서 드롭다운 위치
- [ ] 카테고리별 노트 DB 저장 확인
- [ ] 외부 터치 시 드롭다운 닫힘

### 사용자 테스트
- [ ] 각 목적별 템플릿이 직관적인가?
- [ ] 드롭다운 위치가 자연스러운가?  
- [ ] 애니메이션이 부드러운가?
- [ ] 터치 영역이 충분한가?

## 🚀 구현 순서 및 일정

### 1단계: 드롭다운 컴포넌트 (1일)
- PurposeDropdown.js 생성
- 기본 UI 구현
- 애니메이션 적용

### 2단계: 데이터베이스 확장 (0.5일)  
- notes 테이블에 category 컬럼 추가
- 마이그레이션 스크립트 작성

### 3단계: 템플릿 시스템 (1일)
- NoteTemplates.js 생성
- 5가지 카테고리별 템플릿 정의
- CreateNoteScreen 템플릿 적용

### 4단계: 툴바 통합 (0.5일)
- UnifiedToolbar.js에 드롭다운 연결
- [+] 버튼 이벤트 처리

### 5단계: 테스트 및 디버깅 (1일)
- 전체 플로우 테스트
- 버그 수정 및 최적화

**총 예상 소요시간**: 4일

## 🔧 기술적 고려사항

### 성능 최적화
- 드롭다운 컴포넌트를 `React.memo`로 메모이제이션
- 템플릿 로딩을 지연 로딩으로 처리
- 애니메이션에 `useNativeDriver: true` 적용

### 접근성
- 각 옵션에 적절한 `accessibilityLabel` 추가
- VoiceOver/TalkBack 지원
- 키보드 네비게이션 지원

### 에러 처리
- 드롭다운 위치 계산 실패 시 폴백
- 템플릿 로딩 실패 시 기본 템플릿 사용
- 네트워크 오류 시 사용자 알림

## 🔍 경쟁 분석: 에버노트 UX 리서치 결과

### 에버노트 2024-2025 모바일 UI 개선사항

#### 📱 핵심 UX 문제점 해결
**기존 문제**: 
- 사용자 불만: "새 노트 만들기에 클릭이 두 번 필요해서 번거롭다"
- 드롭다운에서 'Note' 또는 'Task'를 한 번 더 선택해야 하는 구조

**2024년 해결책**:
- **각 액션별 개별 버튼** 제공으로 원클릭 접근 구현
- "New" 버튼을 분리하여 직접적인 액션 가능

#### 🎯 모바일 최적화 전략
1. **부동 버튼(Floating Buttons)**: 
   - 엄지손가락 접근 가능한 위치에 배치
   - 노트, 노트북, 작업, 이벤트, 태그 빠른 추가 버튼

2. **홈스크린 재설계**: 
   - "속도와 사용성이 크게 개선" (사용자 피드백)
   - "모바일 버전을 오랫동안 싫어했는데... 최신 업데이트로 완전히 바뀜"

3. **템플릿 시스템**: 
   - Meeting Note, To-Do, Weekly Planner 등 실용적 템플릿
   - 사용자 요청: 개인화된 템플릿 선택 가능

#### 📊 사용자 피드백 분석
**긍정적 반응**:
- "작업 생성이 훨씬 부드러워짐, 특히 새로운 작업. 모바일에서 새 작업을 만드는 것을 싫어했는데 너무 어색했기 때문"
- "템플릿 경험을 완전히 재설계해서 어떤 노트에서든 사용자 정의 템플릿을 만들 수 있음"

**개선 요청**:
- 드롭다운 템플릿 목록 커스터마이징 기능
- 더 복잡한 템플릿 구조 지원

### Newton 앱 적용 인사이트

#### 🎯 UX 원칙
1. **최소 클릭 원칙**: 에버노트 피드백 반영, 목적별 노트 생성까지 최대 2클릭 이내
2. **엄지 친화적 디자인**: 툴바 드롭다운을 한 손 조작에 최적화된 위치에 배치
3. **명확한 목적 구분**: 일반적인 "New Note" 대신 구체적 목적별 카테고리 제공
4. **즉시 피드백**: 선택 즉시 해당 템플릿으로 노트 생성 시작

#### 🚀 차별화 포인트
1. **5가지 명확한 목적**: 에버노트보다 더 구체적인 생활 목적별 분류
2. **시각적 아이콘**: 각 목적별 직관적 이모지로 빠른 인식
3. **글로벌 최적화**: 영어 기반으로 전 세계 사용자 대상
4. **템플릿 자동화**: 선택 즉시 해당 목적에 맞는 구조 자동 생성

## 📚 참고 자료

### 기존 구현된 시스템
- `TOOLBAR_OPTIMIZATION_GUIDE.md` - 툴바 시스템 아키텍처
- `src/contexts/SimpleToolbarContext.js` - 툴바 상태 관리
- `src/components/toolbar/UnifiedToolbar.js` - 현재 툴바 구현

### 디자인 시스템
- `PRDs/newton_app_styleGuide.rtf` - 색상, 타이포그래피
- `ui_screenshots/` - UI 참고 자료

### 경쟁사 분석
- **에버노트 2024-2025 업데이트**: 모바일 UX 개선 사례
- **사용자 피드백**: 드롭다운 메뉴 사용성 개선 요구사항
- **모바일 최적화**: 부동 버튼, 원클릭 접근, 템플릿 시스템

## 🌐 다국어화 계획

### 현재 구현 방향
- **1단계**: 모든 기능을 영어로 구현
- **2단계**: 구현 완료 후 언어별 설정 기능 추가 계획

### 향후 다국어화 준비사항
```javascript
// 추후 구현 예정 구조
const LANGUAGE_TEMPLATES = {
  en: {
    diary: 'Daily Journal',
    idea: 'Ideas & Memo', 
    project: 'Project Notes',
    todo: 'To-Do List',
    creative: 'Creative Notes'
  },
  ko: {
    diary: '일기 쓰기',
    idea: '아이디어 메모',
    project: '프로젝트 관리', 
    todo: '할 일 정리',
    creative: '창작 노트'
  }
  // 기타 언어들...
};
```

### 다국어화 고려사항
- 템플릿 텍스트의 언어별 대응
- UI 레이아웃의 언어별 최적화 (텍스트 길이 차이)
- 날짜/시간 형식의 지역별 대응
- 설정 메뉴에서 언어 선택 기능

---

**작성일**: 2025-09-02  
**작성자**: Claude Code  
**버전**: 1.2  
**상태**: 리서치 완료, 영어 기반 구현 준비 완료