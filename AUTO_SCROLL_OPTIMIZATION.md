# Newton App - Auto-Scroll 최적화 가이드

## 🔍 문제 분석

### 현재 문제점
1. **텍스트 삭제 시 심한 화면 흔들림**: 줄이 위로 이동할 때마다 화면이 급격하게 스크롤됨
2. **과도한 자동 스크롤**: 불필요한 상황에서도 자동 스크롤 발생
3. **백업 스크롤의 과도한 보정**: 100px 추가 스크롤로 인한 부자연스러운 움직임
4. **실시간 리액션**: 모든 텍스트 변경에 즉각 반응하여 사용자 경험 저해

## 📊 업계 표준 리서치 결과

### UX 모범 사례 (2024)
- **자동 스크롤은 신중하게 사용**: 사용자 제어권을 빼앗지 않아야 함
- **예측 가능한 동작**: 사용자가 예상할 수 있는 상황에서만 발생
- **접근성 고려**: motion 민감성을 가진 사용자 배려
- **플랫폼 일관성**: iOS/Android 네이티브 동작과 일치

### 플랫폼별 동작 패턴
- **iOS**: 부드러운 스크롤, 예측 가능한 커서 위치 조정
- **Android**: 최소한의 스크롤, 주로 뷰포트 내에서만 조정

## 🎯 Newton 앱 현재 시스템 분석

### 사용 위치
1. **NoteDetailScreen.js**: 노트 편집 페이지
2. **CreateNoteScreen.js**: 새 노트 생성 페이지
3. **NoteBlockRenderer.js**: 텍스트 블록 포커스 시
4. **NoteCardBlock.js**: 카드 블록 포커스 시
5. **MultilineFormattedInput.js**: 카드 내 줄별 포커스 시

### 현재 트리거 조건
```javascript
// 1. 키보드 나타날 때 (항상)
if (keyboardHeight > 100) {
  scrollToFocusedInput(keyboardHeight);
}

// 2. 텍스트 포커스 시 (키보드가 이미 보이는 경우)
if (keyboardVisible && keyboardHeight > 0) {
  setTimeout(() => scrollToFocusedInput(keyboardHeight), 100);
}

// 3. 백업 스크롤 (100ms 후 추가 100px)
setTimeout(() => {
  scrollRef.current.scrollTo({ y: targetScrollY + 100, animated: true });
}, 100);
```

### 문제점
1. **과도한 보정**: `targetScrollY + 100` 백업 스크롤
2. **추정 기반 계산**: 실제 블록 높이를 측정하지 않음
3. **텍스트 변경 시 즉시 반응**: 삭제할 때마다 스크롤
4. **throttling 부족**: 100ms만으로는 부족함

## ✅ 최적화 계획

### Phase 1: 트리거 조건 최적화
**언제 자동 스크롤해야 하는가?**
- ✅ **키보드가 처음 나타날 때**: 포커스된 입력 필드가 키보드에 가려지는 경우
- ✅ **새 블록/줄 생성 시**: Enter키로 새 줄을 만든 경우
- ❌ **텍스트 삭제 시**: 사용자가 직접 스크롤하도록 함
- ❌ **기존 블록 포커스 시**: 키보드가 이미 보이고 있으면 스크롤하지 않음
- ❌ **타이핑 중**: 실시간으로 스크롤하지 않음

### Phase 2: 스크롤 동작 개선
**어떻게 부드럽게 스크롤할 것인가?**
1. **백업 스크롤 제거**: 과도한 보정 삭제
2. **실제 측정**: 추정 대신 실제 블록 위치 측정
3. **적응형 여백**: 화면 크기에 따른 동적 여백 계산
4. **더 긴 throttling**: 200ms 이상으로 증가

### Phase 3: 사용자 경험 개선
**사용자 제어권 보장**
1. **삭제 시 스크롤 방지**: 텍스트 삭제 시 자동 스크롤 비활성화
2. **의도 기반 트리거**: 명확한 사용자 의도가 있을 때만 실행
3. **cancellable 스크롤**: 사용자가 수동 스크롤 시 자동 스크롤 취소

## 🛠️ 구현 단계별 계획

### Step 1: 트리거 조건 정제
```javascript
// 개선된 트리거 로직
const shouldAutoScroll = (context) => {
  // 키보드가 새로 나타난 경우만
  if (context.type === 'keyboard_show' && !context.wasVisible) return true;
  
  // 새 블록/줄 생성한 경우만  
  if (context.type === 'new_block_created') return true;
  
  // 텍스트 삭제, 기존 포커스는 스크롤하지 않음
  if (context.type === 'text_deleted' || context.type === 'existing_focus') return false;
  
  return false;
};
```

### Step 2: 스크롤 계산 개선
```javascript
const calculateOptimalScrollPosition = (focusedElement, keyboardHeight) => {
  // 실제 요소 위치 측정
  const elementRect = measureElement(focusedElement);
  const screenHeight = Dimensions.get('window').height;
  const visibleHeight = screenHeight - keyboardHeight;
  
  // 최소한의 스크롤만 수행
  const targetY = Math.max(0, elementRect.bottom - visibleHeight + MINIMAL_PADDING);
  
  return targetY;
};
```

### Step 3: 부드러운 애니메이션
```javascript
const smoothScrollToPosition = (targetY) => {
  // 백업 스크롤 제거
  scrollRef.current.scrollTo({
    y: targetY,
    animated: true
  });
  
  // 추가 스크롤 없음!
};
```

## 📋 테스트 시나리오

### 시나리오 1: 텍스트 삭제
- **Before**: 줄 삭제 시마다 화면 흔들림
- **After**: 삭제 시 스크롤하지 않음, 사용자가 필요 시 수동 스크롤

### 시나리오 2: 새 줄 생성  
- **Before**: 과도한 스크롤로 너무 많이 이동
- **After**: 새 줄이 보이는 최소한의 스크롤만

### 시나리오 3: 기존 블록 포커스
- **Before**: 키보드가 이미 보이는데도 추가 스크롤
- **After**: 키보드가 이미 보이면 스크롤하지 않음

## 🎯 예상 효과

### 사용자 경험 개선
- **화면 흔들림 제거**: 텍스트 삭제 시 안정된 화면
- **예측 가능한 동작**: 사용자가 예상할 수 있는 상황에서만 스크롤
- **제어권 보장**: 사용자가 원할 때 수동으로 스크롤 가능

### 기술적 안정성
- **성능 향상**: 불필요한 스크롤 계산 제거
- **배터리 효율**: 과도한 애니메이션 감소
- **플랫폼 일관성**: iOS/Android 네이티브 동작과 유사

## 📝 다음 단계

1. **프로토타입 구현**: 개선된 로직으로 테스트 버전 생성
2. **사용자 테스트**: 실제 사용 시나리오에서 검증  
3. **세밀 조정**: 피드백 기반 최적화
4. **전체 적용**: 모든 노트 페이지에 일관된 경험 제공

---

*생성일: 2025-08-28*  
*최종 수정: 2025-08-28*