# Newton App - 키보드-툴바 동기화 분석 및 해결방안

## 🔍 문제 분석

### 현재 발생하는 이슈
- **텍스트 삭제 시 키보드-툴바 분리 현상**: 텍스트를 지워서 줄바꿈이 위로 이동할 때, 키보드가 순간적으로 아래로 내려갔다가 다시 올라오면서 툴바와 분리됨
- **Enter 시에는 정상 작동**: 새로운 줄을 생성할 때는 키보드와 툴바가 일정하게 움직임
- **불일치하는 동작 패턴**: 삭제와 생성 시 키보드 동작이 다름

### 기술적 원인 분석

#### 1. 현재 툴바 구현 방식 (`UnifiedToolbar.js:36-52`)
```javascript
<View 
  style={{
    position: 'absolute',
    bottom: keyboardHeight, // ⚠️ 키보드 높이에 직접 의존
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    // ...
  }}
>
```

**문제점**: 
- 툴바가 `keyboardHeight` 값에 직접 의존하여 위치 결정
- 키보드 높이 변화 시 툴바가 즉시 반응하여 분리 현상 발생

#### 2. 키보드 이벤트 처리 (`useKeyboardHandlers.js:16-25`)
```javascript
const keyboardDidShowListener = Keyboard.addListener(
  Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
  (event) => {
    const keyboardHeight = event.endCoordinates.height;
    setKeyboardHeight(keyboardHeight); // ⚠️ 즉시 상태 업데이트
    // ...
  }
);
```

**문제점**:
- iOS에서 `keyboardWillShow` 사용으로 인한 중간 상태 캐치
- 키보드 높이 변경사항이 즉시 툴바 위치에 반영됨

#### 3. 스크롤 로직과 키보드 높이 충돌
```javascript
// scrollToFocusedInput 함수에서 키보드 높이 기반 계산
const totalAvoidanceHeight = keyboardHeight + toolbarHeight + minimalPadding;
```

**문제점**:
- 텍스트 삭제 시 스크롤 계산과 키보드 높이 변경이 동시에 발생
- 스크롤 애니메이션 중 키보드 높이가 변경되어 툴바 위치 불안정

## 📊 업계 표준 분석

### iOS 네이티브 앱들의 해결 방식

#### 1. **InputAccessoryView 패턴** (Apple 권장)
- **iOS Messages, WhatsApp, Telegram**에서 사용
- 키보드와 툴바를 하나의 단위로 처리
- iOS가 자동으로 키보드와 함께 애니메이션 처리

#### 2. **Notion의 접근법**
- 툴바를 키보드 높이에 직접 의존시키지 않음
- 별도의 애니메이션 로직으로 부드러운 동기화
- 텍스트 변경 시 키보드 높이 변화 무시

#### 3. **React Native 생태계 모범사례**
- **react-native-keyboard-controller**: 키보드와 UI 요소 간의 완벽한 동기화 제공
- **InputAccessoryView**: React Native의 네이티브 솔루션

## 🎯 Newton 앱 현재 상황 분석

### 사용되는 키보드 이벤트
1. **SimpleToolbarContext.js:24-25**: `keyboardWillShow` 사용
2. **useKeyboardHandlers.js:16-17**: 플랫폼별 이벤트 분기
3. **텍스트 입력 컴포넌트들**: 각각 키보드 상태 추적

### 문제가 되는 시나리오
1. **텍스트 삭제** → **줄 높이 감소** → **스크롤 조정 필요** → **키보드 높이 순간 변화** → **툴바 위치 재계산** → **분리 현상**

2. **Enter 키 입력** → **새 줄 생성** → **스크롤 필요** → **키보드 높이 안정적** → **툴바 위치 유지** → **정상 동작**

## ✅ 해결방안

### Phase 1: InputAccessoryView 도입 (권장)

#### 장점
- iOS 네이티브 동기화 보장
- 자동 애니메이션 처리
- 플랫폼 일관성

#### 구현 방법
```javascript
// NoteDetailScreen.js 에서
<>
  <TextInput
    inputAccessoryViewID="note-toolbar"
    // ...
  />
  
  <InputAccessoryView nativeID="note-toolbar">
    <UnifiedToolbar />
  </InputAccessoryView>
</>
```

### Phase 2: 키보드 높이 안정화 (현재 구조 유지)

#### 핵심 아이디어
```javascript
// 키보드 높이 변화에 debouncing 적용
const [stableKeyboardHeight, setStableKeyboardHeight] = useState(0);

useEffect(() => {
  const timer = setTimeout(() => {
    setStableKeyboardHeight(keyboardHeight);
  }, 50); // 50ms 지연으로 안정화
  
  return () => clearTimeout(timer);
}, [keyboardHeight]);

// 툴바는 안정화된 높이 사용
<View style={{ bottom: stableKeyboardHeight }}>
```

### Phase 3: 애니메이션 동기화

#### 키보드와 툴바를 하나의 애니메이션으로 처리
```javascript
const keyboardAnimation = useRef(new Animated.Value(0)).current;

// 키보드 이벤트에서 애니메이션 시작
Animated.timing(keyboardAnimation, {
  toValue: keyboardHeight,
  duration: 250,
  useNativeDriver: false,
}).start();

// 툴바는 애니메이션 값 사용
<Animated.View style={{ bottom: keyboardAnimation }}>
```

## 🛠️ 구체적 구현 계획

### Step 1: InputAccessoryView 방식 구현
1. **UnifiedToolbar를 InputAccessoryView로 래핑**
2. **모든 TextInput에 inputAccessoryViewID 추가**
3. **키보드 높이 기반 위치 계산 제거**

### Step 2: 폴백 솔루션 (Android 호환성)
1. **iOS는 InputAccessoryView 사용**
2. **Android는 안정화된 키보드 높이 사용**

### Step 3: 테스트 시나리오
1. **텍스트 삭제 시 툴바 안정성 확인**
2. **Enter 키 동작과의 일관성 검증**
3. **다양한 키보드 모드 전환 테스트**

## 📈 예상 효과

### 사용자 경험 개선
- **안정된 툴바**: 키보드와 툴바가 항상 붙어있음
- **일관된 동작**: 삭제와 생성 시 동일한 애니메이션
- **네이티브 느낌**: iOS 표준 동작과 일치

### 기술적 안정성
- **플랫폼 최적화**: iOS InputAccessoryView의 네이티브 성능
- **메모리 효율**: 불필요한 키보드 높이 계산 제거
- **유지보수성**: 플랫폼별 표준 패턴 사용

## 🔬 다음 단계

1. **InputAccessoryView 프로토타입 구현**
2. **텍스트 삭제 시나리오 집중 테스트**
3. **키보드 모드 전환 (이모지, 한글, 영어) 테스트**
4. **사용자 피드백 수집 후 최적화**

---

*생성일: 2025-08-29*  
*키워드: keyboard-toolbar-sync, InputAccessoryView, iOS-animation, React-Native*