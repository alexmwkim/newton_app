# KeyboardAwareScrollView Implementation Plan

## Current Issues
- Manual scroll calculations are unreliable
- Complex position estimations often incorrect
- Throttling causes missed scroll events
- Screen dimension calculations inaccurate

## Implementation Steps

### 1. Install Dependency
```bash
npm install react-native-keyboard-aware-scroll-view
```

### 2. Replace ScrollView in NoteDetailScreen.js

**Current ScrollView (lines 736-769):**
```javascript
<ScrollView
  ref={scrollRef}
  contentContainerStyle={[styles.scrollContent, {
    paddingBottom: 300,
    minHeight: 1200
  }]}
  keyboardShouldPersistTaps="handled"
  // ... other props
>
```

**Replace with KeyboardAwareScrollView:**
```javascript
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

<KeyboardAwareScrollView
  ref={scrollRef}
  contentContainerStyle={[styles.scrollContent, {
    paddingBottom: 300,
    minHeight: 1200
  }]}
  // Industry standard keyboard props
  enableAutomaticScroll={true}
  enableResetScrollToCoords={false}
  extraScrollHeight={Platform.OS === 'ios' ? 50 : 80}
  keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
  keyboardShouldPersistTaps="handled"
  keyboardDismissMode="none"
  enableOnAndroid={true}
  // Preserve existing props
  nestedScrollEnabled={false}
  removeClippedSubviews={false}
  scrollEnabled={(() => {
    const isEnabled = !dragGuideline.visible && dragMode === 'none' && !preventAutoScroll;
    if (preventAutoScroll) {
      console.log('📍 🚫 Scroll disabled to prevent TextInput auto-scroll');
    }
    return isEnabled;
  })()}
  showsVerticalScrollIndicator={true}
  automaticallyAdjustContentInsets={false}
  onTouchStart={() => {
    dismissMenus();
  }}
  scrollEventThrottle={16}
>
```

### 3. Simplify useKeyboardHandlers.js

Remove manual scroll calculations and just track keyboard state:

```javascript
export const useKeyboardHandlers = (focusedIndexRef, blocksRef, scrollRef, titleInputRef, cardLayoutsRef) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Simple keyboard event handling - no manual scrolling
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setKeyboardVisible(true);
        setKeyboardHeight(event.endCoordinates.height);
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Simple no-op function since KeyboardAwareScrollView handles scrolling
  const scrollToFocusedInput = useCallback(() => {
    // KeyboardAwareScrollView handles this automatically
  }, []);

  return {
    keyboardVisible,
    keyboardHeight,
    scrollToFocusedInput
  };
};
```

### 4. Update noteUtils.js

Remove manual keyboard config and use simpler approach:

```javascript
// Remove getKeyboardAwareConfig function - not needed
// KeyboardAwareScrollView has built-in defaults
```

### 5. Benefits of KeyboardAwareScrollView

1. **Automatic Scrolling**: Automatically scrolls to focused TextInput
2. **Cross-Platform**: Works consistently on iOS and Android
3. **Industry Standard**: Used by thousands of React Native apps
4. **Less Code**: Eliminates manual position calculations
5. **Better Reliability**: Tested across many devices and scenarios

### 6. Configuration Options

The KeyboardAwareScrollView can be fine-tuned with these props:

- `extraScrollHeight`: Additional scroll offset (default: 75)
- `keyboardVerticalOffset`: Offset for navigation bars
- `enableAutomaticScroll`: Enable/disable automatic scrolling
- `enableResetScrollToCoords`: Reset scroll position after keyboard hides

### 7. Compatibility

- ✅ Maintains all existing ScrollView functionality
- ✅ Works with existing drag/drop logic
- ✅ Preserves touch handling and menu dismissal
- ✅ Compatible with existing style and layout code