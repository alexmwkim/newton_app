-- 현재 인증된 사용자 ID로 노트 소유권 수정
-- Auth User ID: 10663749-9fba-4039-9f22-d6e7add9ea2d
-- Old User ID: 0aa12216-fdb6-4144-93a9-29078ed45b6c

-- 1. 모든 노트의 user_id를 현재 인증된 사용자 ID로 업데이트
UPDATE public.notes 
SET user_id = '10663749-9fba-4039-9f22-d6e7add9ea2d'
WHERE user_id = '0aa12216-fdb6-4144-93a9-29078ed45b6c';

-- 2. 프로필의 user_id도 업데이트 (필요한 경우)
UPDATE public.profiles 
SET user_id = '10663749-9fba-4039-9f22-d6e7add9ea2d'
WHERE user_id = '0aa12216-fdb6-4144-93a9-29078ed45b6c';

-- 3. 핀드 노트의 user_id도 업데이트
UPDATE public.user_pinned_notes 
SET user_id = '10663749-9fba-4039-9f22-d6e7add9ea2d'
WHERE user_id = '0aa12216-fdb6-4144-93a9-29078ed45b6c';

-- 4. 확인용 쿼리
SELECT 'notes' as table_name, count(*) as count FROM public.notes WHERE user_id = '10663749-9fba-4039-9f22-d6e7add9ea2d'
UNION ALL
SELECT 'profiles' as table_name, count(*) as count FROM public.profiles WHERE user_id = '10663749-9fba-4039-9f22-d6e7add9ea2d'
UNION ALL  
SELECT 'pinned_notes' as table_name, count(*) as count FROM public.user_pinned_notes WHERE user_id = '10663749-9fba-4039-9f22-d6e7add9ea2d';