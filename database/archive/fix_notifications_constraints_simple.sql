-- 간단한 알림 테이블 제약조건 수정
-- 기존 제약조건으로 인한 ON CONFLICT 오류 해결

-- 1. 문제가 되는 기존 제약조건 제거
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS unique_notification;

-- 2. 더 간단한 부분 제약조건 추가 (팔로우 알림에만 적용)
-- 팔로우 알림의 경우: 같은 recipient_id, sender_id, type='follow'인 알림이 중복되지 않도록
DROP INDEX IF EXISTS unique_follow_notification;
CREATE UNIQUE INDEX unique_follow_notification 
  ON notifications (recipient_id, sender_id, type) 
  WHERE type = 'follow';

-- 3. 스타 알림의 경우: related_note_id까지 포함해서 중복 방지
DROP INDEX IF EXISTS unique_star_notification;
CREATE UNIQUE INDEX unique_star_notification 
  ON notifications (recipient_id, sender_id, type, related_note_id) 
  WHERE type = 'star' AND related_note_id IS NOT NULL;

-- 확인용 쿼리
SELECT 'Notifications constraints simplified successfully' as status;