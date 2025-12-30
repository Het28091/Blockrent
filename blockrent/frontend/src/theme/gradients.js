/**
 * Gradient Library for Blockrent
 * Beautiful, modern gradients for various use cases
 */

export const gradients = {
  // Primary Gradients
  primary: 'linear-gradient(135deg, #0066FF 0%, #00D9FF 100%)',
  primaryVertical: 'linear-gradient(180deg, #0066FF 0%, #00D9FF 100%)',
  primaryHover: 'linear-gradient(135deg, #0052CC 0%, #00ADCC 100%)',

  // Secondary Gradients
  secondary: 'linear-gradient(135deg, #6B46C1 0%, #B794F6 100%)',
  secondaryVertical: 'linear-gradient(180deg, #6B46C1 0%, #B794F6 100%)',
  secondaryHover: 'linear-gradient(135deg, #553C9A 0%, #9F7AEA 100%)',

  // Success Gradients
  success: 'linear-gradient(135deg, #00F5A0 0%, #00D9FF 100%)',
  successVertical: 'linear-gradient(180deg, #00F5A0 0%, #00D9FF 100%)',
  successHover: 'linear-gradient(135deg, #00C380 0%, #00ADCC 100%)',

  // Warning Gradients
  warning: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
  warningVertical: 'linear-gradient(180deg, #FFB800 0%, #FF6B6B 100%)',
  warningHover: 'linear-gradient(135deg, #CC9300 0%, #CC5656 100%)',

  // Error Gradients
  error: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  errorVertical: 'linear-gradient(180deg, #EF4444 0%, #DC2626 100%)',
  errorHover: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',

  // Info Gradients
  info: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  infoVertical: 'linear-gradient(180deg, #3B82F6 0%, #2563EB 100%)',
  infoHover: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',

  // Special Gradients
  cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  cosmicVertical:
    'linear-gradient(180deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',

  ocean: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)',
  oceanVertical: 'linear-gradient(180deg, #2E3192 0%, #1BFFFF 100%)',

  sunset: 'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)',
  sunsetVertical: 'linear-gradient(180deg, #ff6e7f 0%, #bfe9ff 100%)',

  neon: 'linear-gradient(135deg, #00F5A0 0%, #00D9F5 100%)',
  neonVertical: 'linear-gradient(180deg, #00F5A0 0%, #00D9F5 100%)',

  fire: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  fireVertical: 'linear-gradient(180deg, #f12711 0%, #f5af19 100%)',

  purple: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  purpleVertical: 'linear-gradient(180deg, #a8edea 0%, #fed6e3 100%)',

  // Animated Gradients (for backgrounds)
  animated: {
    cosmic: {
      background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
    },
    ocean: {
      background: 'linear-gradient(-45deg, #2E3192, #1BFFFF, #00D9FF, #0066FF)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
    },
    sunset: {
      background: 'linear-gradient(-45deg, #ff6e7f, #bfe9ff, #FFB800, #FF6B6B)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite',
    },
  },

  // Subtle Gradients (for backgrounds)
  subtle: {
    blue: 'linear-gradient(135deg, #E6F2FF 0%, #F9FAFB 100%)',
    purple: 'linear-gradient(135deg, #F5F0FF 0%, #F9FAFB 100%)',
    green: 'linear-gradient(135deg, #E6FFF9 0%, #F9FAFB 100%)',
    orange: 'linear-gradient(135deg, #FFF7E6 0%, #F9FAFB 100%)',
    gray: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
  },

  // Dark Mode Gradients
  dark: {
    primary: 'linear-gradient(135deg, #0052CC 0%, #00ADCC 100%)',
    secondary: 'linear-gradient(135deg, #553C9A 0%, #9F7AEA 100%)',
    success: 'linear-gradient(135deg, #00C380 0%, #00ADCC 100%)',
    warning: 'linear-gradient(135deg, #CC9300 0%, #CC5656 100%)',
    cosmic: 'linear-gradient(135deg, #553C9A 0%, #6B46C1 50%, #9F7AEA 100%)',
    ocean: 'linear-gradient(135deg, #1E3A8A 0%, #00ADCC 100%)',
    background: 'linear-gradient(135deg, #0F1419 0%, #1F2937 100%)',
  },

  // Text Gradients (for gradient text)
  text: {
    primary: 'linear-gradient(135deg, #0066FF 0%, #00D9FF 100%)',
    secondary: 'linear-gradient(135deg, #6B46C1 0%, #B794F6 100%)',
    success: 'linear-gradient(135deg, #00F5A0 0%, #00D9FF 100%)',
    warning: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
    cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
    rainbow:
      'linear-gradient(135deg, #FF6B6B 0%, #FFB800 25%, #00F5A0 50%, #00D9FF 75%, #6B46C1 100%)',
  },

  // Border Gradients
  border: {
    primary: 'linear-gradient(135deg, #0066FF 0%, #00D9FF 100%)',
    secondary: 'linear-gradient(135deg, #6B46C1 0%, #B794F6 100%)',
    success: 'linear-gradient(135deg, #00F5A0 0%, #00D9FF 100%)',
    warning: 'linear-gradient(135deg, #FFB800 0%, #FF6B6B 100%)',
    cosmic: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  },

  // Overlay Gradients (for image overlays)
  overlay: {
    dark: 'linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.8) 100%)',
    light:
      'linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.8) 100%)',
    primary:
      'linear-gradient(180deg, rgba(0, 102, 255, 0) 0%, rgba(0, 102, 255, 0.8) 100%)',
    secondary:
      'linear-gradient(180deg, rgba(107, 70, 193, 0) 0%, rgba(107, 70, 193, 0.8) 100%)',
  },
};

// Helper function to create custom gradients
export const createGradient = (color1, color2, angle = 135) => {
  return `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 100%)`;
};

// Helper function to create radial gradients
export const createRadialGradient = (color1, color2) => {
  return `radial-gradient(circle, ${color1} 0%, ${color2} 100%)`;
};

// Helper function to create conic gradients
export const createConicGradient = (colors) => {
  const colorStops = colors
    .map((color, index) => {
      const percentage = (index / (colors.length - 1)) * 100;
      return `${color} ${percentage}%`;
    })
    .join(', ');
  return `conic-gradient(${colorStops})`;
};

export default gradients;
