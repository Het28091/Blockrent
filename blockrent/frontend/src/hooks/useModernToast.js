import { useToast as useChakraToast } from '@chakra-ui/react';
import { useMemo } from 'react';

/**
 * Custom hook for modern glassmorphism toasts
 * Automatically applies consistent styling and positioning
 */
export const useModernToast = () => {
  const chakraToast = useChakraToast();

  return useMemo(() => {
    const toastBase = (options) => {
      return chakraToast({
        duration: 3000, // Increased default duration
        isClosable: true,
        position: 'top-right',
        variant: 'left-accent',
        ...options,
        containerStyle: {
          backdropFilter: 'blur(20px) saturate(180%)',
          borderRadius: '12px',
          ...options.containerStyle,
        },
      });
    };

    // Create toast object with convenience methods
    return Object.assign(toastBase, {
      success: (title, description) =>
        toastBase({
          title,
          description,
          status: 'success',
        }),

      error: (title, description) =>
        toastBase({
          title,
          description,
          status: 'error',
        }),

      warning: (title, description) =>
        toastBase({
          title,
          description,
          status: 'warning',
        }),

      info: (title, description) =>
        toastBase({
          title,
          description,
          status: 'info',
        }),

      closeAll: chakraToast.closeAll,
      close: chakraToast.close,
      isActive: chakraToast.isActive,
    });
  }, [chakraToast]);
};

export default useModernToast;
