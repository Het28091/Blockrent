/**
 * Modern Theme Configuration for Blockrent
 * Revolutionary design system with glassmorphism and modern aesthetics
 */

import { extendTheme } from '@chakra-ui/react';

const modernTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },

  colors: {
    brand: {
      50: '#E6F2FF',
      100: '#BAD9FF',
      200: '#8DC1FF',
      300: '#61A8FF',
      400: '#3490FF',
      500: '#0877FF',
      600: '#0660CC',
      700: '#054999',
      800: '#033166',
      900: '#021A33',
    },

    accent: {
      50: '#FFF5F7',
      100: '#FED7E2',
      200: '#FBB6CE',
      300: '#F687B3',
      400: '#ED64A6',
      500: '#D53F8C',
      600: '#B83280',
      700: '#97266D',
      800: '#702459',
      900: '#521B41',
    },

    success: {
      50: '#E6FFFA',
      100: '#B2F5EA',
      200: '#81E6D9',
      300: '#4FD1C5',
      400: '#38B2AC',
      500: '#319795',
      600: '#2C7A7B',
      700: '#285E61',
      800: '#234E52',
      900: '#1D4044',
    },
  },

  fonts: {
    heading: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    body: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
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
    '8xl': '6rem',
    '9xl': '8rem',
  },

  shadows: {
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    outline: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    glow: '0 0 20px rgba(66, 153, 225, 0.5)',
    'glow-lg': '0 0 40px rgba(66, 153, 225, 0.6)',
  },

  styles: {
    global: (props) => ({
      body: {
        bg:
          props.colorMode === 'dark'
            ? 'linear-gradient(135deg, #0f1419 0%, #1a202c 100%)'
            : 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
        color: props.colorMode === 'dark' ? 'gray.50' : 'gray.800',
        minHeight: '100vh',
      },
      '*::placeholder': {
        color: props.colorMode === 'dark' ? 'gray.400' : 'gray.400',
      },
      '*, *::before, &::after': {
        borderColor: props.colorMode === 'dark' ? 'gray.600' : 'gray.200',
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
          boxShadow: 'outline',
        },
      },
      variants: {
        solid: (props) => ({
          bg: `${props.colorScheme}.500`,
          color: 'white',
          _hover: {
            bg: `${props.colorScheme}.600`,
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
            _disabled: {
              bg: `${props.colorScheme}.500`,
            },
          },
          _active: {
            bg: `${props.colorScheme}.700`,
            transform: 'translateY(0)',
          },
        }),
        gradient: {
          bgGradient: 'linear(to-r, brand.400, accent.400)',
          color: 'white',
          _hover: {
            bgGradient: 'linear(to-r, brand.500, accent.500)',
            transform: 'translateY(-2px)',
            boxShadow: 'xl',
          },
          _active: {
            transform: 'translateY(0)',
          },
        },
        glass: (props) => ({
          bg:
            props.colorMode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(10px)',
          border: '1px solid',
          borderColor:
            props.colorMode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'rgba(255, 255, 255, 0.3)',
          _hover: {
            bg:
              props.colorMode === 'dark'
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.9)',
            transform: 'translateY(-2px)',
          },
        }),
      },
      sizes: {
        lg: {
          h: '12',
          minW: '12',
          fontSize: 'lg',
          px: '8',
        },
        xl: {
          h: '14',
          minW: '14',
          fontSize: 'xl',
          px: '10',
        },
      },
    },

    Card: {
      baseStyle: (props) => ({
        container: {
          bg:
            props.colorMode === 'dark'
              ? 'rgba(45, 55, 72, 0.95)'
              : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '2xl',
          border: '1px solid',
          borderColor:
            props.colorMode === 'dark'
              ? 'rgba(255, 255, 255, 0.15)'
              : 'rgba(255, 255, 255, 0.5)',
          boxShadow:
            props.colorMode === 'dark'
              ? '0 8px 32px rgba(0, 0, 0, 0.5)'
              : '0 8px 32px rgba(31, 38, 135, 0.15)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          _hover: {
            transform: 'translateY(-4px)',
            boxShadow:
              props.colorMode === 'dark'
                ? '0 12px 48px rgba(0, 0, 0, 0.6)'
                : '0 12px 48px rgba(31, 38, 135, 0.25)',
          },
        },
      }),
    },

    Input: {
      variants: {
        filled: (props) => ({
          field: {
            bg: props.colorMode === 'dark' ? 'gray.700' : 'gray.50',
            color: props.colorMode === 'dark' ? 'gray.50' : 'gray.800',
            borderRadius: 'xl',
            border: '2px solid transparent',
            _hover: {
              bg: props.colorMode === 'dark' ? 'gray.600' : 'gray.100',
            },
            _focus: {
              bg: props.colorMode === 'dark' ? 'gray.700' : 'white',
              borderColor: 'brand.400',
              boxShadow:
                props.colorMode === 'dark'
                  ? '0 0 0 1px var(--chakra-colors-brand-400)'
                  : '0 0 0 1px var(--chakra-colors-brand-500)',
            },
          },
        }),
        glass: (props) => ({
          field: {
            bg:
              props.colorMode === 'dark'
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(255, 255, 255, 0.7)',
            color: props.colorMode === 'dark' ? 'gray.50' : 'gray.800',
            backdropFilter: 'blur(10px)',
            border: '1px solid',
            borderColor:
              props.colorMode === 'dark'
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(255, 255, 255, 0.3)',
            borderRadius: 'xl',
            _focus: {
              borderColor:
                props.colorMode === 'dark' ? 'brand.400' : 'brand.500',
              boxShadow:
                props.colorMode === 'dark'
                  ? '0 0 20px rgba(66, 153, 225, 0.4)'
                  : '0 0 20px rgba(66, 153, 225, 0.5)',
            },
          },
        }),
      },
    },

    Badge: {
      baseStyle: {
        borderRadius: 'full',
        px: 3,
        py: 1,
        fontWeight: '600',
        textTransform: 'none',
      },
    },

    Modal: {
      baseStyle: (props) => ({
        dialog: {
          bg:
            props.colorMode === 'dark'
              ? 'rgba(45, 55, 72, 0.98)'
              : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '2xl',
          border: props.colorMode === 'dark' ? '1px solid' : 'none',
          borderColor:
            props.colorMode === 'dark'
              ? 'rgba(255, 255, 255, 0.1)'
              : 'transparent',
          boxShadow:
            props.colorMode === 'dark'
              ? '0 20px 60px rgba(0, 0, 0, 0.7)'
              : '0 20px 60px rgba(0, 0, 0, 0.2)',
        },
        overlay: {
          backdropFilter: 'blur(4px)',
          bg:
            props.colorMode === 'dark'
              ? 'rgba(0, 0, 0, 0.7)'
              : 'rgba(0, 0, 0, 0.4)',
        },
        header: {
          color: props.colorMode === 'dark' ? 'gray.50' : 'gray.800',
        },
        body: {
          color: props.colorMode === 'dark' ? 'gray.100' : 'gray.700',
        },
      }),
    },

    Alert: {
      variants: {
        glass: (props) => {
          const { status } = props;
          const statusColors = {
            success: {
              light: 'rgba(72, 187, 120, 0.15)',
              dark: 'rgba(72, 187, 120, 0.2)',
              border: '#48BB78',
            },
            error: {
              light: 'rgba(245, 101, 101, 0.15)',
              dark: 'rgba(245, 101, 101, 0.2)',
              border: '#F56565',
            },
            warning: {
              light: 'rgba(237, 137, 54, 0.15)',
              dark: 'rgba(237, 137, 54, 0.2)',
              border: '#ED8936',
            },
            info: {
              light: 'rgba(66, 153, 225, 0.15)',
              dark: 'rgba(66, 153, 225, 0.2)',
              border: '#4299E1',
            },
          };

          const colors = statusColors[status] || statusColors.info;

          return {
            container: {
              bg: props.colorMode === 'dark' ? colors.dark : colors.light,
              backdropFilter: 'blur(20px) saturate(180%)',
              borderRadius: 'xl',
              border: '1px solid',
              borderColor: colors.border,
              boxShadow: `0 8px 24px ${colors.border}40`,
              color: props.colorMode === 'dark' ? 'white' : 'gray.800',
              fontWeight: '500',
              px: 4,
              py: 3,
            },
            title: {
              fontWeight: '700',
              fontSize: 'md',
            },
            description: {
              fontSize: 'sm',
            },
            icon: {
              color: colors.border,
            },
          };
        },
      },
    },
  },
});

// Default toast options
export const toastOptions = {
  defaultOptions: {
    duration: 500,
    isClosable: true,
    position: 'top-right',
    variant: 'glass',
  },
};

export default modernTheme;
