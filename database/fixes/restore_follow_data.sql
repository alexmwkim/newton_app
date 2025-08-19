-- Newton App Follow Data Restoration
-- David Lee → Alex Kim 팔로우 관계 복원

-- 1. 현재 팔로우 데이터 확인
SELECT follower_id, following_id, created_at 
FROM follows 
WHERE follower_id = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22' 
   OR following_id = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22'
   OR follower_id = '10663749-9fba-4039-9f22-d6e7add9ea2d'
   OR following_id = '10663749-9fba-4039-9f22-d6e7add9ea2d';

-- 2. David Lee → Alex Kim 팔로우 관계 생성
INSERT INTO follows (follower_id, following_id, created_at)
VALUES ('e7cc75eb-9ed4-42b9-95d6-88ff615aac22', '10663749-9fba-4039-9f22-d6e7add9ea2d', NOW())
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- 3. 결과 확인
SELECT follower_id, following_id, created_at 
FROM follows 
WHERE (follower_id = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22' AND following_id = '10663749-9fba-4039-9f22-d6e7add9ea2d')
   OR (follower_id = '10663749-9fba-4039-9f22-d6e7add9ea2d' AND following_id = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22');

-- 4. 각 사용자의 팔로우 카운트 확인
SELECT 
  'David Lee Following' as label,
  COUNT(*) as count
FROM follows 
WHERE follower_id = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22'

UNION ALL

SELECT 
  'David Lee Followers' as label,
  COUNT(*) as count
FROM follows 
WHERE following_id = 'e7cc75eb-9ed4-42b9-95d6-88ff615aac22'

UNION ALL

SELECT 
  'Alex Kim Following' as label,
  COUNT(*) as count
FROM follows 
WHERE follower_id = '10663749-9fba-4039-9f22-d6e7add9ea2d'

UNION ALL

SELECT 
  'Alex Kim Followers' as label,
  COUNT(*) as count
FROM follows 
WHERE following_id = '10663749-9fba-4039-9f22-d6e7add9ea2d';