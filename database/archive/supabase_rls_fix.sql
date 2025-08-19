-- Newton App Notifications RLS Policy Fix
-- Supabase Dashboard → SQL Editor에서 실행하세요

-- 1. 기존 정책들 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications';

-- 2. 기존 notifications 정책들 삭제 (있다면)
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;

-- 3. 새로운 RLS 정책 생성

-- 알림 조회 정책 (수신자만 조회 가능)
CREATE POLICY "Users can view their received notifications" ON notifications
    FOR SELECT USING (auth.uid() = recipient_id::uuid);

-- 알림 생성 정책 (인증된 사용자는 누구나 알림 생성 가능)
CREATE POLICY "Authenticated users can create notifications" ON notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 알림 업데이트 정책 (수신자만 자신의 알림 업데이트 가능 - 읽음 표시 등)
CREATE POLICY "Users can update their received notifications" ON notifications
    FOR UPDATE USING (auth.uid() = recipient_id::uuid)
    WITH CHECK (auth.uid() = recipient_id::uuid);

-- 알림 삭제 정책 (수신자만 자신의 알림 삭제 가능)
CREATE POLICY "Users can delete their received notifications" ON notifications
    FOR DELETE USING (auth.uid() = recipient_id::uuid);

-- 4. RLS 활성화 확인
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 5. 확인용 쿼리 - 정책이 올바르게 생성되었는지 확인
SELECT policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;