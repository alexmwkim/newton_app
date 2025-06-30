// Typography constants from style guide and CSS
export const Typography = {
  // Font Families - matching CSS variables
  fontFamily: {
    primary: 'Avenir Next',
    korean: 'Noto Sans KR',
    system: 'System', // Fallback for React Native
  },
  
  // Font Sizes (matching CSS styles)
  fontSize: {
    small: 12,      // text-27 to text-30 from CSS
    body: 15,       // text-23 to text-26 from CSS  
    medium: 17,     // text-4 and text-63 from CSS
    title: 18,
    heading: 24,
    large: 32,
  },
  
  // Font Weights (matching CSS)
  fontWeight: {
    normal: '400',    // normal weight from CSS
    medium: '500',    // font-weight: 500 from CSS
    semibold: '600',
    bold: '700',
  },
  
  // Letter Spacing (from CSS)
  letterSpacing: {
    tight: -0.02,     // -2% letter-spacing
    normal: -0.01,    // -1% letter-spacing
  },
  
  // Line Heights (from CSS)
  lineHeight: {
    body: 22,         // line-height: 22px from CSS
    normal: 1.4,
  },
};

export default Typography;