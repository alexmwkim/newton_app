# 🛠️ 툴바 최적화 가이드

## 📋 최적화 완료 사항

### 1. 아키텍처 구조 개선
- ✅ **단일 툴바 시스템**: 3개의 중복 시스템을 1개로 통합
- ✅ **전역 렌더링**: App.js에서 UnifiedToolbar 한 번만 렌더링
- ✅ **Context 최적화**: useMemo와 useCallback으로 불필요한 리렌더링 방지

### 2. 파일 정리 및 중복 제거
**제거된 Deprecated 파일들:**
- ❌ `GlobalToolbar.js` - 사용되지 않는 전역 툴바
- ❌ `ToolbarContext.js` - 중복 컨텍스트
- ❌ `Toolbar.js` (constants) - 사용되지 않는 상수
- ❌ `KeyboardControllerToolbar.js` - react-native-keyboard-controller 기반
- ❌ `KeyboardToolbarContent.js` - KeyboardController용 컨텐츠
- ❌ `CustomKeyboardToolbar.js` - 커스텀 키보드 툴바
- ❌ `systems/toolbar/` - 전체 시스템 디렉토리
- ❌ `OptimizedNoteEditor.js` - 사용되지 않는 에디터
- ❌ `useKeyboardAndFocus.js` - 사용되지 않는 훅
- ❌ 문서 파일들: TOOLBAR_ANALYSIS.md, KEYBOARD_TOOLBAR_*.md 등

### 3. 성능 최적화
- ✅ **React.memo**: UnifiedToolbar, UnifiedToolbarContent 메모이제이션
- ✅ **Context 최적화**: SimpleToolbarContext에 useMemo 적용
- ✅ **로그 제거**: 개발용 console.log 대폭 정리
- ✅ **이벤트 핸들러 최적화**: 직접 함수 참조로 변경

## 🎯 현재 구조

### 활성 파일들
```
src/
├── contexts/
│   └── SimpleToolbarContext.js      # ✅ 키보드-툴바 상태 관리
├── components/toolbar/
│   ├── UnifiedToolbar.js            # ✅ 메인 툴바 컴포넌트
│   ├── ToolbarFormatting.js         # ✅ 텍스트 포맷팅 상태
│   └── ToolbarButton.js             # ✅ 공통 버튼 컴포넌트
└── hooks/
    └── useKeyboardHandlers.js       # ✅ 키보드 핸들링
```

### 렌더링 플로우
1. **App.js**: UnifiedToolbar 전역 렌더링
2. **Screens**: setActiveScreenHandlers로 핸들러 등록만
3. **Context**: 상태 동기화 및 키보드 이벤트 처리

## 🚀 성능 개선 결과

### Before (최적화 전)
- 3개의 중복 툴바 시스템 동시 존재
- 각 화면마다 개별 UnifiedToolbar 렌더링
- 불필요한 console.log로 성능 저하
- Context 값 재생성으로 불필요한 리렌더링

### After (최적화 후)
- 단일 통합 툴바 시스템
- App.js에서 전역 한 번만 렌더링
- React.memo + useMemo로 리렌더링 최적화
- 깔끔한 코드베이스

## 📝 개발 베스트 프랙티스

### 1. 새로운 화면에서 툴바 사용하기
```javascript
// ✅ 올바른 방법
import { useSimpleToolbar } from '../contexts/SimpleToolbarContext';

const MyScreen = () => {
  const { setActiveScreenHandlers, setFocusedIndex } = useSimpleToolbar();
  
  useEffect(() => {
    // 핸들러 등록
    setActiveScreenHandlers({
      handleAddCard: myHandleAddCard,
      handleAddGrid: myHandleAddGrid,
      handleAddImage: myHandleAddImage
    });
    
    // 정리
    return () => setActiveScreenHandlers(null);
  }, []);
};
```

### 2. 툴바 버튼 최적화
```javascript
// ✅ 직접 함수 참조 사용 (최적화됨)
<ToolbarButton onPress={toggleBold} />

// ❌ 익명 함수 사용하지 않기 (리렌더링 유발)
<ToolbarButton onPress={() => toggleBold()} />
```

### 3. Context 사용 시 주의사항
```javascript
// ✅ 필요한 값만 구조분해할당
const { activeScreenHandlers, focusedIndex } = useSimpleToolbar();

// ❌ 전체 context 객체 사용하지 않기
const toolbar = useSimpleToolbar();
```

## 🔧 키보드-툴바 동기화 원리

### 애니메이션 시스템
```javascript
// 키보드와 툴바가 함께 올라오는 애니메이션
Animated.parallel([
  // 키보드 높이 추적
  Animated.timing(keyboardHeight, { toValue: finalHeight }),
  // 툴바 transform으로 아래에서 올라옴  
  Animated.timing(toolbarTranslateY, { toValue: 0 })
]).start();
```

### 위치 계산
- `bottom`: 키보드 높이 - SafeArea 계산
- `transform: translateY`: 자연스러운 아래→위 애니메이션
- `zIndex: 1000`: 다른 컴포넌트 위에 표시

## 🚨 주의사항

### 1. 툴바 시스템 변경 시
- SimpleToolbarContext의 값 변경 시 useMemo 의존성 배열 확인
- 새로운 핸들러 추가 시 TypeScript 타입 업데이트
- Context Provider 위치 변경 금지 (App.js에서 관리)

### 2. 키보드 처리
- 키보드 이벤트 리스너를 중복 등록하지 않기
- useKeyboardHandlers와 SimpleToolbarContext 충돌 방지
- 플랫폼별 키보드 이벤트 차이 고려

### 3. 성능 고려사항
- 툴바 버튼에서 무거운 연산 피하기
- Context 값 변경 시 전체 앱 리렌더링 주의
- 메모리 누수 방지를 위한 cleanup 함수 필수

## 🔄 향후 확장 가이드

### 새로운 툴바 기능 추가 시
1. `ToolbarFormatting.js`에 상태 추가
2. `UnifiedToolbarContent`에 버튼 컴포넌트 추가
3. 필요시 `SimpleToolbarContext`에 핸들러 추가
4. 화면별 핸들러 구현

### 애니메이션 수정 시
- `SimpleToolbarContext.js`의 Animated 값 수정
- 키보드 이벤트 타이밍과 동기화 유지
- iOS/Android 플랫폼 차이 고려

---

이 가이드를 따라 개발하면 성능이 최적화된 안정적인 툴바 시스템을 유지할 수 있습니다.