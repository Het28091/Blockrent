/**
 * Modern Color System for Blockrent
 * Vibrant, accessible colors for light and dark modes
 */

export const colors = {
  // Brand Colors
  brand: {
    50: '#E6F2FF',
    100: '#BAD9FF',
    200: '#8DC1FF',
    300: '#61A8FF',
    400: '#3490FF',
    500: '#0066FF', // Primary
    600: '#0052CC',
    700: '#003D99',
    800: '#002966',
    900: '#001433',
  },

  // Accent Colors
  accent: {
    50: '#F5F0FF',
    100: '#E9D8FD',
    200: '#D6BCFA',
    300: '#B794F6',
    400: '#9F7AEA',
    500: '#6B46C1', // Primary Accent
    600: '#553C9A',
    700: '#44337A',
    800: '#322659',
    900: '#21183C',
  },

  // Cyan/Teal
  cyan: {
    50: '#E6FFFF',
    100: '#B3F5FF',
    200: '#80EBFF',
    300: '#4DE0FF',
    400: '#1AD6FF',
    500: '#00D9FF', // Vibrant Cyan
    600: '#00ADCC',
    700: '#008299',
    800: '#005666',
    900: '#002B33',
  },

  // Neon Green
  neon: {
    50: '#E6FFF5',
    100: '#B3FFE0',
    200: '#80FFCC',
    300: '#4DFFB8',
    400: '#1AFFA3',
    500: '#00F5A0', // Neon Green
    600: '#00C380',
    700: '#009260',
    800: '#006140',
    900: '#003020',
  },

  // Sunset Orange/Red
  sunset: {
    50: '#FFE6E6',
    100: '#FFB3B3',
    200: '#FF8080',
    300: '#FF4D4D',
    400: '#FF1A1A',
    500: '#FF6B6B', // Sunset Orange
    600: '#CC5656',
    700: '#994040',
    800: '#662B2B',
    900: '#331515',
  },

  // Success (Enhanced Green)
  success: {
    50: '#E6FFF9',
    100: '#B3FFED',
    200: '#80FFE1',
    300: '#4DFFD5',
    400: '#1AFFC9',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
  },

  // Warning (Enhanced Orange)
  warning: {
    50: '#FFF7E6',
    100: '#FFE7B3',
    200: '#FFD780',
    300: '#FFC74D',
    400: '#FFB71A',
    500: '#FFB800',
    600: '#CC9300',
    700: '#996E00',
    800: '#664A00',
    900: '#332500',
  },

  // Error (Enhanced Red)
  error: {
    50: '#FFE6E6',
    100: '#FFB3B3',
    200: '#FF8080',
    300: '#FF4D4D',
    400: '#FF1A1A',
    500: '#EF4444',
    600: '#DC2626',
    700: '#B91C1C',
    800: '#991B1B',
    900: '#7F1D1D',
  },

  // Info (Enhanced Blue)
  info: {
    50: '#E6F7FF',
    100: '#B3E5FF',
    200: '#80D4FF',
    300: '#4DC2FF',
    400: '#1AB1FF',
    500: '#3B82F6',
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
  },

  // Neutral Grays (Enhanced for better contrast)
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Special Colors
  special: {
    gold: '#FFD700',
    silver: '#C0C0C0',
    bronze: '#CD7F32',
    platinum: '#E5E4E2',
  },
};

// Semantic Color Mappings
export const semanticColors = {
  // Light Mode
  light: {
    background: {
      primary: colors.gray[50],
      secondary: '#FFFFFF',
      tertiary: colors.gray[100],
    },
    text: {
      primary: colors.gray[900],
      secondary: colors.gray[700],
      tertiary: colors.gray[600],
      disabled: colors.gray[400],
    },
    border: {
      primary: colors.gray[200],
      secondary: colors.gray[300],
      focus: colors.brand[500],
    },
    surface: {
      card: '#FFFFFF',
      hover: colors.gray[50],
      active: colors.gray[100],
    },
  },

  // Dark Mode
  dark: {
    background: {
      primary: '#0F1419',
      secondary: colors.gray[900],
      tertiary: colors.gray[800],
    },
    text: {
      primary: colors.gray[50],
      secondary: colors.gray[200],
      tertiary: colors.gray[400],
      disabled: colors.gray[600],
    },
    border: {
      primary: colors.gray[700],
      secondary: colors.gray[600],
      focus: colors.brand[400],
    },
    surface: {
      card: colors.gray[800],
      hover: colors.gray[700],
      active: colors.gray[600],
    },
  },
};

export default colors;
