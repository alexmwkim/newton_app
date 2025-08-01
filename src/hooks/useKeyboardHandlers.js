import { useState, useEffect, useCallback, useRef } from 'react';
import { Keyboard, Platform, Dimensions } from 'react-native';

export const useKeyboardHandlers = (focusedIndex, blocks, scrollRef, titleInputRef) => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [keyboardScreenY, setKeyboardScreenY] = useState(0);
  const isTyping = useRef(false);
  const lastScrollTime = useRef(0);
  const preventNextScroll = useRef(false);

  // Handle keyboard events and auto-scroll
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', 
      (event) => {
        const keyboardHeight = event.endCoordinates.height;
        const screenHeight = event.endCoordinates.screenY;
        console.log('🎹 Keyboard event details:', {
          keyboardHeight,
          screenHeight,
          screenY: event.endCoordinates.screenY,
          endCoordinates: event.endCoordinates
        });
        setKeyboardVisible(true);
        setKeyboardHeight(keyboardHeight);
        setKeyboardScreenY(event.endCoordinates.screenY);
        
        // Only scroll if input might be hidden by keyboard (more conservative)
        // Let KeyboardAvoidingView handle most cases
        if (keyboardHeight > 300) { // Only for larger keyboards
          setTimeout(() => {
            console.log('🎹 Large keyboard detected, checking if scroll needed...');
            // scrollToFocusedInput(keyboardHeight, true); // Disabled - let KeyboardAvoidingView handle
          }, Platform.OS === 'ios' ? 300 : 350);
        }
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        console.log('🎹 Keyboard hidden');
        setKeyboardVisible(false);
        setKeyboardHeight(0);
        setKeyboardScreenY(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, [focusedIndex, blocks]);

  // Minimal auto-scroll - only when absolutely necessary
  const scrollToFocusedInput = useCallback((keyboardHeight, forceScroll = false) => {
    console.log('📜 scrollToFocusedInput called - but DISABLED for stability');
    return; // Completely disable automatic scrolling
    
    // if (!scrollRef.current || focusedIndex < -1 || keyboardHeight <= 0) return;
    // 
    // // Check if scroll should be prevented due to content size change
    // if (preventNextScroll.current && !forceScroll) {
    //   console.log('📜 Scroll prevented - content size change detected');
    //   preventNextScroll.current = false;
    //   return;
    // }
    // 
    // // Prevent frequent scrolling during typing (reduced threshold for more responsive scrolling)
    // const now = Date.now();
    // if (!forceScroll && now - lastScrollTime.current < 500) {
    //   console.log('📜 Scroll throttled - too frequent');
    //   return;
    // }
    
    console.log('📜 === ENHANCED AUTO-SCROLL START ===');
    console.log('📜 focusedIndex:', focusedIndex, 'keyboardHeight:', keyboardHeight, 'forceScroll:', forceScroll);
    
    // Get the focused input element
    let targetRef = null;
    if (focusedIndex === -1) {
      targetRef = titleInputRef.current;
      console.log('📜 Target: Title input');
    } else {
      const focusedBlock = blocks[focusedIndex];
      if (!focusedBlock?.ref?.current) {
        console.log('📜 No focused block ref found');
        return;
      }
      targetRef = focusedBlock.ref.current;
      console.log('📜 Target: Block', focusedIndex, 'type:', focusedBlock.type);
    }
    
    if (!targetRef) {
      console.log('📜 No target ref found');
      return;
    }
    
    // Single measurement attempt with proper delay
    setTimeout(() => {
      targetRef.measureInWindow((x, y, width, height) => {
        const screenHeight = Dimensions.get('window').height;
        
        console.log('📐 Measurement:', {
          screenHeight,
          inputPosition: { x, y, width, height },
          keyboardHeight
        });
        
        // More accurate calculation for consistent behavior
        const headerHeight = 80; // Header area
        const toolbarHeight = Platform.OS === 'ios' ? 50 : 60;
        const safePadding = 80; // Generous padding for comfortable typing
        const totalBlockedHeight = keyboardHeight + toolbarHeight + safePadding;
        const availableScreenHeight = screenHeight - totalBlockedHeight - headerHeight;
        
        // Adjust input position relative to header
        const adjustedInputY = y - headerHeight;
        const inputBottom = adjustedInputY + height;
        
        console.log('📐 Enhanced Calculation:', {
          screenHeight,
          headerHeight,
          toolbarHeight,
          keyboardHeight,
          totalBlockedHeight,
          availableScreenHeight,
          rawInputY: y,
          adjustedInputY,
          inputHeight: height,
          inputBottom,
          needsScroll: inputBottom > availableScreenHeight
        });
        
        // Check if input is blocked by keyboard area with consistent logic
        if (inputBottom > availableScreenHeight || adjustedInputY < 0) {
          // Update last scroll time
          lastScrollTime.current = Date.now();
          
          // Get current scroll offset and calculate optimal position
          scrollRef.current.scrollTo({
            y: Math.max(0, adjustedInputY - (availableScreenHeight * 0.3)), // Position input at 30% from top
            animated: true
          });
          
          console.log('✅ Scrolling to optimal position for input visibility');
        } else {
          console.log('✅ Input is already visible - no scroll needed');
        }
      });
    }, 100); // Single attempt with delay
    
    console.log('📜 === ENHANCED AUTO-SCROLL END ===');
  }, [focusedIndex, blocks, scrollRef, titleInputRef]);

  // Function to prevent next auto-scroll (for content size changes)
  const preventNextAutoScroll = useCallback(() => {
    preventNextScroll.current = true;
    // Auto-reset after a short delay
    setTimeout(() => {
      preventNextScroll.current = false;
    }, 500);
  }, []);

  return {
    keyboardVisible,
    keyboardHeight,
    keyboardScreenY,
    scrollToFocusedInput,
    preventNextAutoScroll
  };
};