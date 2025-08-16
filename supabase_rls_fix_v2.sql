-- Newton App Notifications RLS Policy Fix V2
-- 더 관대한 정책으로 수정

-- 1. 기존 정책들 모두 삭제
DROP POLICY IF EXISTS "Users can view their received notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can create notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their received notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their received notifications" ON notifications;

-- 2. 임시로 RLS 비활성화하여 테스트
-- ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- 3. 또는 더 관대한 정책 사용
-- 모든 인증된 사용자가 모든 알림에 접근 가능 (테스트용)
CREATE POLICY "Allow all authenticated users full access" ON notifications
    FOR ALL USING (auth.uid() IS NOT NULL)
    WITH CHECK (auth.uid() IS NOT NULL);

-- 4. 확인
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;