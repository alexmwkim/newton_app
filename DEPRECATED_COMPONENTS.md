# 사용 중단된 컴포넌트 목록

## 🚨 DEPRECATED - 삭제 예정

다음 컴포넌트들은 더 이상 사용되지 않으며, 향후 버전에서 삭제될 예정입니다.

### 헤더 컴포넌트들 (UnifiedHeader로 대체)
- ❌ `src/features/profile/components/user/UserProfileHeader.js`
- ❌ `src/features/profile/components/header/ProfileHeader.js` 
- ❌ `src/features/explore/components/SearchHeader.js`
- ❌ `src/features/notes/components/NoteHeader.js`
- ❌ `src/components/HeaderComponent.js`

### 기타 중복 컴포넌트들
- ❌ `src/components/SingleToggleComponent.js`
- ❌ `src/components/CreateButtonComponent.js`
- ❌ `src/components/ToggleButtonsComponent.js`

## ✅ 대체 컴포넌트

| 사용 중단 | 대체 컴포넌트 |
|---------|-------------|
| UserProfileHeader | UnifiedHeader (screenType="sub") |
| SearchHeader | UnifiedHeader (screenType="main") |
| NoteHeader | UnifiedHeader (screenType="sub") |
| HeaderComponent | UnifiedHeader |

## 🔧 마이그레이션 가이드

### 기존 코드:
```jsx
import UserProfileHeader from './UserProfileHeader';

<UserProfileHeader 
  title="Profile"
  onBack={handleBack}
/>
```

### 새 코드:
```jsx
import { UnifiedHeader } from '../shared/components/layout';

<UnifiedHeader 
  title="Profile"
  showBackButton={true}
  onBackPress={handleBack}
  screenType="sub"
/>
```

## 📅 삭제 일정
- **Phase 1**: DEPRECATED 주석 추가 ✅
- **Phase 2**: 사용처 검증 및 UnifiedHeader로 교체 
- **Phase 3**: 컴포넌트 파일 삭제

---
*이 문서는 StyleControl 시스템 도입과 함께 생성되었습니다.*