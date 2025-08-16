/**
 * 노티피케이션 데이터베이스 설정 유틸리티
 * 필요한 테이블들을 생성하고 설정합니다.
 */

import { supabase } from '../services/supabase';

export const setupNotificationTables = async () => {
  try {
    console.log('🔧 Setting up notification database tables...');

    // 1. 노티피케이션 테이블 생성
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        recipient_id UUID NOT NULL,
        sender_id UUID,
        type TEXT NOT NULL CHECK (type IN ('star', 'fork', 'follow', 'comment', 'mention', 'system')),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        data JSONB DEFAULT '{}',
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
        related_note_id TEXT,
        related_user_id UUID,
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const { error: notificationsError } = await supabase.rpc('exec_sql', {
      sql: createNotificationsTable
    });

    if (notificationsError && !notificationsError.message.includes('already exists')) {
      console.error('❌ Failed to create notifications table:', notificationsError);
      throw notificationsError;
    }

    console.log('✅ Notifications table ready');

    // 2. 노티피케이션 설정 테이블 생성
    const createNotificationSettingsTable = `
      CREATE TABLE IF NOT EXISTS notification_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL UNIQUE,
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
    `;

    const { error: settingsError } = await supabase.rpc('exec_sql', {
      sql: createNotificationSettingsTable
    });

    if (settingsError && !settingsError.message.includes('already exists')) {
      console.error('❌ Failed to create notification_settings table:', settingsError);
      throw settingsError;
    }

    console.log('✅ Notification settings table ready');

    // 3. RLS 정책 설정
    const enableRLS = `
      ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
    `;

    await supabase.rpc('exec_sql', { sql: enableRLS });

    // 4. 기본 정책 생성
    const createPolicies = `
      DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
      DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
      DROP POLICY IF EXISTS "Users can view their own settings" ON notification_settings;
      DROP POLICY IF EXISTS "Users can update their own settings" ON notification_settings;

      CREATE POLICY "Users can view their own notifications" ON notifications
        FOR SELECT USING (recipient_id = auth.uid());

      CREATE POLICY "Users can update their own notifications" ON notifications
        FOR UPDATE USING (recipient_id = auth.uid());

      CREATE POLICY "Users can view their own settings" ON notification_settings
        FOR SELECT USING (user_id = auth.uid());

      CREATE POLICY "Users can update their own settings" ON notification_settings
        FOR ALL USING (user_id = auth.uid());
    `;

    await supabase.rpc('exec_sql', { sql: createPolicies });

    console.log('✅ RLS policies set up');

    // 5. 인덱스 생성
    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON notifications(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_sender_id ON notifications(sender_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notification_settings_user_id ON notification_settings(user_id);
    `;

    await supabase.rpc('exec_sql', { sql: createIndexes });

    console.log('✅ Indexes created');
    console.log('🎉 Notification database setup completed successfully!');

    return { success: true };

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return { success: false, error: error.message };
  }
};

// 간단한 테이블 존재 확인 함수
export const checkNotificationTables = async () => {
  try {
    // 노티피케이션 테이블 존재 확인
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('count(*)')
      .limit(1);

    // 설정 테이블 존재 확인  
    const { data: settings, error: settingsError } = await supabase
      .from('notification_settings')
      .select('count(*)')
      .limit(1);

    const tablesExist = {
      notifications: !notifError,
      notification_settings: !settingsError
    };

    console.log('📊 Table existence check:', tablesExist);
    return tablesExist;

  } catch (error) {
    console.error('❌ Failed to check tables:', error);
    return { notifications: false, notification_settings: false };
  }
};