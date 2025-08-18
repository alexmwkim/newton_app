-- Apply all database fixes to resolve ON CONFLICT error
-- Execute this in Supabase SQL Editor

-- Step 1: Remove problematic constraints
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS unique_notification;

-- Step 2: Create safer partial constraints
DROP INDEX IF EXISTS unique_follow_notification;
CREATE UNIQUE INDEX unique_follow_notification 
  ON notifications (recipient_id, sender_id, type) 
  WHERE type = 'follow';

-- Step 3: Remove existing trigger and function
DROP TRIGGER IF EXISTS follow_notification_trigger ON follows;
DROP FUNCTION IF EXISTS create_follow_notification();

-- Step 4: Create new trigger function without ON CONFLICT
CREATE OR REPLACE FUNCTION create_follow_notification()
RETURNS TRIGGER AS $$
DECLARE
  follower_username TEXT;
  existing_notification_count INTEGER;
  notification_id TEXT;
BEGIN
  -- Skip self-follow
  IF NEW.follower_id = NEW.following_id THEN
    RETURN NEW;
  END IF;

  -- Check for existing notification
  SELECT COUNT(*) INTO existing_notification_count
  FROM notifications
  WHERE recipient_id = NEW.following_id
    AND sender_id = NEW.follower_id
    AND type = 'follow';

  -- Skip if already exists
  IF existing_notification_count > 0 THEN
    RETURN NEW;
  END IF;

  -- Get follower username
  SELECT username INTO follower_username
  FROM profiles 
  WHERE user_id = NEW.follower_id;
  
  -- Generate unique ID
  notification_id := 'follow_' || NEW.follower_id || '_' || NEW.following_id || '_' || extract(epoch from now())::text;
  
  -- Insert notification without ON CONFLICT
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
      NEW.following_id,
      NEW.follower_id,
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
      -- Ignore duplicate
      NULL;
  END;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create new trigger
CREATE TRIGGER follow_notification_trigger
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION create_follow_notification();

-- Verification
SELECT 'Database fixes applied successfully - ON CONFLICT removed' as status;