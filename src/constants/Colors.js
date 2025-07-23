// Design system colors from style guide and CSS variables
export const Colors = {
  // CSS Root Variables (matching updated styles.css)
  textBlack: 'rgba(0, 0, 0, 1)',      // --text-black
  textWhite: 'rgba(255, 255, 255, 1)', // --text-white  
  textGray: 'rgba(166, 162, 157, 1)',  // --text-rgb-166-162-157
  
  // Primary Colors
  black: '#000000',
  white: '#FFFFFF',
  warmGray: '#A6A29D',
  
  // Background Colors (from CSS)
  noteCard: 'rgba(248, 246, 243, 1)',  // rectangle-208-19 etc.
  noteCardBackground: 'rgba(248, 246, 243, 1)',  // Same as noteCard for consistency
  cardBackground: '#F8F6F3',
  mainBackground: 'rgba(255, 255, 255, 1)',
  
  // Button Colors (from updated CSS)
  floatingButton: 'rgba(235, 117, 75, 1)', // frame-75-43 background (orange button)
  primaryOrange: 'rgba(235, 117, 75, 1)',  // Primary orange color for buttons
  primaryButton: 'rgba(0, 0, 0, 1)',      // frame-73-32 background (black button)
  secondaryButton: 'rgba(255, 255, 255, 1)', // frame-74-37 background (white button)
  
  // Border Colors
  border: 'rgba(248, 246, 243, 1)',
  buttonBorder: '1px solid rgba(248, 246, 243, 1)', // from frame-74-37
  
  // Interactive States
  iconActive: 'rgba(0, 0, 0, 1)',
  iconInactive: 'rgba(212, 204, 194, 1)', // from vector-52, vector-54 etc.
  
  // Text Colors
  primaryText: 'rgba(0, 0, 0, 1)',
  secondaryText: '#A6A29D',
  inverseText: 'rgba(255, 255, 255, 1)',
  danger: '#DC3545',
  
  // Shadow (from CSS)
  shadow: '0px -1px 20px 0px rgba(0,0,0,0.5)', // rectangle-50-44
};

export default Colors;