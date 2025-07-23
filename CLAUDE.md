# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Newton is a mobile note-taking application concept based on Korean project documentation. The project is currently in the planning and documentation phase, with no active codebase yet.

**Tech Stack Planned:**
- Frontend: React Native + Expo
- Backend: Supabase (PostgreSQL-based)
- UI Library: NativeWind, React Native Paper
- Markdown: react-native-markdown-display
- Authentication: Supabase Auth
- State Management: Zustand or Redux Toolkit

## Project Structure (Current)

The repository contains documentation, planning files, design assets, and UI mockups:

```
newton_app/
├── CLAUDE.md                    # This guidance file
├── Docs/                       # Empty documentation folder
├── PRDs/                       # Product Requirements Documents
│   ├── mobile_app_execution_plan.md
│   ├── newton_app_styleGuide.rtf    # Design system specifications
│   ├── newtonapp_opensource_prd.rtf
│   ├── newtonapp_overview_dev_process.rtf
│   ├── newtonapp_apidesign_architecturestate.rtf
│   └── newtonapp_supabase_table_architecture.rtf
├── Rules/                      # Empty rules folder
├── assets/                     # Brand assets
│   └── logo/                   # Newton logo variants
│       ├── logo_bk copy/       # Black logo versions
│       └── logo_white copy/    # White logo versions
└── ui_screenshots/             # UI mockup screens
    ├── home.svg
    ├── explore.svg
    ├── profile(me)_profile(user).svg
    ├── home_PrivateNoteDetailPage.svg
    ├── home_PrivateNote_CreateNewNote.svg
    ├── home_PublicNoteDetailPage.svg
    └── home_PublicNote_CreateNewNote.svg
```

**Planned App Structure (when development starts):**
```
src/
├── screens/           # Page components
├── components/        # Reusable UI components
├── services/          # Supabase API calls
├── stores/            # Zustand/Context state management
├── navigation/        # Stack, Tab navigation setup
├── utils/             # Utility functions, formatters
└── assets/            # Icons, images
```

## Core Features (Planned)

- **Personal Notes:** Private note creation and management
- **Public Notes:** Shareable notes with fork functionality
- **Note Editor:** Markdown-based rich text editing
- **Search:** Full-text search across personal and public notes
- **Explore:** Discover trending and recent public notes
- **Profile:** User profile with public note portfolio
- **Fork System:** Copy and modify other users' public notes

## Design System & Branding

**Brand Identity:**
- **Logo:** Clean, minimalist design with curved/swirl elements representing thought and creativity
- **Slogan:** "make good new days" - emphasizing positive daily progress through note-taking
- **Design Philosophy:** Minimalist, warm, and approachable

**Color Palette (from style guide):**
- **Primary Colors:**
  - Black: `#000000` (primary text, icons)
  - White: `#FFFFFF` (inverse text, backgrounds)
  - Warm Gray: `#A6A29D` (secondary text)
- **Accent Colors:**
  - Floating Button: `#EB754B` (orange-red for action elements)
- **Background Colors:**
  - Note Cards: `#F8F6F3` (off-white for cards and borders)
- **Interactive States:**
  - Icon Active: `#000000` (black)
  - Icon Inactive: `#D4CCC2` (light gray)

**Typography:**
- **English Text:** Avenir Next
- **Korean Text:** Noto Sans KR
- **Text Colors:** Black (`#000000`), Gray (`#A6A29D`), White (`#FFFFFF`)

**UI Components:**
- **Border Radius:** 10px standard for all rounded elements
- **Icons:** Feather Icons library
- **Cards:** Off-white background (`#F8F6F3`) with 10px border radius
- **Buttons:** Orange-red floating action buttons (`#EB754B`)

## UI Mockups Available

The repository includes comprehensive UI mockups showing:
- **Home Screen:** Private/public note lists with toggle functionality
- **Explore Screen:** Social feed for discovering public notes
- **Profile Screen:** User profile with public note portfolio
- **Note Detail Pages:** Both private and public note viewing
- **Note Creation:** Markdown editor interfaces

## Development Commands

**Basic Development:**
```bash
# Start development server
npm start
# or
npx expo start

# Start with iOS Simulator
npm run ios
# or
npx expo start --ios

# Clear Metro cache if issues occur
npm run clear
# or
npx expo start --clear
```

**🔧 Development Server Connection Issues - SOLUTION:**

**Problem:** "Could not connect to development server" error
**Root Causes:** 
- Multiple Expo processes running simultaneously
- Port conflicts (8081/8082)
- Metro bundler cache corruption
- Network connectivity issues

**SOLUTION STEPS (memorized for future use):**
1. **Stop all processes:** `pkill -f "expo start" && pkill -f "metro"`
2. **Clear caches:** `npm cache clean --force`
3. **Remove Metro cache:** `rm -rf node_modules/.cache`
4. **Restart with clear cache:** `npx expo start --clear --ios`

**Quick Fix Script:**
```bash
# Run the automated fix script
./scripts/dev-server-fix.sh
```

**Prevention (metro.config.js configured):**
- Fixed port: 8081
- Enhanced stability settings
- Disabled problematic symlinks
- Proper cache management

**Troubleshooting Commands:**
```bash
# If Metro bundler timeout occurs
npm cache clean --force
rm -rf node_modules/.cache
npx expo start --clear

# If npm cache permission issues
export NPM_CONFIG_CACHE=/tmp/npm-cache && npm install

# Check for running processes
ps aux | grep -E "(expo|metro|node)" | grep -v grep

# Manual process cleanup
pkill -f "expo start"
pkill -f "metro"
```

## Development Approach (When Started)

Since this is a mobile-first React Native + Expo project:

1. **Setup Commands:**
   - `npx create-expo-app --template`
   - `npm install @supabase/supabase-js`
   - `npm install react-native-markdown-display`
   - `npm install react-native-vector-icons` (for Feather Icons)

2. **Key Development Priorities:**
   - Implement design system from style guide first
   - Start with basic note CRUD operations
   - Implement Supabase authentication
   - Build core UI components following mockups
   - Add social features (fork, explore) later

3. **Architecture Notes:**
   - Use Supabase for backend (auth, database, real-time)
   - Implement offline-first with local SQLite sync
   - Follow React Native best practices for navigation
   - Use TypeScript for type safety
   - Implement design system with exact colors and typography from style guide

## Common Issues & Solutions

### Metro Bundler Timeout
**Problem:** `Command timed out after 45s` when running `npx expo start --ios`

**Root Causes:**
- Metro bundler taking too long to compile large codebases
- Cache corruption or permission issues
- Network connectivity to Expo servers
- iOS Simulator not responding properly

**Solutions Applied:**
1. Created `metro.config.js` with optimized settings
2. Added `.watchmanconfig` to ignore unnecessary directories  
3. Extended server timeout to 2 minutes
4. Added npm cache workaround for permission issues

**Prevention:**
- Use `npx expo start --clear` periodically to clear cache
- Run `npm cache clean --force` if persistent issues
- Check iOS Simulator is running before starting Expo

### Build and Configuration Timeout Issues
- **Observed Issue:** Command timeout during npm/Expo build processes
- **Specific Problem:** Hermes engine configuration scripts repeatedly running
- **Recommended Mitigation:**
  - Configure script phases to have specific output dependencies
  - Uncheck "Based on dependency analysis" for repetitive script phases
  - Use `--force` flag with caution, as it disables recommended protections
  - Monitor build logs for repeated configuration steps

## Dev Environment Tips

- **Simulator Management Tips:**
  - Do not reset the simulator when you've any work done. Use two different terminals to manage the metro server and simulator.

## Current Status

**✅ COMPLETED:** Newton iOS mobile app has been fully implemented with React Native + Expo.

**Current Implementation Status:**
- ✅ Complete React Native Expo project setup
- ✅ Design system implementation (exact colors, typography from style guide)
- ✅ All main screens: Home, Explore, Profile, Note Detail, Create Note
- ✅ Custom navigation system with proper routing
- ✅ UI matching provided screenshots exactly
- ✅ Notion-like rich text editor with formatting tools
- ✅ Auto-keyboard focus and touch-anywhere-to-edit functionality
- ✅ Private/Public note toggle with icons
- ✅ Note cards with author avatars and fork counts
- ✅ Working iOS Simulator deployment

**Last Successfully Tested:** iOS Simulator with iPhone 15 - app bundled (683 modules) and running with all features functional.

## Next Development Steps

**Frontend (Completed):**
- ✅ All UI screens and components implemented
- ✅ Navigation and user interactions working
- ✅ Rich text editor with Notion-like features

**Backend (To Do):**
1. Set up Supabase project and database schema
2. Implement authentication (email/social login)
3. Connect frontend to real database (currently using mock data)
4. Add real-time collaboration features
5. Implement note sharing and fork functionality

**Deployment (To Do):**
1. Configure app.json for App Store submission
2. Set up Expo EAS build for production
3. Test on physical devices
4. Submit to App Store

## Notes for Development

- The Korean documentation indicates this is inspired by Notion and GitHub's approach to public/private content
- Target is a 6-12 week MVP development timeline
- Focus on mobile-first design with potential web expansion later
- Emphasis on clean, reusable component architecture
- **Design Assets:** Use provided logos (black/white variants) and follow exact UI mockups
- **Style Implementation:** Reference `PRDs/newton_app_styleGuide.rtf` for precise color codes, typography, and component specifications
- **UI Reference:** Use `ui_screenshots/` folder for exact screen layouts and interactions
- **Accessibility:** Follow style guide accessibility considerations (contrast ratios, alt text, screen reader support)

## Development Workflow Notes

- **CLI Command Guideline:**
  - Do not run `npx expo start --ios --port 8082` without explicit request
  - Manage development server commands carefully to avoid port conflicts

## Supabase Configuration Notes

- **Strict Supabase Policy:**
  - 절대 비활성화 시키지마 supabase