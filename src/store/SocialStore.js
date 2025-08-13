import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SocialService from '../services/social';
import { supabase } from '../services/supabase';
import popularAuthorsAlgorithm from '../utils/PopularAuthorsAlgorithm';

export const useSocialStore = create()(
  persist(
    (set, get) => ({
      // 소셜 상태
      feed: [],
      starredNotes: [],
      forkedNotes: [],
      popularAuthors: [],
      notifications: [],
      unreadNotificationCount: 0,
      
      // 로딩 상태
      feedLoading: false,
      starredLoading: false,
      forkedLoading: false,
      
      // 페이지네이션
      feedOffset: 0,
      feedHasMore: true,
      
      // 캐시된 소셜 데이터
      noteStarStatus: {}, // noteId -> boolean
      noteForkStatus: {}, // noteId -> boolean
      noteSocialCounts: {}, // noteId -> { stars, forks }

      // 피드 관련 액션
      loadFeed: async (userId, refresh = false) => {
        const { feedOffset, feedHasMore } = get();
        
        if (!refresh && !feedHasMore) return;
        
        const offset = refresh ? 0 : feedOffset;
        set({ feedLoading: true });
        
        try {
          console.log('🔄 Loading activity feed for user:', userId, 'offset:', offset, 'refresh:', refresh);
          const { data, error } = await SocialService.getActivityFeed(userId, 20, offset);
          
          if (error) {
            console.error('❌ Feed load error:', error);
            set({
              feed: [],
              feedLoading: false,
              feedHasMore: false
            });
            return;
          }
          
          console.log('✅ Feed loaded successfully:', data?.length || 0, 'notes');
          console.log('📋 First note in feed:', data?.[0] ? { 
            id: data[0].id, 
            title: data[0].title, 
            user_id: data[0].user_id,
            profiles: data[0].profiles
          } : 'No notes');
          
          set(state => ({
            feed: refresh ? (data || []) : [...state.feed, ...(data || [])],
            feedOffset: offset + (data?.length || 0),
            feedHasMore: (data?.length || 0) === 20,
            feedLoading: false,
          }));
        } catch (error) {
          console.error('❌ Feed load error:', error);
          set({
            feed: [],
            feedLoading: false,
            feedHasMore: false
          });
        }
      },

      refreshFeed: async (userId) => {
        const { loadFeed } = get();
        await loadFeed(userId, true);
      },

      // 별표 관련 액션
      starNote: async (noteId, userId) => {
        try {
          // 낙관적 업데이트
          set(state => ({
            noteStarStatus: { ...state.noteStarStatus, [noteId]: true },
            noteSocialCounts: {
              ...state.noteSocialCounts,
              [noteId]: {
                ...state.noteSocialCounts[noteId],
                stars: (state.noteSocialCounts[noteId]?.stars || 0) + 1
              }
            }
          }));

          const { data, error } = await SocialService.starNote(noteId, userId);
          
          if (error) {
            // 롤백
            set(state => ({
              noteStarStatus: { ...state.noteStarStatus, [noteId]: false },
              noteSocialCounts: {
                ...state.noteSocialCounts,
                [noteId]: {
                  ...state.noteSocialCounts[noteId],
                  stars: Math.max((state.noteSocialCounts[noteId]?.stars || 0) - 1, 0)
                }
              }
            }));
            throw new Error(error);
          }

          return data;
        } catch (error) {
          console.error('Star note error:', error);
          throw error;
        }
      },

      unstarNote: async (noteId, userId) => {
        try {
          // 낙관적 업데이트
          set(state => ({
            noteStarStatus: { ...state.noteStarStatus, [noteId]: false },
            noteSocialCounts: {
              ...state.noteSocialCounts,
              [noteId]: {
                ...state.noteSocialCounts[noteId],
                stars: Math.max((state.noteSocialCounts[noteId]?.stars || 0) - 1, 0)
              }
            }
          }));

          const { data, error } = await SocialService.unstarNote(noteId, userId);
          
          if (error) {
            // 롤백
            set(state => ({
              noteStarStatus: { ...state.noteStarStatus, [noteId]: true },
              noteSocialCounts: {
                ...state.noteSocialCounts,
                [noteId]: {
                  ...state.noteSocialCounts[noteId],
                  stars: (state.noteSocialCounts[noteId]?.stars || 0) + 1
                }
              }
            }));
            throw new Error(error);
          }

          return data;
        } catch (error) {
          console.error('Unstar note error:', error);
          throw error;
        }
      },

      // 포크 관련 액션
      forkNote: async (noteId, userId) => {
        try {
          const { data, error } = await SocialService.forkNote(noteId, userId);
          
          if (error) {
            throw new Error(error);
          }

          // 포크 상태 업데이트
          set(state => ({
            noteForkStatus: { ...state.noteForkStatus, [noteId]: true },
            noteSocialCounts: {
              ...state.noteSocialCounts,
              [noteId]: {
                ...state.noteSocialCounts[noteId],
                forks: (state.noteSocialCounts[noteId]?.forks || 0) + 1
              }
            }
          }));

          return data;
        } catch (error) {
          console.error('Fork note error:', error);
          throw error;
        }
      },

      // 사용자의 별표/포크 상태 로드
      loadUserStarredNotes: async (userId) => {
        set({ starredLoading: true });
        try {
          // TODO: SocialService에 getUserStarredNotes 메서드 추가 필요
          // const { data, error } = await SocialService.getUserStarredNotes(userId);
          // if (!error) {
          //   set({ starredNotes: data });
          // }
          set({ starredLoading: false });
        } catch (error) {
          console.error('Load starred notes error:', error);
          set({ starredLoading: false });
        }
      },

      loadUserForkedNotes: async (userId) => {
        set({ forkedLoading: true });
        try {
          const { data, error } = await SocialService.getUserForks(userId);
          if (!error) {
            set({ forkedNotes: data });
          }
          set({ forkedLoading: false });
        } catch (error) {
          console.error('Load forked notes error:', error);
          set({ forkedLoading: false });
        }
      },

      // 노트의 소셜 상태 확인
      checkNoteSocialStatus: async (noteId, userId) => {
        try {
          const { data, error } = await SocialService.getNoteWithSocialInfo(noteId, userId);
          
          if (!error && data) {
            set(state => ({
              noteStarStatus: { ...state.noteStarStatus, [noteId]: data.isStarred },
              noteForkStatus: { ...state.noteForkStatus, [noteId]: data.isForked },
              noteSocialCounts: {
                ...state.noteSocialCounts,
                [noteId]: {
                  stars: data.star_count || 0,
                  forks: data.fork_count || 0
                }
              }
            }));
          }
        } catch (error) {
          console.error('Check note social status error:', error);
        }
      },

      // 인기 작성자 로드 (개선된 알고리즘 사용)
      loadPopularAuthors: async () => {
        try {
          console.log('🔄 Loading popular authors with enhanced algorithm...');
          
          // 1. 모든 프로필 가져오기
          const { data: allProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, user_id, username, avatar_url, bio, created_at')
            .order('created_at', { ascending: true });
            
          if (profilesError || !allProfiles) {
            console.error('❌ Failed to load profiles:', profilesError);
            set({ popularAuthors: [] });
            return;
          }
          
          // 2. 각 작성자의 데이터 수집 및 인기도 점수 계산
          const authorsWithData = await Promise.all(
            allProfiles.map(async (author) => {
              try {
                console.log(`📊 Processing author: ${author.username}`);
                
                // 작성자의 모든 노트 가져오기
                const { data: authorNotes, error: notesError } = await supabase
                  .from('notes')
                  .select('id, title, content, is_public, created_at')
                  .eq('user_id', author.user_id);
                
                const notes = notesError ? [] : (authorNotes || []);
                
                // 임시 소셜 통계 생성 (실제 데이터가 구현될 때까지)
                const socialStats = popularAuthorsAlgorithm.generateMockSocialStats(
                  author, 
                  notes.filter(n => n.is_public).length
                );
                
                // 임시 팔로워 수 추가 (실제 데이터가 구현될 때까지)
                const enhancedAuthor = {
                  ...author,
                  follower_count: Math.floor(Math.random() * 50) + 5, // 5-55 임시값
                  verified: Math.random() > 0.8 // 20% 확률로 인증
                };
                
                return {
                  author: enhancedAuthor,
                  notes,
                  socialStats
                };
                
              } catch (error) {
                console.error(`Error processing author ${author.username}:`, error);
                return {
                  author,
                  notes: [],
                  socialStats: { totalStars: 0, totalForks: 0, totalViews: 0, totalComments: 0 }
                };
              }
            })
          );
          
          // 3. 인기도 알고리즘으로 정렬
          console.log('🧮 Calculating popularity scores...');
          const sortedAuthors = popularAuthorsAlgorithm.sortAuthorsByPopularity(authorsWithData);
          
          // 4. 추가 정보와 함께 결과 포맷팅
          const finalAuthors = sortedAuthors.map(author => ({
            ...author,
            publicNotesCount: author.debug_info.public_note_count,
            // 기존 호환성을 위해 추가
            note_count: author.debug_info.note_count,
            public_notes: author.debug_info.public_note_count
          }));
          
          console.log('✅ Popular authors ranked by algorithm:');
          finalAuthors.forEach((author, index) => {
            console.log(`${index + 1}. ${author.username} - Score: ${author.popularity_score.toFixed(1)}`, author.debug_info);
          });
          
          set({ popularAuthors: finalAuthors });
          
        } catch (error) {
          console.error('❌ Popular authors load error:', error.message);
          set({ popularAuthors: [] });
        }
      },

      // 알림 관련 액션
      addNotification: (notification) => {
        set(state => ({
          notifications: [notification, ...state.notifications],
          unreadNotificationCount: state.unreadNotificationCount + 1,
        }));
      },

      markNotificationAsRead: (notificationId) => {
        set(state => ({
          notifications: state.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          ),
          unreadNotificationCount: Math.max(state.unreadNotificationCount - 1, 0),
        }));
      },

      markAllNotificationsAsRead: () => {
        set(state => ({
          notifications: state.notifications.map(notif => ({ ...notif, read: true })),
          unreadNotificationCount: 0,
        }));
      },

      // 실시간 구독 관리
      subscriptions: {},
      
      subscribeToNoteSocial: (noteId) => {
        const { subscriptions } = get();
        
        if (subscriptions[noteId]) {
          return subscriptions[noteId];
        }

        const subscription = SocialService.subscribeToSocialActivity(noteId, (type, payload) => {
          const { addNotification } = get();
          
          // 실시간 업데이트 처리
          if (type === 'star') {
            if (payload.eventType === 'INSERT') {
              set(state => ({
                noteSocialCounts: {
                  ...state.noteSocialCounts,
                  [noteId]: {
                    ...state.noteSocialCounts[noteId],
                    stars: (state.noteSocialCounts[noteId]?.stars || 0) + 1
                  }
                }
              }));
              
              addNotification({
                id: Date.now().toString(),
                type: 'star',
                message: 'Someone starred your note!',
                noteId,
                read: false,
                createdAt: new Date().toISOString(),
              });
            } else if (payload.eventType === 'DELETE') {
              set(state => ({
                noteSocialCounts: {
                  ...state.noteSocialCounts,
                  [noteId]: {
                    ...state.noteSocialCounts[noteId],
                    stars: Math.max((state.noteSocialCounts[noteId]?.stars || 0) - 1, 0)
                  }
                }
              }));
            }
          } else if (type === 'fork') {
            if (payload.eventType === 'INSERT') {
              set(state => ({
                noteSocialCounts: {
                  ...state.noteSocialCounts,
                  [noteId]: {
                    ...state.noteSocialCounts[noteId],
                    forks: (state.noteSocialCounts[noteId]?.forks || 0) + 1
                  }
                }
              }));
              
              addNotification({
                id: Date.now().toString(),
                type: 'fork',
                message: 'Someone forked your note!',
                noteId,
                read: false,
                createdAt: new Date().toISOString(),
              });
            }
          }
        });

        set(state => ({
          subscriptions: { ...state.subscriptions, [noteId]: subscription }
        }));

        return subscription;
      },

      unsubscribeFromNoteSocial: (noteId) => {
        const { subscriptions } = get();
        const subscription = subscriptions[noteId];
        
        if (subscription) {
          subscription.unsubscribe();
          set(state => {
            const newSubscriptions = { ...state.subscriptions };
            delete newSubscriptions[noteId];
            return { subscriptions: newSubscriptions };
          });
        }
      },

      // 초기화
      clearSocialData: () => {
        set({
          feed: [],
          starredNotes: [],
          forkedNotes: [],
          popularAuthors: [],
          notifications: [],
          unreadNotificationCount: 0,
          noteStarStatus: {},
          noteForkStatus: {},
          noteSocialCounts: {},
          feedOffset: 0,
          feedHasMore: true,
        });
      },

      // 유틸리티 함수들
      isNoteStarred: (noteId) => {
        const { noteStarStatus } = get();
        return noteStarStatus[noteId] || false;
      },

      isNoteForked: (noteId) => {
        const { noteForkStatus } = get();
        return noteForkStatus[noteId] || false;
      },

      getNoteSocialCounts: (noteId) => {
        const { noteSocialCounts } = get();
        return noteSocialCounts[noteId] || { stars: 0, forks: 0 };
      },
    }),
    {
      name: 'social-storage',
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
        },
      },
      // 일부 실시간 데이터는 지속화하지 않음
      partialize: (state) => ({
        starredNotes: state.starredNotes,
        forkedNotes: state.forkedNotes,
        popularAuthors: state.popularAuthors,
        notifications: state.notifications,
        unreadNotificationCount: state.unreadNotificationCount,
        noteStarStatus: state.noteStarStatus,
        noteForkStatus: state.noteForkStatus,
        noteSocialCounts: state.noteSocialCounts,
      }),
    }
  )
);