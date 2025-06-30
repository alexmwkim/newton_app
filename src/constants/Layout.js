import { Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Layout constants from style guide and CSS responsive design
export const Layout = {
  // Border Radius (from CSS)
  borderRadius: {
    small: 10,        // rectangle background border-radius
    button: 30,       // frame-73-32, frame-74-37, frame-75-59 border-radius
    card: 10,         // note card border-radius
  },
  
  // Spacing (enhanced with CSS values)
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  
  // Padding (from CSS - frame components)
  padding: {
    container: 16,
    card: 12,
    button: 12,        // padding: 12px 16px from CSS frames
    buttonHorizontal: 16, // horizontal padding from CSS
    buttonVertical: 12,   // vertical padding from CSS
  },
  
  // Responsive breakpoints (from CSS media queries)
  breakpoints: {
    mobile: 768,      // @media (max-width: 768px)
    tablet: 1440,     // @media (max-width: 1440px)
  },
  
  // Screen dimensions
  screen: {
    width: screenWidth,
    height: screenHeight,
    // Responsive padding based on screen width
    padding: screenWidth <= 768 ? 16 : screenWidth <= 1440 ? 24 : 32,
  },
  
  // Button dimensions (based on CSS frame widths)
  button: {
    toggleWidth: '24.173027989821882%', // frame-73-32 and frame-74-37 width from CSS
    minHeight: 44,
  },
  
  // Gap values (from CSS)
  gap: {
    small: 4,         // gap: 4px from CSS frames
    medium: 8,
    large: 16,
  },
};

export default Layout;