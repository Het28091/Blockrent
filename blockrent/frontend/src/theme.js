import { extendTheme } from '@chakra-ui/react';

const config = {
  initialColorMode: 'dark',
  useSystemColorMode: false,
};

const theme = extendTheme({
  config,
  colors: {
    brand: {
      50: '#E6F0FF',
      100: '#B3D4FF',
      200: '#80B8FF',
      300: '#4D9CFF',
      400: '#1A80FF',
      500: '#0066FF',
      600: '#0052CC',
      700: '#003D99',
      800: '#002966',
      900: '#001433',

      // Accent colors
      purple: {
        50: '#F3E8FF',
        100: '#E0CCFF',
        200: '#C399FF',
        300: '#A666FF',
        400: '#8933FF',
        500: '#7000FF',
        600: '#5A00CC',
        700: '#430099',
        800: '#2D0066',
        900: '#160033',
      },
      cyan: {
        50: '#E0F7FF',
        100: '#B3EBFF',
        200: '#80DFFF',
        300: '#4DD3FF',
        400: '#1AC7FF',
        500: '#00BBFF',
        600: '#0096CC',
        700: '#007099',
        800: '#004B66',
        900: '#002533',
      },

      // Semantic colors
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // Glass effect backgrounds
    glass: {
      light: 'rgba(255, 255, 255, 0.1)',
      medium: 'rgba(255, 255, 255, 0.15)',
      dark: 'rgba(0, 0, 0, 0.3)',
    },
  },

  fonts: {
    heading: `'Plus Jakarta Sans', 'Inter', system-ui, -apple-system, sans-serif`,
    body: `'Inter', system-ui, -apple-system, sans-serif`,
    mono: `'JetBrains Mono', 'Fira Code', monospace`,
  },

  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
    '6xl': '3.75rem',
    '7xl': '4.5rem',
  },

  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    glow: '0 0 20px rgba(0, 102, 255, 0.4)',
    glowPurple: '0 0 20px rgba(112, 0, 255, 0.4)',
    glowCyan: '0 0 20px rgba(0, 187, 255, 0.4)',
  },

  styles: {
    global: (props) => ({
      'html, body': {
        boxSizing: 'border-box',
        scrollBehavior: 'smooth',
      },
      body: {
        bg:
          props.colorMode === 'dark'
            ? '#0a0e17'
            : 'linear-gradient(135deg, #f0f4f8 0%, #ffffff 50%, #f0f4f8 100%)',
        color: props.colorMode === 'dark' ? 'white' : 'gray.900',
        backgroundAttachment: 'fixed',
      },
      '*::placeholder': {
        color: props.colorMode === 'dark' ? 'gray.500' : 'gray.400',
      },
      '*, *::before, &::after': {
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
      },
    }),
  },

  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'xl',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        _focus: {
          boxShadow: 'none',
        },
      },
      variants: {
        primary: (props) => ({
          bg:
            props.colorMode === 'dark'
              ? 'linear-gradient(135deg, brand.500 0%, brand.purple.500 100%)'
              : 'linear-gradient(135deg, #0052CC 0%, #5C00CC 100%)',
          color: 'white',
          fontWeight: '700',
          position: 'relative',
          overflow: 'hidden',
          boxShadow:
            props.colorMode === 'dark'
              ? 'none'
              : '0 2px 8px rgba(0, 82, 204, 0.3)',
          _before: {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            bg:
              props.colorMode === 'dark'
                ? 'linear-gradient(135deg, brand.600 0%, brand.purple.600 100%)'
                : 'linear-gradient(135deg, #003D99 0%, #430099 100%)',
            opacity: 0,
            transition: 'opacity 0.3s',
          },
          _hover: {
            transform: 'translateY(-2px)',
            boxShadow:
              props.colorMode === 'dark'
                ? 'glow'
                : '0 4px 16px rgba(0, 82, 204, 0.5)',
            _before: {
              opacity: 1,
            },
            _disabled: {
              transform: 'none',
            },
          },
          _active: {
            transform: 'translateY(0)',
          },
        }),
        glass: (props) => ({
          bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
          _hover: {
            bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
            transform: 'translateY(-2px)',
          },
        }),
        outline: (props) => ({
          border: '2px solid',
          borderColor: 'brand.500',
          color: props.colorMode === 'dark' ? 'brand.300' : 'brand.600',
          _hover: {
            bg: props.colorMode === 'dark' ? 'brand.900' : 'brand.50',
            transform: 'translateY(-2px)',
          },
        }),
      },
      sizes: {
        sm: {
          fontSize: 'sm',
          px: 4,
          py: 2,
        },
        md: {
          fontSize: 'md',
          px: 6,
          py: 3,
        },
        lg: {
          fontSize: 'lg',
          px: 8,
          py: 4,
        },
      },
      defaultProps: {
        variant: 'primary',
      },
    },

    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
          borderRadius: '2xl',
          border: '1px solid',
          borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.100',
        },
      }),
    },

    Card: {
      baseStyle: (props) => ({
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        backdropFilter: 'blur(12px)',
        borderRadius: '2xl',
        border: '1px solid',
        borderColor: props.colorMode === 'dark' ? 'gray.700' : 'gray.200',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        _hover: {
          transform: 'translateY(-4px)',
          boxShadow:
            props.colorMode === 'dark'
              ? '0 20px 40px -10px rgba(0, 0, 0, 0.5)'
              : 'xl',
          borderColor: props.colorMode === 'dark' ? 'brand.500' : 'brand.300',
        },
      }),
    },

    Input: {
      variants: {
        filled: (props) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
            borderRadius: 'xl',
            border: '1px solid',
            borderColor: 'transparent',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
              borderColor: 'brand.500',
              boxShadow: '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        }),
      },
      defaultProps: {
        variant: 'filled',
      },
    },

    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 3,
        py: 1,
        fontWeight: '600',
        fontSize: 'xs',
        textTransform: 'uppercase',
        letterSpacing: 'wider',
      },
      variants: {
        gradient: {
          bg: 'linear-gradient(135deg, brand.500 0%, brand.purple.500 100%)',
          color: 'white',
        },
      },
    },
  },
});

export default theme;
