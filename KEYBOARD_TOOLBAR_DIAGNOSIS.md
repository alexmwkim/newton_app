# Newton App - 키보드 툴바 문제 진단 및 해결방안

## 🔍 현재 상황 분석

### 발생 중인 문제
1. **InputAccessoryView 툴바가 보이지 않음** - 로그에서는 렌더링되지만 화면에 나타나지 않음
2. **텍스트 삭제 시 키보드 분리 현상** - 줄바꿈이 위로 이동할 때 키보드가 아래로 내려갔다 올라옴

### 로그 분석 결과
```
✅ UnifiedToolbarContent render - activeScreenHandlers: true focusedIndex: 4
✅ UnifiedToolbarContent activeFormats: {...}
✅ UnifiedToolbarContent: Rendering toolbar content...
```
- UnifiedToolbarContent가 **정상적으로 렌더링**되고 있음
- 문제는 **InputAccessoryView 연결**에 있음

## 🛠️ 이미 시도한 해결 방법

### 1. InputAccessoryView 구현
```javascript
// NoteDetailScreen.js
{Platform.OS === 'ios' && (
  <InputAccessoryView nativeID={TOOLBAR_ID}>
    <UnifiedToolbarContent />
  </InputAccessoryView>
)}

// TextInput 연결
inputAccessoryViewID={TOOLBAR_ID}
```

### 2. KeyboardAvoidingView 비활성화
```javascript
// iOS에서 InputAccessoryView와 충돌 방지
enabled={Platform.OS !== 'ios'}
```

### 3. 글로벌 UnifiedToolbar 비활성화
```javascript
// App.js에서 기존 툴바 제거
{/* <UnifiedToolbar /> */}
```

## 📊 업계 표준 분석

### React Native 생태계 모범사례
1. **react-native-keyboard-controller**: 가장 현대적이고 활발한 솔루션
   - KeyboardToolbar 컴포넌트 제공
   - iOS/Android 일관된 동작
   - WhatsApp, Messages 스타일 구현 가능

2. **react-native-keyboard-manager**: iOS 전용 솔루션
   - 더 이상 활발하게 유지보수되지 않음
   - 커스터마이징 제한적

### 네이티브 iOS 앱들의 방식
1. **Messages, WhatsApp**: UIKit의 inputAccessoryView 사용
2. **Telegram**: 커스텀 키보드 핸들링 구현
3. **Notion**: 복합적 접근 (inputAccessoryView + 커스텀 로직)

## 🚨 InputAccessoryView 알려진 이슈들

### React Native InputAccessoryView 문제점
1. **iOS 11 호환성 문제**: 일부 버전에서 작동하지 않음
2. **Modal과의 충돌**: Modal 열고 닫을 때 사라지는 현상
3. **초기 렌더링 문제**: 첫 포커스 시 나타나지 않는 경우
4. **Import 문제**: 구버전에서 모듈을 찾을 수 없는 오류
5. **Layout 문제**: 부모 View 스타일에 영향받아 크기 문제

### Newton 앱에서 발생 가능한 원인
1. **Modal 사용**: PageInfoModal이 InputAccessoryView에 영향
2. **복잡한 레이아웃**: SafeAreaView, KeyboardAvoidingView 등의 중첩
3. **버전 호환성**: React Native 또는 Expo 버전 문제
4. **TextInput 설정**: inputAccessoryViewID 연결 실패

## ✅ 다음 해결 전략

### Phase 1: InputAccessoryView 문제 해결
1. **Modal presentationStyle 수정**
2. **React Native 버전 확인**
3. **단순한 테스트 케이스** 구현

### Phase 2: 대안 솔루션 구현
1. **react-native-keyboard-controller 도입**
2. **커스텀 키보드 핸들링** 구현
3. **하이브리드 방식**: InputAccessoryView + 폴백

### Phase 3: 키보드 분리 현상 해결
1. **iOS 네이티브 동작 분석**
2. **키보드 애니메이션 동기화**
3. **텍스트 변경 이벤트 최적화**

## 🔧 즉시 시도할 해결책

### 1. Modal presentationStyle 수정
```javascript
// PageInfoModal에 presentationStyle 추가
<Modal
  visible={showPageInfoModal}
  animationType="fade"
  transparent={true}
  presentationStyle="overFullScreen"  // 추가
  onRequestClose={() => setShowPageInfoModal(false)}
>
```

### 2. 단순 테스트 케이스
```javascript
// 최소한의 InputAccessoryView 테스트
<InputAccessoryView nativeID="test-toolbar">
  <View style={{backgroundColor: 'red', height: 50}}>
    <Text>TEST TOOLBAR</Text>
  </View>
</InputAccessoryView>
```

### 3. react-native-keyboard-controller 도입
```bash
npm install react-native-keyboard-controller
npx pod-install  # iOS
```

## 📈 예상 결과

### InputAccessoryView 성공 시
- ✅ 키보드와 툴바 완벽 동기화
- ✅ iOS 네이티브 애니메이션
- ✅ 텍스트 삭제 시 분리 현상 해결

### 대안 솔루션 필요 시
- react-native-keyboard-controller로 마이그레이션
- 더 안정적이고 현대적인 솔루션
- 크로스 플랫폼 일관성

---

*생성일: 2025-08-29*  
*상태: InputAccessoryView 연결 문제 진단 중*