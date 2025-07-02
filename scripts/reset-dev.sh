#!/bin/bash

echo "🔄 Newton App - 완전 리셋 시작..."

# 1. 모든 관련 프로세스 종료
echo "📱 프로세스 종료 중..."
pkill -f "metro" 2>/dev/null || true
pkill -f "expo" 2>/dev/null || true
pkill -f "react-native" 2>/dev/null || true

# 2. 포트 해제
echo "🔓 포트 해제 중..."
lsof -ti:8081 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
lsof -ti:8082 | xargs kill -9 2>/dev/null || true
lsof -ti:19000 | xargs kill -9 2>/dev/null || true
lsof -ti:19001 | xargs kill -9 2>/dev/null || true

# 3. 캐시 완전 정리
echo "🗑️ 캐시 정리 중..."
npm cache clean --force 2>/dev/null || true
rm -rf .expo 2>/dev/null || true
rm -rf node_modules/.cache 2>/dev/null || true
rm -rf /tmp/metro-* 2>/dev/null || true

# 4. iOS 시뮬레이터 캐시 정리 (선택사항)
if command -v xcrun &> /dev/null; then
    echo "📱 iOS 시뮬레이터 정리..."
    xcrun simctl shutdown all 2>/dev/null || true
fi

# 5. Metro 캐시 리셋
echo "🚇 Metro 리셋..."
npx metro --reset-cache 2>/dev/null || true

echo "✅ 리셋 완료!"
echo ""
echo "🚀 이제 다음 명령어로 서버를 시작하세요:"
echo "   npm run start (포트 8082 사용)"
echo "   npm run ios"
echo ""
echo "💡 문제가 계속되면:"
echo "   - 터미널 재시작"
echo "   - npm run clean 실행"
echo "   - 다른 포트 사용: npx expo start --port 8083"