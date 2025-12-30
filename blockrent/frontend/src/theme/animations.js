/**
 * Modern Animation Configurations for Blockrent
 * Smooth, professional animations for a revolutionary UI
 */

export const animations = {
  // Fade animations
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.5 },
  },

  fadeInUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] },
  },

  fadeInDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 },
  },

  // Scale animations
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: { duration: 0.4 },
  },

  // Slide animations
  slideInLeft: {
    initial: { x: -50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5 },
  },

  slideInRight: {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    transition: { duration: 0.5 },
  },

  // Stagger children
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  },

  // Hover animations
  hoverScale: {
    scale: 1.05,
    transition: { duration: 0.2 },
  },

  hoverLift: {
    y: -8,
    transition: { duration: 0.3 },
  },

  // Pulse animation
  pulse: {
    scale: [1, 1.05, 1],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// CSS Keyframes for Chakra UI
export const keyframes = {
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,

  slideUp: `
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,

  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
  `,

  shimmer: `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
  `,

  gradient: `
    @keyframes gradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `,

  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 20px rgba(66, 153, 225, 0.5); }
      50% { box-shadow: 0 0 40px rgba(66, 153, 225, 0.8); }
    }
  `,
};

// Transition presets
export const transitions = {
  smooth: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  spring: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  bounce: 'all 0.6s cubic-bezier(0.68, -0.6, 0.32, 1.6)',
  ease: 'all 0.3s ease-in-out',
};

// Glassmorphism styles
export const glassmorphism = {
  light: {
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
  },

  dark: {
    background: 'rgba(26, 32, 44, 0.7)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  },

  card: {
    background: 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.2)',
  },
};

// Gradient presets
export const gradients = {
  primary: 'linear(to-r, #667eea 0%, #764ba2 100%)',
  secondary: 'linear(to-r, #f093fb 0%, #f5576c 100%)',
  success: 'linear(to-r, #4facfe 0%, #00f2fe 100%)',
  warning: 'linear(to-r, #fa709a 0%, #fee140 100%)',
  info: 'linear(to-r, #30cfd0 0%, #330867 100%)',
  purple: 'linear(to-r, #a8edea 0%, #fed6e3 100%)',
  blue: 'linear(to-br, #2196F3, #1976D2, #0D47A1)',
  ocean: 'linear(to-r, #2E3192 0%, #1BFFFF 100%)',
  sunset: 'linear(to-r, #ff6e7f 0%, #bfe9ff 100%)',
  cosmic: 'linear(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  neon: 'linear(to-r, #00F5A0 0%, #00D9F5 100%)',
  fire: 'linear(to-r, #f12711 0%, #f5af19 100%)',

  // Animated gradients
  animated: {
    background: 'linear-gradient(-45deg, #667eea, #764ba2, #f093fb, #f5576c)',
    backgroundSize: '400% 400%',
    animation: 'gradient 15s ease infinite',
  },
};

// Shadow presets
export const shadows = {
  soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
  medium: '0 4px 16px rgba(0, 0, 0, 0.12)',
  large: '0 8px 32px rgba(0, 0, 0, 0.16)',
  xl: '0 12px 48px rgba(0, 0, 0, 0.2)',
  colored: {
    blue: '0 8px 32px rgba(66, 153, 225, 0.3)',
    purple: '0 8px 32px rgba(159, 122, 234, 0.3)',
    green: '0 8px 32px rgba(72, 187, 120, 0.3)',
    red: '0 8px 32px rgba(245, 101, 101, 0.3)',
  },
  glow: {
    blue: '0 0 20px rgba(66, 153, 225, 0.5)',
    purple: '0 0 20px rgba(159, 122, 234, 0.5)',
    green: '0 0 20px rgba(72, 187, 120, 0.5)',
  },
};

// Hover effects
export const hoverEffects = {
  lift: {
    transform: 'translateY(-8px)',
    boxShadow: shadows.xl,
    transition: transitions.smooth,
  },

  scale: {
    transform: 'scale(1.05)',
    transition: transitions.spring,
  },

  glow: {
    boxShadow: shadows.glow.blue,
    transition: transitions.smooth,
  },

  shine: {
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: '-100%',
      width: '100%',
      height: '100%',
      background:
        'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
      transition: 'left 0.5s',
    },
    '&:hover::before': {
      left: '100%',
    },
  },
};
