-- Fix notifications table constraints for better conflict handling
-- 실행 방법: Supabase SQL Editor에서 실행

-- 1. 기존 제약조건 제거
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS unique_notification;

-- 2. 팔로우 알림용 부분 제약조건 추가 (related_note_id가 NULL인 경우)
CREATE UNIQUE INDEX IF NOT EXISTS unique_follow_notification 
  ON notifications (recipient_id, sender_id, type, related_user_id) 
  WHERE type = 'follow' AND related_note_id IS NULL;

-- 3. 스타 알림용 부분 제약조건 추가 (related_note_id가 NOT NULL인 경우)
CREATE UNIQUE INDEX IF NOT EXISTS unique_star_notification 
  ON notifications (recipient_id, sender_id, type, related_note_id) 
  WHERE type = 'star' AND related_note_id IS NOT NULL;

-- 4. 기타 알림용 일반 제약조건 (안전장치)
CREATE UNIQUE INDEX IF NOT EXISTS unique_general_notification 
  ON notifications (recipient_id, sender_id, type, COALESCE(related_note_id::text, ''), COALESCE(related_user_id::text, ''));

-- 확인용 쿼리
SELECT 'Notifications constraints updated successfully' as status;