# 커밋 분석: 팔로우 시스템 오류 원인

## 🔍 분석 결과

### 커밋 b57608d (잘 작동했던 버전)과 현재 코드의 차이점

#### 1. 중요한 변화: 서비스 import 구조

**커밋 당시 (정상 작동):**
```javascript
// UserProfileScreen.js
require('../services/followClient').default.getBatchFollowData(targetUserId, currentUser?.id)
```

**현재 코드 (문제 발생):**
```javascript
// UserProfileScreen.js 상단
import FollowService from '../services/followClient';

// 사용 부분
await FollowService.getBatchFollowData(targetUserId, currentUser?.id);
```

#### 2. 캐시 로직의 차이

**커밋 당시 (정상):**
- 캐시 타임아웃: 5분 (5 * 60 * 1000)
- 즉시 캐시 데이터 사용 후 백그라운드 업데이트
- `setTimeout(() => { ... }, 10)` - 매우 빠른 백그라운드 로드

**현재 코드 (문제):**
- 복잡한 캐시 확인 로직
- 여러 서비스 간 동기화 문제
- UnifiedFollowService vs FollowClientService 혼재

#### 3. 캐시 초기화 방식

**커밋 당시:**
```javascript
const [followersCount, setFollowersCount] = useState(initialData.followersCount);
const [followingCount, setFollowingCount] = useState(initialData.followingCount);
```

**현재:**
- 더 복잡한 초기화 로직
- 여러 캐시 시스템으로 인한 혼란

## 🚨 핵심 문제

1. **서비스 import 방식 변경**: `require().default` → `import` 구조 변경으로 인한 모듈 로딩 이슈
2. **캐시 시스템 복잡화**: 단순했던 FollowCacheStore가 여러 시스템과 충돌
3. **동기화 로직 추가**: 원래는 단순한 캐시-DB 구조였는데 복잡한 동기화 로직 추가

## 💡 해결 방안

### Option 1: 커밋 당시 코드 구조로 단순화
1. UserProfileScreen의 서비스 import를 require().default 방식으로 변경
2. 캐시 로직을 커밋 당시처럼 단순화
3. 백그라운드 업데이트 로직 복원

### Option 2: 현재 구조 유지하며 수정
1. FollowClientService와 UnifiedFollowService 중 하나만 사용
2. 캐시 동기화 로직 단순화
3. 데이터 플로우 일원화

## 🎯 즉시 적용 가능한 수정

커밋 당시의 성공적인 패턴을 현재 코드에 적용:

1. **간단한 캐시 우선 로직**: 캐시가 있으면 즉시 사용, 백그라운드에서 업데이트
2. **단일 서비스 사용**: FollowClientService만 사용
3. **복잡한 동기화 로직 제거**: 단순한 캐시-DB 구조로 복원