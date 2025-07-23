-- Foreign Key 제약조건 제거하여 User ID 수정 허용
-- notes 테이블의 user_id foreign key 제거

ALTER TABLE public.notes DROP CONSTRAINT IF EXISTS notes_user_id_fkey;

-- 데이터 수정 후 다시 추가할 수 있도록 백업
-- ALTER TABLE public.notes ADD CONSTRAINT notes_user_id_fkey 
-- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;