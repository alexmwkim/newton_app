# Supabase 백엔드 설정 가이드

Newton 앱의 Supabase 백엔드 설정을 위한 단계별 가이드입니다.

## 🚀 1단계: Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성/로그인
2. "New project" 클릭
3. 프로젝트 이름: `newton-app`
4. 데이터베이스 비밀번호 설정 (안전한 비밀번호 생성)
5. 리전 선택: `Southeast Asia (Singapore)` 또는 가장 가까운 리전
6. "Create new project" 클릭

## 🔑 2단계: 환경변수 설정

1. Supabase 대시보드에서 **Settings > API** 로 이동
2. **Project URL**과 **anon public** 키 복사
3. 프로젝트 루트에 `.env` 파일 생성:

```env
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

⚠️ **중요**: `.env` 파일을 `.gitignore`에 추가하여 Git에 커밋되지 않도록 하세요.

## 🗄️ 3단계: 데이터베이스 스키마 설정

1. Supabase 대시보드에서 **SQL Editor** 메뉴로 이동
2. "New query" 클릭
3. `supabase/schema.sql` 파일의 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭하여 스키마 생성

### 생성되는 테이블:
- **profiles**: 사용자 프로필 정보
- **notes**: 노트 데이터 (제목, 내용, 공개/비공개 설정)
- **stars**: 노트 별표/좋아요 기록
- **forks**: 노트 포크 기록

## 🔐 4단계: 인증 설정

1. Supabase 대시보드에서 **Authentication > Settings** 로 이동
2. **Site URL** 설정: 개발용으로 `http://localhost:19006` 추가
3. **Email Auth** 활성화 확인
4. 필요한 경우 **소셜 로그인** 설정 (Google, GitHub 등)

### 이메일 템플릿 커스터마이징 (선택사항):
- **Authentication > Email Templates**에서 가입 확인, 비밀번호 재설정 등의 이메일 템플릿 수정 가능

## 📁 5단계: 스토리지 설정 (아바타 이미지용)

1. **Storage** 메뉴로 이동
2. "Create a new bucket" 클릭
3. Name: `avatars`
4. Public bucket으로 설정
5. "Create bucket" 클릭

### 스토리지 정책 설정:
```sql
-- 아바타 업로드 정책
CREATE POLICY "Avatar images are publicly accessible."
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar."
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 🔄 6단계: 실시간 기능 설정

1. **Database > Replication** 메뉴로 이동
2. `notes`, `stars`, `forks` 테이블의 Realtime을 활성화
3. 이를 통해 실시간 업데이트가 앱에 반영됩니다.

## 🧪 7단계: 테스트 데이터 생성 (선택사항)

```sql
-- 테스트용 공개 노트 생성 (실제 사용자 생성 후 실행)
INSERT INTO public.notes (user_id, title, content, is_public) VALUES
(
  (SELECT id FROM public.profiles LIMIT 1),
  'Newton 앱에 오신 것을 환영합니다!',
  '# Newton으로 시작하는 새로운 노트 경험

Newton은 개인 노트와 공개 노트를 통해 지식을 공유하고 영감을 얻을 수 있는 플랫폼입니다.

## 주요 기능
- 📝 **개인 노트**: 나만의 생각을 정리
- 🌍 **공개 노트**: 다른 사람들과 지식 공유
- ⭐ **별표**: 좋은 노트에 별표 표시
- 🍴 **포크**: 다른 사람의 노트를 복사하여 내 것으로 수정

지금 바로 첫 번째 노트를 작성해보세요!',
  true
);
```

## 🚀 8단계: 앱 실행

1. 터미널에서 프로젝트 디렉토리로 이동
2. 환경변수가 올바르게 설정되었는지 확인
3. 앱 실행:
```bash
npm start
# 또는
npx expo start
```

## 📊 모니터링

Supabase 대시보드에서 다음 정보를 확인할 수 있습니다:
- **Auth**: 가입된 사용자 수 및 활동
- **Database**: 테이블 데이터 및 쿼리 성능
- **API**: API 사용량 및 응답 시간
- **Storage**: 업로드된 파일 현황

## 🔧 문제 해결

### 자주 발생하는 문제:

1. **연결 오류**
   - `.env` 파일의 URL과 키가 정확한지 확인
   - 네트워크 연결 상태 확인

2. **인증 오류**
   - RLS 정책이 올바르게 설정되었는지 확인
   - 사용자가 올바른 권한을 갖고 있는지 확인

3. **실시간 업데이트 안됨**
   - Realtime이 해당 테이블에 활성화되어 있는지 확인
   - 클라이언트에서 구독이 올바르게 설정되었는지 확인

## 🛡️ 보안 고려사항

- 프로덕션 환경에서는 RLS 정책을 더욱 엄격하게 설정
- API 키를 안전하게 관리 (환경변수 사용)
- 정기적인 데이터베이스 백업 설정
- Rate limiting 설정으로 API 남용 방지

---

이 가이드를 따라 설정하면 Newton 앱의 완전한 백엔드 기능을 사용할 수 있습니다. 문제가 발생하면 Supabase 문서나 커뮤니티를 참조하세요.