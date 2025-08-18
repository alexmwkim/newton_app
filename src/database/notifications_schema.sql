-- 노티피케이션 시스템을 위한 Supabase 데이터베이스 스키마
-- Newton 앱의 알림 기능 구현

-- 1. 노티피케이션 테이블
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('star', 'fork', 'follow', 'comment', 'mention', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  related_note_id TEXT REFERENCES notes(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 방지는 애플리케이션 레벨과 트리거에서 처리
  -- CONSTRAINT unique_notification UNIQUE (recipient_id, sender_id, type, related_note_id, related_user_id) -- 제거됨
);

-- 2. 노티피케이션 설정 테이블
CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  notification_types JSONB DEFAULT '{
    "star": true,
    "fork": true,
    "follow": true,
    "comment": true,
    "mention": true,
    "system": true
  }',
  quiet_hours JSONB DEFAULT '{
    "enabled": false,
    "start_time": "22:00",
    "end_time": "08:00"
  }',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 팔로우 관계 테이블 (팔로우 알림을 위해 필요)
CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 팔로우 방지
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id),
  -- 자기 자신 팔로우 방지
  CONSTRAINT no_self_follow CHECK (follower_id != following_id)
);

-- 4. 스타 테이블 (스타 알림을 위해 필요 - 이미 있을 수 있음)
CREATE TABLE IF NOT EXISTS note_stars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 중복 스타 방지
  CONSTRAINT unique_star UNIQUE (user_id, note_id)
);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(recipient_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notification_settings_user ON notification_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_note_stars_user ON note_stars(user_id);
CREATE INDEX IF NOT EXISTS idx_note_stars_note ON note_stars(note_id);

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_stars ENABLE ROW LEVEL SECURITY;

-- 노티피케이션 정책
CREATE POLICY "Users can view their own notifications" 
  ON notifications FOR SELECT 
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can update their own notifications" 
  ON notifications FOR UPDATE 
  USING (auth.uid() = recipient_id);

CREATE POLICY "Users can delete their own notifications" 
  ON notifications FOR DELETE 
  USING (auth.uid() = recipient_id);

CREATE POLICY "System can insert notifications" 
  ON notifications FOR INSERT 
  WITH CHECK (true); -- 시스템에서 자유롭게 알림 생성 가능

-- 노티피케이션 설정 정책
CREATE POLICY "Users can manage their own notification settings" 
  ON notification_settings FOR ALL 
  USING (auth.uid() = user_id);

-- 팔로우 정책
CREATE POLICY "Users can view all follows" 
  ON follows FOR SELECT 
  USING (true); -- 공개 정보

CREATE POLICY "Users can follow others" 
  ON follows FOR INSERT 
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others" 
  ON follows FOR DELETE 
  USING (auth.uid() = follower_id);

-- 스타 정책
CREATE POLICY "Users can view all stars" 
  ON note_stars FOR SELECT 
  USING (true); -- 공개 정보

CREATE POLICY "Users can star notes" 
  ON note_stars FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unstar notes" 
  ON note_stars FOR DELETE 
  USING (auth.uid() = user_id);

-- 7. 트리거 함수들

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- updated_at 트리거 생성
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_settings_updated_at 
  BEFORE UPDATE ON notification_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 스타 알림 자동 생성 트리거 (ON CONFLICT 제거)
CREATE OR REPLACE FUNCTION create_star_notification()
RETURNS TRIGGER AS $$
DECLARE
  note_owner_id UUID;
  note_title TEXT;
  starrer_username TEXT;
  existing_notification_count INTEGER;
  notification_id TEXT;
BEGIN
  -- 노트 소유자 ID 조회
  SELECT user_id, title INTO note_owner_id, note_title
  FROM notes 
  WHERE id = NEW.note_id;
  
  -- 자신의 노트에 스타한 경우 알림 생성하지 않음
  IF note_owner_id = NEW.user_id THEN
    RETURN NEW;
  END IF;

  -- 이미 같은 스타 노티피케이션이 있는지 확인
  SELECT COUNT(*) INTO existing_notification_count
  FROM notifications
  WHERE recipient_id = note_owner_id
    AND sender_id = NEW.user_id
    AND type = 'star'
    AND related_note_id = NEW.note_id;

  -- 이미 알림이 있으면 생성하지 않음
  IF existing_notification_count > 0 THEN
    RETURN NEW;
  END IF;
  
  -- 스타한 사용자의 username 조회
  SELECT username INTO starrer_username
  FROM profiles 
  WHERE user_id = NEW.user_id;
  
  -- 고유한 ID 생성
  notification_id := 'star_' || NEW.user_id || '_' || NEW.note_id || '_' || extract(epoch from now())::text;
  
  -- 알림 생성 (ON CONFLICT 제거하고 수동 중복 체크 사용)
  BEGIN
    INSERT INTO notifications (
      id,
      recipient_id,
      sender_id,
      type,
      title,
      message,
      data,
      priority,
      related_note_id,
      related_user_id
    ) VALUES (
      notification_id,
      note_owner_id,
      NEW.user_id,
      'star',
      '새로운 스타를 받았습니다',
      COALESCE(starrer_username, '누군가') || '님이 "' || COALESCE(note_title, '제목 없는 노트') || '"에 스타를 눌렀습니다',
      jsonb_build_object(
        'note_title', note_title,
        'starrer_username', starrer_username
      ),
      'normal',
      NEW.note_id,
      NEW.user_id
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- 중복 키 에러 시 무시
      NULL;
    WHEN OTHERS THEN
      -- 다른 에러 시 로그 남기고 계속 진행
      RAISE WARNING 'Failed to create star notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 스타 알림 트리거
CREATE TRIGGER star_notification_trigger
  AFTER INSERT ON note_stars
  FOR EACH ROW EXECUTE FUNCTION create_star_notification();

-- 9. 팔로우 알림 자동 생성 트리거 (ON CONFLICT 제거)
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
    AND type = 'follow';

  -- 이미 알림이 있으면 생성하지 않음
  IF existing_notification_count > 0 THEN
    RETURN NEW;
  END IF;

  -- 팔로워의 username 조회
  SELECT username INTO follower_username
  FROM profiles 
  WHERE user_id = NEW.follower_id;
  
  -- 고유한 ID 생성
  notification_id := 'follow_' || NEW.follower_id || '_' || NEW.following_id || '_' || extract(epoch from now())::text;
  
  -- 알림 생성 (ON CONFLICT 제거하고 수동 중복 체크 사용)
  BEGIN
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
  EXCEPTION
    WHEN unique_violation THEN
      -- 중복 키 에러 시 무시
      NULL;
    WHEN OTHERS THEN
      -- 다른 에러 시 로그 남기고 계속 진행
      RAISE WARNING 'Failed to create follow notification: %', SQLERRM;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 팔로우 알림 트리거
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- 10. 유틸리티 함수들

-- 사용자의 읽지 않은 알림 수 조회 함수
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM notifications
  WHERE recipient_id = user_id AND is_read = FALSE;
  
  RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql;

-- 사용자의 팔로워 수 조회 함수
CREATE OR REPLACE FUNCTION get_follower_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM follows
  WHERE following_id = user_id;
  
  RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql;

-- 사용자의 팔로잉 수 조회 함수
CREATE OR REPLACE FUNCTION get_following_count(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count
  FROM follows
  WHERE follower_id = user_id;
  
  RETURN COALESCE(count, 0);
END;
$$ LANGUAGE plpgsql;

-- 11. 초기 데이터 및 기본 설정

-- 시스템 사용자 생성 (시스템 알림용)
-- 실제 구현에서는 Supabase 대시보드에서 수동으로 생성하거나 마이그레이션에서 처리

-- 알림 정리 함수 (30일 이상 된 읽은 알림 삭제)
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications
  WHERE is_read = TRUE 
    AND read_at < NOW() - INTERVAL '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 매일 자정에 오래된 알림 정리 (선택사항)
-- SELECT cron.schedule('cleanup-notifications', '0 0 * * *', 'SELECT cleanup_old_notifications();');