/**
 * Internationalization (i18n) System for Newton App
 * Supports: English (default), Korean, Japanese, Chinese
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Language codes
export const LANGUAGES = {
  EN: 'en',
  KO: 'ko', 
  JA: 'ja',
  ZH: 'zh'
};

// Language display names
export const LANGUAGE_NAMES = {
  [LANGUAGES.EN]: 'English',
  [LANGUAGES.KO]: '한국어',
  [LANGUAGES.JA]: '日本語', 
  [LANGUAGES.ZH]: '中文'
};

// Translation strings
const translations = {
  [LANGUAGES.EN]: {
    // Common
    common: {
      ok: 'OK',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      create: 'Create',
      search: 'Search',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      confirm: 'Confirm',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      close: 'Close'
    },

    // Navigation
    navigation: {
      home: 'Home',
      explore: 'Explore', 
      profile: 'Profile',
      settings: 'Settings',
      notes: 'Notes'
    },

    // Home Screen
    home: {
      title: 'My Notes',
      privateNotes: 'Private Notes',
      publicNotes: 'Public Notes',
      pinnedNotes: 'Pinned Notes',
      starredNotes: 'Starred Notes',
      recentNotes: 'Recent Notes',
      noNotes: 'No notes yet',
      createFirstNote: 'Create your first note',
      
      // Home Menu Options
      menu: {
        noteManagement: 'Note Management',
        noteSettings: 'Note Settings', 
        displaySettings: 'Display Settings',
        
        // Note Management
        createNewNote: 'Create New Note',
        sortNotes: 'Sort Notes',
        viewMode: 'View Mode',
        searchFilter: 'Search & Filter',
        
        // Sort Options
        sortByRecent: 'Recent',
        sortByTitle: 'Title',
        sortByModified: 'Modified',
        sortByCreated: 'Created',
        
        // View Modes
        listView: 'List View',
        cardView: 'Card View',
        compactView: 'Compact View',
        
        // Note Settings
        defaultTemplate: 'Default Note Template',
        autoSaveInterval: 'Auto-save Interval',
        backupSettings: 'Backup Settings',
        exportImport: 'Export/Import Notes',
        
        // Display Settings
        darkMode: 'Dark Mode',
        lightMode: 'Light Mode',
        fontSize: 'Font Size',
        previewLines: 'Preview Lines',
        colorTheme: 'Color Theme'
      }
    },

    // Profile Screen
    profile: {
      title: 'Profile',
      myProfile: 'My Profile',
      publicNotes: 'Public Notes',
      followers: 'Followers',
      following: 'Following',
      
      // Profile Settings
      settings: {
        title: 'Settings',
        language: 'Language',
        account: 'Account',
        privacy: 'Privacy',
        notifications: 'Notifications',
        about: 'About',
        
        // Language Settings
        languageSelection: 'Language Selection',
        selectLanguage: 'Select Language',
        
        // Account Settings
        logout: 'Logout',
        logoutConfirm: 'Are you sure you want to logout?',
        deleteAccount: 'Delete Account',
        changePassword: 'Change Password',
        
        // Privacy Settings
        publicProfile: 'Public Profile',
        showEmail: 'Show Email',
        allowMessages: 'Allow Messages'
      }
    },

    // Notes
    notes: {
      title: 'Title',
      content: 'Content',
      created: 'Created',
      modified: 'Modified',
      public: 'Public',
      private: 'Private',
      pinned: 'Pinned',
      starred: 'Starred',
      
      // Actions
      pin: 'Pin',
      unpin: 'Unpin',
      star: 'Star',
      unstar: 'Unstar',
      share: 'Share',
      duplicate: 'Duplicate',
      export: 'Export',
      
      // Placeholders
      titlePlaceholder: 'Note title',
      contentPlaceholder: 'Start writing your note...',
      searchPlaceholder: 'Search notes...'
    },

    // Alerts & Messages
    alerts: {
      noteDeleted: 'Note deleted successfully',
      noteSaved: 'Note saved',
      loginRequired: 'Login required',
      networkError: 'Network error occurred',
      permissionDenied: 'Permission denied',
      operationFailed: 'Operation failed'
    }
  },

  [LANGUAGES.KO]: {
    // Common
    common: {
      ok: '확인',
      cancel: '취소',
      save: '저장',
      delete: '삭제',
      edit: '편집',
      create: '생성',
      search: '검색',
      loading: '로딩 중...',
      error: '오류',
      success: '성공',
      confirm: '확인',
      back: '뒤로',
      next: '다음',
      done: '완료',
      close: '닫기'
    },

    // Navigation
    navigation: {
      home: '홈',
      explore: '탐색',
      profile: '프로필',
      settings: '설정',
      notes: '노트'
    },

    // Home Screen
    home: {
      title: '내 노트',
      privateNotes: '비공개 노트',
      publicNotes: '공개 노트',
      pinnedNotes: '고정된 노트',
      starredNotes: '즐겨찾기 노트',
      recentNotes: '최근 노트',
      noNotes: '노트가 없습니다',
      createFirstNote: '첫 번째 노트를 만들어보세요',
      
      // Home Menu Options
      menu: {
        noteManagement: '노트 관리',
        noteSettings: '노트 설정',
        displaySettings: '표시 설정',
        
        // Note Management
        createNewNote: '새 노트 작성',
        sortNotes: '노트 정렬',
        viewMode: '보기 모드',
        searchFilter: '검색 & 필터',
        
        // Sort Options
        sortByRecent: '최근 순',
        sortByTitle: '제목 순',
        sortByModified: '수정 순',
        sortByCreated: '생성 순',
        
        // View Modes
        listView: '목록 보기',
        cardView: '카드 보기',
        compactView: '컴팩트 보기',
        
        // Note Settings
        defaultTemplate: '기본 노트 템플릿',
        autoSaveInterval: '자동 저장 간격',
        backupSettings: '백업 설정',
        exportImport: '노트 내보내기/가져오기',
        
        // Display Settings
        darkMode: '다크 모드',
        lightMode: '라이트 모드',
        fontSize: '글꼴 크기',
        previewLines: '미리보기 줄 수',
        colorTheme: '색상 테마'
      }
    },

    // Profile Screen
    profile: {
      title: '프로필',
      myProfile: '내 프로필',
      publicNotes: '공개 노트',
      followers: '팔로워',
      following: '팔로잉',
      
      // Profile Settings
      settings: {
        title: '설정',
        language: '언어',
        account: '계정',
        privacy: '개인정보',
        notifications: '알림',
        about: '정보',
        
        // Language Settings
        languageSelection: '언어 선택',
        selectLanguage: '언어를 선택하세요',
        
        // Account Settings
        logout: '로그아웃',
        logoutConfirm: '정말 로그아웃 하시겠습니까?',
        deleteAccount: '계정 삭제',
        changePassword: '비밀번호 변경',
        
        // Privacy Settings
        publicProfile: '공개 프로필',
        showEmail: '이메일 표시',
        allowMessages: '메시지 허용'
      }
    },

    // Notes
    notes: {
      title: '제목',
      content: '내용',
      created: '생성됨',
      modified: '수정됨',
      public: '공개',
      private: '비공개',
      pinned: '고정됨',
      starred: '즐겨찾기',
      
      // Actions
      pin: '고정',
      unpin: '고정 해제',
      star: '즐겨찾기',
      unstar: '즐겨찾기 해제',
      share: '공유',
      duplicate: '복제',
      export: '내보내기',
      
      // Placeholders
      titlePlaceholder: '노트 제목',
      contentPlaceholder: '노트 작성을 시작하세요...',
      searchPlaceholder: '노트 검색...'
    },

    // Alerts & Messages
    alerts: {
      noteDeleted: '노트가 삭제되었습니다',
      noteSaved: '노트가 저장되었습니다',
      loginRequired: '로그인이 필요합니다',
      networkError: '네트워크 오류가 발생했습니다',
      permissionDenied: '권한이 거부되었습니다',
      operationFailed: '작업이 실패했습니다'
    }
  },

  [LANGUAGES.JA]: {
    // Common
    common: {
      ok: 'OK',
      cancel: 'キャンセル',
      save: '保存',
      delete: '削除',
      edit: '編集',
      create: '作成',
      search: '検索',
      loading: '読み込み中...',
      error: 'エラー',
      success: '成功',
      confirm: '確認',
      back: '戻る',
      next: '次へ',
      done: '完了',
      close: '閉じる'
    },

    // Navigation
    navigation: {
      home: 'ホーム',
      explore: '探索',
      profile: 'プロフィール',
      settings: '設定',
      notes: 'ノート'
    },

    // Home Screen
    home: {
      title: 'マイノート',
      privateNotes: 'プライベートノート',
      publicNotes: 'パブリックノート',
      pinnedNotes: 'ピン留めノート',
      starredNotes: 'お気に入りノート',
      recentNotes: '最近のノート',
      noNotes: 'ノートがありません',
      createFirstNote: '最初のノートを作成',
      
      // Home Menu Options
      menu: {
        noteManagement: 'ノート管理',
        noteSettings: 'ノート設定',
        displaySettings: '表示設定',
        
        // Note Management
        createNewNote: '新しいノート',
        sortNotes: 'ノートの並び替え',
        viewMode: '表示モード',
        searchFilter: '検索＆フィルター',
        
        // Sort Options
        sortByRecent: '最新順',
        sortByTitle: 'タイトル順',
        sortByModified: '更新順',
        sortByCreated: '作成順',
        
        // View Modes
        listView: 'リスト表示',
        cardView: 'カード表示',
        compactView: 'コンパクト表示',
        
        // Note Settings
        defaultTemplate: 'デフォルトテンプレート',
        autoSaveInterval: '自動保存間隔',
        backupSettings: 'バックアップ設定',
        exportImport: 'エクスポート/インポート',
        
        // Display Settings
        darkMode: 'ダークモード',
        lightMode: 'ライトモード',
        fontSize: 'フォントサイズ',
        previewLines: 'プレビュー行数',
        colorTheme: 'カラーテーマ'
      }
    },

    // Profile Screen
    profile: {
      title: 'プロフィール',
      myProfile: 'マイプロフィール',
      publicNotes: 'パブリックノート',
      followers: 'フォロワー',
      following: 'フォロー中',
      
      // Profile Settings
      settings: {
        title: '設定',
        language: '言語',
        account: 'アカウント',
        privacy: 'プライバシー',
        notifications: '通知',
        about: '情報',
        
        // Language Settings
        languageSelection: '言語選択',
        selectLanguage: '言語を選択',
        
        // Account Settings
        logout: 'ログアウト',
        logoutConfirm: 'ログアウトしますか？',
        deleteAccount: 'アカウント削除',
        changePassword: 'パスワード変更',
        
        // Privacy Settings
        publicProfile: 'パブリックプロフィール',
        showEmail: 'メールアドレス表示',
        allowMessages: 'メッセージ許可'
      }
    },

    // Notes
    notes: {
      title: 'タイトル',
      content: '内容',
      created: '作成日',
      modified: '更新日',
      public: 'パブリック',
      private: 'プライベート',
      pinned: 'ピン留め',
      starred: 'お気に入り',
      
      // Actions
      pin: 'ピン留め',
      unpin: 'ピン留め解除',
      star: 'お気に入り',
      unstar: 'お気に入り解除',
      share: '共有',
      duplicate: '複製',
      export: 'エクスポート',
      
      // Placeholders
      titlePlaceholder: 'ノートタイトル',
      contentPlaceholder: 'ノートを書き始めてください...',
      searchPlaceholder: 'ノート検索...'
    },

    // Alerts & Messages
    alerts: {
      noteDeleted: 'ノートが削除されました',
      noteSaved: 'ノートが保存されました',
      loginRequired: 'ログインが必要です',
      networkError: 'ネットワークエラーが発生しました',
      permissionDenied: '権限が拒否されました',
      operationFailed: '操作が失敗しました'
    }
  },

  [LANGUAGES.ZH]: {
    // Common
    common: {
      ok: '确定',
      cancel: '取消',
      save: '保存',
      delete: '删除',
      edit: '编辑',
      create: '创建',
      search: '搜索',
      loading: '加载中...',
      error: '错误',
      success: '成功',
      confirm: '确认',
      back: '返回',
      next: '下一步',
      done: '完成',
      close: '关闭'
    },

    // Navigation
    navigation: {
      home: '主页',
      explore: '探索',
      profile: '个人资料',
      settings: '设置',
      notes: '笔记'
    },

    // Home Screen
    home: {
      title: '我的笔记',
      privateNotes: '私人笔记',
      publicNotes: '公开笔记',
      pinnedNotes: '置顶笔记',
      starredNotes: '收藏笔记',
      recentNotes: '最近笔记',
      noNotes: '暂无笔记',
      createFirstNote: '创建您的第一个笔记',
      
      // Home Menu Options
      menu: {
        noteManagement: '笔记管理',
        noteSettings: '笔记设置',
        displaySettings: '显示设置',
        
        // Note Management
        createNewNote: '新建笔记',
        sortNotes: '笔记排序',
        viewMode: '视图模式',
        searchFilter: '搜索和筛选',
        
        // Sort Options
        sortByRecent: '最近',
        sortByTitle: '标题',
        sortByModified: '修改时间',
        sortByCreated: '创建时间',
        
        // View Modes
        listView: '列表视图',
        cardView: '卡片视图',
        compactView: '紧凑视图',
        
        // Note Settings
        defaultTemplate: '默认笔记模板',
        autoSaveInterval: '自动保存间隔',
        backupSettings: '备份设置',
        exportImport: '导出/导入笔记',
        
        // Display Settings
        darkMode: '深色模式',
        lightMode: '浅色模式',
        fontSize: '字体大小',
        previewLines: '预览行数',
        colorTheme: '颜色主题'
      }
    },

    // Profile Screen
    profile: {
      title: '个人资料',
      myProfile: '我的个人资料',
      publicNotes: '公开笔记',
      followers: '关注者',
      following: '关注中',
      
      // Profile Settings
      settings: {
        title: '设置',
        language: '语言',
        account: '账户',
        privacy: '隐私',
        notifications: '通知',
        about: '关于',
        
        // Language Settings
        languageSelection: '语言选择',
        selectLanguage: '选择语言',
        
        // Account Settings
        logout: '退出登录',
        logoutConfirm: '确定要退出登录吗？',
        deleteAccount: '删除账户',
        changePassword: '修改密码',
        
        // Privacy Settings
        publicProfile: '公开个人资料',
        showEmail: '显示邮箱',
        allowMessages: '允许消息'
      }
    },

    // Notes
    notes: {
      title: '标题',
      content: '内容',
      created: '创建',
      modified: '修改',
      public: '公开',
      private: '私人',
      pinned: '置顶',
      starred: '收藏',
      
      // Actions
      pin: '置顶',
      unpin: '取消置顶',
      star: '收藏',
      unstar: '取消收藏',
      share: '分享',
      duplicate: '复制',
      export: '导出',
      
      // Placeholders
      titlePlaceholder: '笔记标题',
      contentPlaceholder: '开始写您的笔记...',
      searchPlaceholder: '搜索笔记...'
    },

    // Alerts & Messages
    alerts: {
      noteDeleted: '笔记已删除',
      noteSaved: '笔记已保存',
      loginRequired: '需要登录',
      networkError: '网络错误',
      permissionDenied: '权限被拒绝',
      operationFailed: '操作失败'
    }
  }
};

// Create i18n store
export const useI18nStore = create(
  persist(
    (set, get) => ({
      currentLanguage: LANGUAGES.EN,
      
      setLanguage: (language) => {
        set({ currentLanguage: language });
      },
      
      t: (key) => {
        const { currentLanguage } = get();
        const keys = key.split('.');
        let translation = translations[currentLanguage];
        
        for (const k of keys) {
          if (translation && typeof translation === 'object') {
            translation = translation[k];
          } else {
            // Fallback to English if translation not found
            translation = translations[LANGUAGES.EN];
            for (const fallbackKey of keys) {
              if (translation && typeof translation === 'object') {
                translation = translation[fallbackKey];
              } else {
                return key; // Return key if no translation found
              }
            }
            break;
          }
        }
        
        return translation || key;
      }
    }),
    {
      name: 'newton-i18n-storage',
      storage: {
        getItem: async (name) => {
          const value = await AsyncStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: async (name, value) => {
          await AsyncStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: async (name) => {
          await AsyncStorage.removeItem(name);
        }
      }
    }
  )
);

// Hook for easy translation access
export const useTranslation = () => {
  const { t, currentLanguage, setLanguage } = useI18nStore();
  
  return {
    t,
    currentLanguage,
    setLanguage,
    languages: LANGUAGES,
    languageNames: LANGUAGE_NAMES
  };
};

export default {
  useTranslation,
  useI18nStore,
  LANGUAGES,
  LANGUAGE_NAMES
};