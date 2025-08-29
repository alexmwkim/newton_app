# Newton 앱 툴바 시스템 분석 보고서

## 📋 현재 코드 상태 분석

### 🔍 현재 아키텍처 구조

```
App.js (GlobalToolbar)
├── SimpleToolbarContext (상태 관리)
├── useNoteDetailHandlers (비즈니스 로직)
└── NoteDetailScreen (UI 통합)
```

### 📊 주요 컴포넌트 분석

#### 1. SimpleToolbarContext.js
**현재 상태:**
- ✅ 키보드 상태 추적 (높이, 가시성)
- ✅ 핸들러 등록 시스템 (`activeScreenHandlers`)
- ✅ 포커스 인덱스 관리
- ❌ 타입 안전성 부족 (`activeScreenHandlers: any`)
- ❌ 확장성 제한 (하드코딩된 상태들)

#### 2. App.js (GlobalToolbar)
**현재 상태:**
- ✅ 키보드 위 플로팅 툴바 구현
- ✅ 기본 3개 버튼 (Card, Grid, Image)
- ❌ 하드코딩된 버튼 구조
- ❌ 스타일 중복 코드
- ❌ 확장 메뉴 없음

#### 3. useNoteDetailHandlers.js  
**현재 상태:**
- ✅ 블록 삽입 로직 (`insertBlockSet`)
- ✅ 이미지 추가 기능
- ❌ 매개변수 과다 (19개 파라미터)
- ❌ 단일 책임 원칙 위반

## 🚨 잠재적 문제점 및 오류 예측

### 1. 메모리 누수 위험
```javascript
// SimpleToolbarContext.js - L24-25
const showListener = Keyboard.addListener('keyboardWillShow', keyboardWillShow);
const hideListener = Keyboard.addListener('keyboardWillHide', keyboardWillHide);
```
**위험요소:** 컴포넌트 언마운트 시 리스너 정리 실패 가능성
**해결방안:** 더 강력한 정리 메커니즘 필요

### 2. 상태 동기화 문제
```javascript
// App.js - L63
activeScreenHandlers.handleAddCard(focusedIndex >= 0 ? focusedIndex : 0);
```
**위험요소:** `focusedIndex`와 실제 블록 인덱스 불일치 가능성
**해결방안:** 상태 검증 로직 추가 필요

### 3. 타입 안전성 부재
```javascript
// SimpleToolbarContext.js - L7
const [activeScreenHandlers, setActiveScreenHandlers] = useState(null);
```
**위험요소:** 런타임 에러, 예상치 못한 핸들러 호출 실패
**해결방안:** TypeScript 인터페이스 정의 필요

### 4. 성능 문제 (리렌더링)
```javascript
// App.js - L32
console.log('🔧 GlobalToolbar render - activeScreenHandlers:', !!activeScreenHandlers...);
```
**위험요소:** 매 렌더링마다 조건부 렌더링 체크, 불필요한 리렌더링
**해결방안:** 메모이제이션 및 상태 최적화 필요

## 🔄 새로운 시스템과의 충돌 예상

### 1. 상태 관리 충돌
**현재:** `SimpleToolbarContext` 단일 컨텍스트
**신규:** `ToolbarSystem` + `StateManager` + 다중 상태
**충돌:** 상태 소스 중복, 동기화 문제

### 2. 핸들러 등록 방식 변경
**현재:** `setActiveScreenHandlers(객체)`
**신규:** `registerBlocks(배열)` + 팩토리 패턴
**충돌:** 기존 페이지들의 핸들러 등록 방식 전면 변경 필요

### 3. 컴포넌트 구조 변경
**현재:** `GlobalToolbar` (App.js 내부)
**신규:** `ExpandableToolbar` + `CategorySection` + 계층구조
**충돌:** 전체 UI 렌더링 로직 재작성 필요

## 📋 마이그레이션 전략

### Phase 1: 호환성 레이어 구축 (1주)
```javascript
// 기존 API 유지하면서 새 시스템 적용
const CompatibilityLayer = {
  // 기존: setActiveScreenHandlers({ handleAddCard: ... })
  // 신규: registerBlocks([...])로 변환
  bridgeOldToNew: (oldHandlers) => {
    return Object.entries(oldHandlers).map(([key, handler]) => ({
      action: key,
      execute: handler
    }));
  }
};
```

### Phase 2: 점진적 마이그레이션 (2주)
1. **Week 1:** Core System 구축 + 기존 3개 버튼 호환
2. **Week 2:** 확장 메뉴 추가 + 새 블록들 구현

### Phase 3: 최적화 및 정리 (1주)
- 레거시 코드 제거
- 성능 최적화
- 테스트 코드 보완

## 🛡️ 위험 완화 방안

### 1. 점진적 마이그레이션
```javascript
// 플래그 기반 점진적 전환
const useNewToolbarSystem = __DEV__ ? true : false;

export const ToolbarWrapper = () => {
  return useNewToolbarSystem ? <ExpandableToolbar /> : <GlobalToolbar />;
};
```

### 2. 백워드 호환성 보장
```javascript
// 기존 API 유지 어댑터
export const LegacyToolbarAdapter = {
  handleAddCard: (index) => ToolbarSystem.executeAction('addCard', { index }),
  handleAddGrid: (index) => ToolbarSystem.executeAction('addGrid', { index }),
  handleAddImage: (index) => ToolbarSystem.executeAction('addImage', { index })
};
```

### 3. 에러 경계 추가
```javascript
// 툴바 에러 경계
export const ToolbarErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary 
      fallback={<LegacyToolbar />}
      onError={(error) => reportToolbarError(error)}
    >
      {children}
    </ErrorBoundary>
  );
};
```

## 📝 구현 가이드라인

### 1. 필수 인터페이스 정의
```typescript
interface ToolbarAction {
  id: string;
  execute: (context: ActionContext) => Promise<void> | void;
  validate?: (context: ActionContext) => boolean;
}

interface ActionContext {
  focusedIndex: number;
  blocks: Block[];
  setBlocks: (blocks: Block[]) => void;
  noteId: string;
}
```

### 2. 상태 검증 로직
```javascript
const validateToolbarState = (state) => {
  if (state.focusedIndex >= state.blocks.length) {
    console.warn('Invalid focusedIndex, resetting to 0');
    return { ...state, focusedIndex: 0 };
  }
  return state;
};
```

### 3. 성능 최적화
```javascript
const MemoizedToolbarButton = React.memo(ToolbarButton, (prev, next) => {
  return prev.icon === next.icon && prev.disabled === next.disabled;
});
```

## 🎯 성공 지표

### 기능 목표
- ✅ 기존 3개 버튼 100% 호환성 유지
- ✅ 확장 메뉴로 5+ 새 블록 추가
- ✅ 툴바 확장/축소 매끄러운 애니메이션
- ✅ 타입 안전성 100% 달성

### 성능 목표  
- ✅ 툴바 렌더링 시간 < 16ms
- ✅ 메모리 누수 0건
- ✅ 크래시 발생률 < 0.1%

### 유지보수성 목표
- ✅ 새 블록 추가 시 수정 파일 < 2개
- ✅ 단위 테스트 커버리지 > 80%
- ✅ 코드 복잡도 감소 > 30%

## 📅 타임라인

### Week 1-2: Foundation
- Core System 구축
- 호환성 레이어 개발
- 기존 기능 마이그레이션

### Week 3: Enhancement  
- 확장 메뉴 UI 구현
- 새 블록들 추가
- 애니메이션 구현

### Week 4: Polish
- 성능 최적화
- 버그 수정
- 테스트 보완

## 🔄 2024.08.27 업데이트 - 최종 툴바 설계 확정

### 💡 핵심 결정사항

#### 1. **그리드 블록 제거**
- **이유**: 카드와 중복 기능, 레이아웃 복잡성 증가
- **결과**: 카드 블록으로 통합 (크기 조절 불필요)
- **장점**: 코드 단순화, 사용자 혼란 감소

#### 2. **카드 크기 조절 기능 제외**
- **이유**: 모바일에서 복잡한 레이아웃보다 순차적 흐름이 더 실용적
- **결과**: 카드는 100% 전체 너비로 고정
- **장점**: 터치 편의성 증대, 구현 복잡도 감소

#### 3. **텍스트 스타일링 방식 결정**
- **툴바**: 블록 생성 전용 (새 블록 추가)
- **텍스트 선택 팝업**: 스타일링 전용 (기존 텍스트 포맷팅)
- **자연스러운 편집 플로우**: 텍스트 입력 → 선택 → 스타일 적용

### 🎯 최종 툴바 구조

#### **메인 툴바 (8개 버튼)**
```
[+] [H1] [List] [☐] [Card] [Image] [📅] [More...]
```

**각 버튼 기능:**
- **[+]** - 새 블록 추가 (범용)
- **[H1]** - 제목 블록 생성 
- **[List]** - 리스트 블록 생성
- **[☐]** - 체크리스트 블록 생성
- **[Card]** - 카드 블록 생성
- **[Image]** - 이미지 블록 생성
- **[📅]** - 날짜/시간 삽입
- **[More...]** - 확장 메뉴

#### **텍스트 선택 팝업**
```
텍스트 선택 → [B] [I] [U] [색상] [H1] [H2] [H3] 팝업
```

#### **확장 메뉴 구조**
```
📝 텍스트 스타일
  - 제목 2, 3
  - > 인용구
  - ➖ 구분선
  - 형광펜

📋 구조화
  - • 순서없는 리스트  
  - 1. 순서있는 리스트
  - ☐ 체크리스트

🎨 콘텐츠 블록
  - 💬 대화체 블록
  - 💻 코드 블록
  - 📁 폴더/섹션

⚡ 빠른 입력
  - 현재 시간
  - 오늘 날짜
  - 날짜+시간
```

### 🚀 구현 로드맵

#### **Phase 1: 텍스트 시스템 (우선순위 최고)**
1. **텍스트 선택 팝업** - 볼드, 이탤릭, 제목 변환
2. **리스트 블록** - • 순서없음, 1. 순서있음
3. **체크리스트 블록** - ☐ 할 일 관리

#### **Phase 2: 블록 시스템**
4. **제목 블록** - H1, H2, H3 독립 블록
5. **날짜/시간 삽입** - 📅 타임스탬프
6. **카드/이미지 개선** - 기존 기능 다듬기

#### **Phase 3: 확장 기능**
7. **More 메뉴 UI** - 확장 메뉴 인터페이스
8. **대화체/코드 블록** - 특수 블록들
9. **폴더/섹션** - 콘텐츠 구조화 (신중히 접근)

### ✅ 기존 기능 분석 결과

#### **이미 구현된 기능** 
- **텍스트 포맷팅 로직**: `useNoteEditor.js`의 `toggleFormat` 함수
  - `bold`, `italic`, `heading`, `bullet` 지원
  - 마크다운 스타일 적용 (**텍스트**, *텍스트*, # 제목)
- **블록 시스템**: 완전 구현됨
- **드래그 앤 드롭**: 카드 이동 기능 완성

#### **구현 필요한 기능**
- **텍스트 선택 UI**: `onSelectionChange`, 선택 팝업 컴포넌트
- **선택 영역 포맷팅**: 부분 텍스트만 적용 (현재는 전체 블록)
- **새 블록 타입들**: 체크리스트, 대화체, 코드 블록
- **툴바 UI 확장**: More 메뉴, 확장 가능한 구조

### 🎯 설계 원칙

#### **1. 단순성 우선**
- 복잡한 레이아웃보다 직관적인 순차 구조
- 필수 기능에 집중, 고급 기능은 점진적 추가

#### **2. 모바일 최적화**
- 터치 친화적 UI/UX
- 자연스러운 편집 플로우
- 키보드 위 플로팅 툴바 유지

#### **3. 확장 가능성**
- More 메뉴를 통한 기능 확장
- 블록 시스템 기반 아키텍처
- 새 블록 타입 추가 용이

#### **4. 역할 분리**
- **툴바**: 새 블록 생성
- **팝업**: 기존 텍스트 편집
- **드래그**: 블록 이동/정렬

### 📊 예상 효과

#### **사용자 경험 개선**
- ✅ 직관적인 편집 플로우
- ✅ 빠른 컨텐츠 생성
- ✅ 일기 작성 특화 기능

#### **개발 효율성**
- ✅ 코드 복잡도 감소 (그리드 제거)
- ✅ 유지보수 용이성 증대
- ✅ 확장 기능 추가 간소화

#### **성능 최적화**
- ✅ 렌더링 부하 감소
- ✅ 메모리 사용량 최적화
- ✅ 애니메이션 성능 향상

### 🔍 다음 단계

1. **즉시 착수**: Phase 1 - 텍스트 선택 팝업 구현
2. **병행 작업**: 리스트/체크리스트 블록 타입 추가
3. **점진적 확장**: More 메뉴 및 고급 기능

---

## 🛠️ 구현 가이드

### Phase 1: 텍스트 선택 팝업 시스템

#### **1단계: 텍스트 선택 감지**

```javascript
// NoteBlockRenderer.js - 텍스트 블록 수정
const [selection, setSelection] = useState({ start: 0, end: 0 });
const [showFormatPopup, setShowFormatPopup] = useState(false);

const handleSelectionChange = (event) => {
  const { start, end } = event.nativeEvent.selection;
  setSelection({ start, end });
  
  // 텍스트가 선택되었을 때만 팝업 표시
  if (start !== end) {
    setShowFormatPopup(true);
  } else {
    setShowFormatPopup(false);
  }
};

<TextInput
  onSelectionChange={handleSelectionChange}
  // 기존 props...
/>
```

#### **2단계: 포맷팅 팝업 컴포넌트**

```javascript
// components/TextFormatPopup.js (신규 생성)
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import Colors from '../constants/Colors';

const TextFormatPopup = ({ 
  visible, 
  onBold, 
  onItalic, 
  onHeading, 
  onClose,
  position = { x: 0, y: 0 }
}) => {
  if (!visible) return null;

  return (
    <View style={[styles.popupContainer, { 
      left: position.x, 
      top: position.y - 60 // 선택 영역 위에 표시
    }]}>
      <TouchableOpacity style={styles.formatButton} onPress={onBold}>
        <Text style={styles.boldText}>B</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={onItalic}>
        <Text style={styles.italicText}>I</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={() => onHeading(1)}>
        <Text style={styles.headingText}>H1</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={() => onHeading(2)}>
        <Text style={styles.headingText}>H2</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.formatButton} onPress={() => onHeading(3)}>
        <Text style={styles.headingText}>H3</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Icon name="x" size={14} color={Colors.secondaryText} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    position: 'absolute',
    flexDirection: 'row',
    backgroundColor: Colors.mainBackground,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    zIndex: 1000,
  },
  formatButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 2,
    borderRadius: 6,
    backgroundColor: Colors.cardBackground,
  },
  boldText: {
    fontWeight: 'bold',
    fontSize: 14,
    color: Colors.primaryText,
  },
  italicText: {
    fontStyle: 'italic',
    fontSize: 14,
    color: Colors.primaryText,
  },
  headingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  closeButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginLeft: 4,
  },
});

export default TextFormatPopup;
```

#### **3단계: 선택 영역 포맷팅 로직**

```javascript
// hooks/useTextFormatting.js (신규 생성)
import { useCallback } from 'react';

export const useTextFormatting = () => {
  const applyFormatToSelection = useCallback((text, selection, format) => {
    const { start, end } = selection;
    const selectedText = text.substring(start, end);
    
    let formattedText;
    switch (format) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'heading1':
        formattedText = `# ${selectedText}`;
        break;
      case 'heading2':
        formattedText = `## ${selectedText}`;
        break;
      case 'heading3':
        formattedText = `### ${selectedText}`;
        break;
      default:
        formattedText = selectedText;
    }
    
    // 텍스트 교체
    const newText = text.substring(0, start) + formattedText + text.substring(end);
    const newCursorPos = start + formattedText.length;
    
    return { newText, newCursorPos };
  }, []);

  const removeFormatFromSelection = useCallback((text, selection, format) => {
    const { start, end } = selection;
    const selectedText = text.substring(start, end);
    
    let cleanedText;
    switch (format) {
      case 'bold':
        cleanedText = selectedText.replace(/\*\*(.*?)\*\*/g, '$1');
        break;
      case 'italic':
        cleanedText = selectedText.replace(/\*(.*?)\*/g, '$1');
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

  return { applyFormatToSelection, removeFormatFromSelection };
};
```

#### **4단계: 기존 시스템과 통합**

```javascript
// NoteBlockRenderer.js - 텍스트 블록 완성
import TextFormatPopup from './TextFormatPopup';
import { useTextFormatting } from '../hooks/useTextFormatting';

const NoteTextBlock = ({ block, handleTextChange, ...props }) => {
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const [showFormatPopup, setShowFormatPopup] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ x: 0, y: 0 });
  const { applyFormatToSelection } = useTextFormatting();
  const textInputRef = useRef(null);

  const handleSelectionChange = (event) => {
    const { start, end } = event.nativeEvent.selection;
    setSelection({ start, end });
    
    if (start !== end) {
      // 선택 영역 중앙 위치 계산
      textInputRef.current?.measureInWindow((x, y, width, height) => {
        setPopupPosition({ 
          x: x + width / 2 - 100, // 팝업 너비의 절반만큼 보정
          y: y 
        });
        setShowFormatPopup(true);
      });
    } else {
      setShowFormatPopup(false);
    }
  };

  const handleFormat = (format) => {
    const result = applyFormatToSelection(block.content, selection, format);
    handleTextChange(block.id, result.newText);
    
    // 커서 위치 업데이트
    setTimeout(() => {
      textInputRef.current?.setSelection(result.newCursorPos, result.newCursorPos);
    }, 10);
    
    setShowFormatPopup(false);
  };

  return (
    <View>
      <TextInput
        ref={textInputRef}
        onSelectionChange={handleSelectionChange}
        // 기존 props...
      />
      
      <TextFormatPopup
        visible={showFormatPopup}
        position={popupPosition}
        onBold={() => handleFormat('bold')}
        onItalic={() => handleFormat('italic')}
        onHeading={(level) => handleFormat(`heading${level}`)}
        onClose={() => setShowFormatPopup(false)}
      />
    </View>
  );
};
```

### Phase 2: 새 블록 타입 추가

#### **체크리스트 블록 구현**

```javascript
// components/ChecklistBlock.js (신규)
const ChecklistBlock = ({ block, handleTextChange, onCheck }) => {
  const [isChecked, setIsChecked] = useState(block.checked || false);

  const handleToggleCheck = () => {
    const newState = !isChecked;
    setIsChecked(newState);
    onCheck(block.id, newState);
  };

  return (
    <View style={styles.checklistContainer}>
      <TouchableOpacity 
        style={styles.checkbox} 
        onPress={handleToggleCheck}
      >
        <Icon 
          name={isChecked ? "check-square" : "square"} 
          size={18} 
          color={isChecked ? Colors.accent : Colors.secondaryText} 
        />
      </TouchableOpacity>
      
      <TextInput
        style={[styles.checklistText, isChecked && styles.checkedText]}
        placeholder="할 일 입력..."
        value={block.content}
        onChangeText={(text) => handleTextChange(block.id, text)}
        multiline
      />
    </View>
  );
};
```

#### **리스트 블록 구현**

```javascript
// components/ListBlock.js (신규)
const ListBlock = ({ block, handleTextChange, listType = 'bullet' }) => {
  const getListPrefix = () => {
    return listType === 'bullet' ? '• ' : '1. ';
  };

  return (
    <View style={styles.listContainer}>
      <Text style={styles.listPrefix}>{getListPrefix()}</Text>
      <TextInput
        style={styles.listText}
        placeholder="리스트 항목 입력..."
        value={block.content}
        onChangeText={(text) => handleTextChange(block.id, text)}
        multiline
      />
    </View>
  );
};
```

### Phase 3: 툴바 확장 시스템

#### **확장 가능한 툴바 구조**

```javascript
// components/ExpandableToolbar.js (신규)
const ExpandableToolbar = ({ onBlockAdd }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const mainButtons = [
    { id: 'heading', icon: 'type', label: 'H1' },
    { id: 'list', icon: 'list', label: 'List' },
    { id: 'checklist', icon: 'check-square', label: '☐' },
    { id: 'card', icon: 'credit-card', label: 'Card' },
    { id: 'image', icon: 'image', label: 'Image' },
    { id: 'date', icon: 'calendar', label: '📅' },
  ];

  const expandedButtons = [
    { category: 'text', items: [
      { id: 'heading2', label: 'H2' },
      { id: 'heading3', label: 'H3' },
      { id: 'quote', label: '인용구' },
    ]},
    { category: 'content', items: [
      { id: 'code', label: '코드' },
      { id: 'dialog', label: '대화' },
      { id: 'divider', label: '구분선' },
    ]}
  ];

  return (
    <View style={styles.toolbarContainer}>
      {/* 메인 툴바 */}
      <View style={styles.mainToolbar}>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Icon name="plus" size={20} color={Colors.white} />
        </TouchableOpacity>
        
        {mainButtons.map(button => (
          <ToolbarButton
            key={button.id}
            icon={button.icon}
            label={button.label}
            onPress={() => onBlockAdd(button.id)}
          />
        ))}
        
        <TouchableOpacity 
          style={styles.moreButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Icon name="more-horizontal" size={20} color={Colors.primaryText} />
        </TouchableOpacity>
      </View>
      
      {/* 확장 메뉴 */}
      {isExpanded && (
        <View style={styles.expandedMenu}>
          {expandedButtons.map(category => (
            <ToolbarCategory
              key={category.category}
              title={category.category}
              items={category.items}
              onItemPress={onBlockAdd}
            />
          ))}
        </View>
      )}
    </View>
  );
};
```

### 🔧 통합 및 테스트 가이드

#### **1. 기존 시스템과의 통합**
- `useNoteEditor.js`의 `toggleFormat` 함수 활용
- `NoteBlockRenderer.js`에서 새 블록 타입 렌더링 추가
- `SimpleToolbarContext`와 새 툴바 시스템 연결

#### **2. 테스트 우선순위**
```javascript
// 테스트 케이스
1. 텍스트 선택 → 볼드 적용 → 마크다운 결과 확인
2. 체크리스트 생성 → 체크/언체크 → 상태 저장 확인
3. 리스트 블록 → 여러 항목 → 자동 번호매기기 확인
4. 툴바 확장 → More 메뉴 → 카테고리별 정렬 확인
5. 드래그 앤 드롭 → 새 블록들도 이동 가능한지 확인
```

#### **3. 성능 최적화 체크포인트**
- 팝업 렌더링 최적화 (불필요한 리렌더링 방지)
- 메모이제이션 적용 (툴바 버튼, 블록 컴포넌트)
- 키보드 이벤트 최적화 (디바운싱)
- 드래그 성능 (60fps 유지)

---

*최초 분석: 2024년 8월 27일*  
*최종 업데이트: 2024년 8월 27일*  
*작성자: Claude Code Assistant*

**포함 문서**: 텍스트 선택 팝업 구현 가이드 ✅ 완료