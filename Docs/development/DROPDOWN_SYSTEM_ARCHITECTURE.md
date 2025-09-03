# 🎯 드롭다운 시스템 아키텍처 설계서

## 🔍 **노션 드롭다운 구조 심층 분석**

### 📱 **노션의 실제 UI 계층구조**:
```
NotionApp
├── Header (고정)
├── ContentArea 
│   ├── Page Content (스크롤 가능)
│   └── InputAccessory (키보드 위)
│       ├── Toolbar (기본 상태)
│       │   ├── [🎨] [+] [Aa] [🎤] [📷] [🔄] [💬] [🌙] [✕]
│       │   └── Keyboard (하단)
│       └── BlocksDropdown (드롭다운 활성화 시)
│           ├── "Basic blocks" (제목)
│           ├── GridLayout (2열)
│           │   ├── [T Text] [H₁ Heading 1]
│           │   ├── [H₂ Heading 2] [H₃ Heading 3]
│           │   ├── [•— Bulleted list] [1— Numbered list]
│           │   └── [✓— To-do list] [▷— Toggle list]
│           └── ScrollView (더 많은 옵션)
```

### 🎯 **노션의 핵심 아키텍처 원칙**:

#### **1. Block-Based Architecture**
```javascript
// 노션의 모든 콘텐츠는 블록 기반
const BlockStructure = {
  id: 'unique-block-id',
  type: 'text' | 'heading' | 'bulleted_list' | 'to_do',
  properties: {},
  content: [],
  parent: 'parent-block-id'
};
```

#### **2. Render Tree (계층적 렌더링)**
```
Page
├── Block 1 (heading)
├── Block 2 (text)
├── Block 3 (bulleted_list)
│   ├── List Item 1
│   └── List Item 2
└── Block 4 (to_do)
    ├── Todo Item 1
    └── Todo Item 2
```

#### **3. Progressive Disclosure (점진적 노출)**
- 기본 상태: 필수 도구만 표시
- 드롭다운: 상세 옵션 표시
- 컨텍스트: 현재 작업에 맞는 옵션만 노출

#### **4. State Management Pattern**
```javascript
// 노션의 상태 관리 추정 구조
const NotionState = {
  // UI 상태
  activeView: 'editor' | 'dropdown' | 'keyboard',
  activeDropdown: 'blocks' | 'formatting' | null,
  
  // 콘텐츠 상태  
  currentPage: PageObject,
  selectedBlocks: BlockId[],
  focusedBlock: BlockId,
  
  // 입력 상태
  inputMode: 'keyboard' | 'voice' | 'camera',
  keyboardVisible: boolean
};
```

### 🏗️ **노션 vs Newton 구조 비교**

#### **노션의 장점 (차용할 부분)**:
```
✅ Block-Based 구조 → Newton의 NoteBlock 시스템과 일치
✅ Progressive Disclosure → 단계적 옵션 노출
✅ Context-Aware UI → 상황별 적합한 도구 표시
✅ Smooth Transitions → 키보드 ↔ 드롭다운 자연스러운 전환
```

#### **Newton의 차별화 포인트**:
```
🎯 Purpose-Driven → 목적별 노트 생성 (노션에 없음)
🎯 Template-Based → 선택 즉시 템플릿 적용
🎯 Simplified UI → 더 단순한 버튼 구조
🎯 Mobile-Optimized → 터치 최적화된 크기
```

## 📋 **Newton 시스템 분석 (현재)**

### 🔍 **현재 시스템 구조**:
```
SimpleToolbarContext
├── activeScreenHandlers (화면별 핸들러)
├── focusedIndex (포커스된 인덱스)
├── keyboardVisible (키보드 상태)
├── keyboardHeight (애니메이션 값)
├── toolbarTranslateY (툴바 위치)
└── keyboardHeightValue (실제 높이)
```

### 🎯 **확장 필요사항**:
```
SimpleToolbarContext (확장)
├── [기존] 키보드 & 툴바 시스템
├── [새로운] 드롭다운 상태 관리
├── [새로운] 드롭다운 <-> 키보드 전환
└── [새로운] 목적별 노트 핸들러
```

## 🏗️ **구조적 설계 원칙**

### ✅ **1. 관심사 분리 (Separation of Concerns)**
```
📁 src/
├── contexts/
│   ├── SimpleToolbarContext.js      # 🔧 상태 관리 중앙화
│   └── DropdownStateContext.js      # 📋 드롭다운 전용 상태 (분리)
├── components/toolbar/
│   ├── UnifiedToolbar.js            # 🎨 툴바 UI 컴포넌트
│   ├── dropdowns/                   # 📂 드롭다운 컴포넌트 그룹
│   │   ├── BaseDropdown.js          # 🏗️ 공통 드롭다운 기반
│   │   ├── PurposeDropdown.js       # 🎯 목적별 노트 메뉴
│   │   └── index.js                 # 📤 드롭다운 export
│   └── buttons/                     # 📂 버튼 컴포넌트 그룹
│       ├── PlusButton.js            # ➕ 플러스 버튼 (상태 관리)
│       └── index.js                 # 📤 버튼 export
├── constants/
│   ├── NoteTemplates.js             # 📝 노트 템플릿 정의
│   └── DropdownConfig.js            # ⚙️ 드롭다운 설정
├── hooks/
│   ├── useDropdownManager.js        # 🎣 드롭다운 로직 관리
│   └── useKeyboardDropdownSync.js   # ⚡ 키보드-드롭다운 동기화
└── types/
    └── dropdown.js                  # 📋 타입 정의
```

### ✅ **2. 상태 관리 패턴**
```javascript
// 중앙 집중식 상태 관리
const ToolbarState = {
  // 기존 상태
  keyboardVisible: boolean,
  activeScreenHandlers: object,
  focusedIndex: number,
  
  // 드롭다운 상태 추가
  activeDropdown: 'none' | 'purpose' | 'blocks' | 'formatting',
  dropdownData: object,
  
  // 전환 상태
  isTransitioning: boolean
}
```

### ✅ **3. 컴포넌트 계층 구조**
```
App.js
├── SimpleToolbarProvider
    ├── UnifiedToolbar (상단 고정)
    │   ├── PlusButton (토글 상태 관리)
    │   ├── FormatButtons (B, I, H1, H2, H3)
    │   ├── BlockButtons (Card, Grid, Image)  
    │   └── KeyboardButton (chevrons-down)
    └── DropdownManager (키보드 영역 대체)
        ├── PurposeDropdown (목적별 노트)
        ├── BlocksDropdown (미래 확장용)
        └── FormattingDropdown (미래 확장용)
```

### ✅ **4. 확장성 고려 설계**
```javascript
// 드롭다운 타입 정의 (확장 가능)
const DROPDOWN_TYPES = {
  PURPOSE: 'purpose',      // 목적별 노트
  BLOCKS: 'blocks',        // 블록 추가
  FORMATTING: 'formatting', // 포맷팅 옵션
  TEMPLATES: 'templates',   // 템플릿 선택
  SETTINGS: 'settings'     // 설정 메뉴
};

// 드롭다운 설정 (쉬운 수정)
const DROPDOWN_CONFIG = {
  [DROPDOWN_TYPES.PURPOSE]: {
    title: 'Purpose Notes',
    layout: 'grid-2col',
    items: NOTE_PURPOSES,
    height: 'auto'
  }
  // 새로운 드롭다운 쉽게 추가 가능
};
```

## 🔧 **구현 단계별 계획**

### **Phase 1: 기반 구조 구축**
1. **DropdownManager 컴포넌트** 생성
   - 키보드 영역을 대체하는 컨테이너
   - 애니메이션 처리 (키보드 ↔ 드롭다운)
   - 드롭다운 타입별 라우팅

2. **BaseDropdown 컴포넌트** 생성
   - 공통 드롭다운 UI 구조
   - 애니메이션, 스타일링 기본 제공
   - 확장 가능한 레이아웃 시스템

### **Phase 2: 상태 관리 확장**
1. **SimpleToolbarContext 확장**
   ```javascript
   const contextValue = {
     // 기존
     keyboardVisible,
     activeScreenHandlers,
     focusedIndex,
     
     // 드롭다운 상태
     activeDropdown,
     setActiveDropdown,
     
     // 전환 함수
     showDropdown: (type, data) => void,
     hideDropdown: () => void,
     toggleDropdown: (type, data) => void,
   };
   ```

2. **useDropdownManager 훅** 생성
   - 드롭다운 로직 캡슐화
   - 키보드와 드롭다운 전환 관리
   - 애니메이션 동기화

### **Phase 3: 목적별 노트 구현**
1. **PurposeDropdown 컴포넌트**
   - 5가지 목적별 옵션 (2열 그리드)
   - 터치 인터랙션 및 네비게이션
   - 템플릿 적용 로직

2. **NoteTemplates 시스템**
   - 각 목적별 초기 구조 정의
   - CreateNoteScreen과 연동
   - 확장 가능한 템플릿 구조

### **Phase 4: 통합 및 최적화**
1. **플러스 버튼 토글 구현**
   - 활성화/비활성화 상태 표시
   - 드롭다운 토글 연동

2. **애니메이션 최적화**
   - 부드러운 키보드 ↔ 드롭다운 전환
   - 성능 최적화 (메모이제이션)

## 🎨 **데이터 플로우 설계**

### **드롭다운 활성화 플로우**:
```
1. 사용자가 [+] 클릭
   ↓
2. PlusButton → useDropdownManager.toggleDropdown('purpose')
   ↓
3. SimpleToolbarContext → activeDropdown = 'purpose'
   ↓
4. DropdownManager → PurposeDropdown 렌더링
   ↓
5. 키보드 hide + 드롭다운 show 애니메이션
```

### **옵션 선택 플로우**:
```
1. 사용자가 "Daily Journal" 선택
   ↓
2. PurposeDropdown → onSelectPurpose('diary')
   ↓
3. NoteTemplates → getDiaryTemplate()
   ↓
4. Navigation → CreateNoteScreen (템플릿 포함)
   ↓
5. 드롭다운 자동 닫기 + 키보드 복귀
```

## 🔒 **안정성 보장 방안**

### **1. 타입 안전성**
```javascript
// 타입 정의로 런타임 오류 방지
const DropdownType = {
  PURPOSE: 'purpose',
  BLOCKS: 'blocks'
};

const validateDropdownType = (type) => {
  return Object.values(DropdownType).includes(type);
};
```

### **2. 에러 경계 처리**
```javascript
const DropdownManager = () => {
  const [error, setError] = useState(null);
  
  if (error) {
    return <DropdownErrorFallback onRetry={() => setError(null)} />;
  }
  
  // 정상 렌더링
};
```

### **3. 메모리 누수 방지**
```javascript
useEffect(() => {
  // 애니메이션 리스너 등록
  const listener = dropdownAnimation.addListener(...);
  
  return () => {
    // 정리 함수로 메모리 누수 방지
    dropdownAnimation.removeListener(listener);
  };
}, []);
```

## 🚀 **성능 최적화 전략**

### **1. 컴포넌트 메모이제이션**
```javascript
const PurposeDropdown = React.memo(({ onSelect, onClose }) => {
  // 불필요한 리렌더링 방지
});

const PlusButton = React.memo(({ isActive, onToggle }) => {
  // 상태 변화에만 반응
});
```

### **2. 애니메이션 최적화**
```javascript
const dropdownAnimation = useRef(new Animated.Value(0)).current;

// Native Driver 사용으로 60fps 보장
Animated.timing(dropdownAnimation, {
  toValue: 1,
  duration: 250,
  useNativeDriver: true
}).start();
```

### **3. 지연 로딩**
```javascript
// 드롭다운이 활성화될 때만 컴포넌트 로드
const PurposeDropdown = lazy(() => import('./PurposeDropdown'));

const DropdownManager = () => {
  return (
    <Suspense fallback={<DropdownSkeleton />}>
      {activeDropdown === 'purpose' && <PurposeDropdown />}
    </Suspense>
  );
};
```

## 🔄 **미래 확장성**

### **새로운 드롭다운 추가 예시**:
```javascript
// 1. 타입 추가
const DROPDOWN_TYPES = {
  PURPOSE: 'purpose',
  TEMPLATES: 'templates'  // 새로 추가
};

// 2. 설정 추가
const DROPDOWN_CONFIG = {
  [DROPDOWN_TYPES.TEMPLATES]: {
    title: 'Templates',
    layout: 'list',
    items: TEMPLATE_LIST
  }
};

// 3. 컴포넌트 추가
const TemplateDropdown = () => { /* 구현 */ };

// 4. DropdownManager에 연결
const DropdownManager = () => {
  switch(activeDropdown) {
    case 'purpose': return <PurposeDropdown />;
    case 'templates': return <TemplateDropdown />; // 추가
  }
};
```

## 📝 **구현 체크리스트**

### **기반 구조**
- [ ] DropdownManager 컴포넌트 생성
- [ ] BaseDropdown 공통 컴포넌트 생성  
- [ ] useDropdownManager 훅 생성
- [ ] DROPDOWN_TYPES 상수 정의

### **상태 관리**
- [ ] SimpleToolbarContext에 드롭다운 상태 추가
- [ ] 키보드 ↔ 드롭다운 전환 로직 구현
- [ ] 애니메이션 동기화 구현

### **UI 구현**
- [ ] PurposeDropdown 컴포넌트 생성
- [ ] PlusButton 토글 상태 구현
- [ ] 2열 그리드 레이아웃 구현

### **통합 및 테스트**
- [ ] CreateNoteScreen과 연동
- [ ] 애니메이션 최적화
- [ ] 에러 처리 및 폴백 구현

---

**이 구조를 따르면:**
- ✅ **수정하기 쉬움**: 각 컴포넌트가 명확히 분리됨
- ✅ **새 기능 추가 쉬움**: 설정만 추가하면 새 드롭다운 생성 가능
- ✅ **안정성 보장**: 타입 안전성과 에러 처리 내장
- ✅ **성능 최적화**: 메모이제이션과 지연 로딩 적용
- ✅ **확장성**: 미래의 드롭다운 타입 쉽게 추가 가능

이 설계를 기반으로 단계별 구현을 진행하면 됩니다.