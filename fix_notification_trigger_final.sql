-- 최종 알림 트리거 수정 - ON CONFLICT 제거하고 수동 중복 체크 구현
-- 실행 방법: Supabase SQL Editor에서 실행

-- 1. 기존 트리거와 함수 삭제
DROP TRIGGER IF EXISTS follow_notification_trigger ON follows;
DROP FUNCTION IF EXISTS create_follow_notification();

-- 2. 수정된 함수 생성 (ON CONFLICT 제거)
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
  existing_notification_count INTEGER;
  notification_id TEXT;
BEGIN
  -- 자기 자신을 팔로우하는 경우 알림 생성하지 않음
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  -- 이미 같은 팔로우 노티피케이션이 있는지 확인
  SELECT COUNT(*) INTO existing_notification_count
  FROM notifications
  WHERE recipient_id = NEW.following_id
    AND sender_id = NEW.follower_id
    AND type = 'follow'
    AND related_user_id = NEW.follower_id;

  -- 이미 알림이 있으면 생성하지 않음
  IF existing_notification_count > 0 THEN
    RETURN NEW;
  END IF;

  -- 팔로워의 username 조회
  SELECT username INTO follower_username
  FROM profiles 
  WHERE user_id = NEW.follower_id;
  
  -- 고유한 ID 생성
  notification_id := 'follow_' || NEW.follower_id || '_' || NEW.following_id || '_' || extract(epoch from now())::text || '_' || substr(md5(random()::text), 1, 6);
  
  -- 알림 생성 (ON CONFLICT 없이)
  INSERT INTO notifications (
    id,
    recipient_id,
    sender_id,
    type,
    title,
    message,
    data,
    priority,
    related_user_id
  ) VALUES (
    notification_id,
    NEW.following_id,  -- 팔로우당한 사람이 수신자
    NEW.follower_id,   -- 팔로우한 사람이 발신자
    'follow',
    'You have a new follower',
    COALESCE(follower_username, 'Someone') || ' started following you',
    jsonb_build_object(
      'sender_id', NEW.follower_id,
      'follower_username', follower_username,
      'action', 'follow'
    ),
    'high',
    NEW.follower_id
  );
  
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 중복 키 에러 시 무시
    RETURN NEW;
  WHEN OTHERS THEN
    -- 다른 에러 시 로그 남기고 계속 진행
    RAISE WARNING 'Failed to create follow notification: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 새 트리거 생성
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- 확인용 쿼리
SELECT 'Follow notification trigger updated successfully (without ON CONFLICT)' as status;