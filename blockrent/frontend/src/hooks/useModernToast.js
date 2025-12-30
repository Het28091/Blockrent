import { useToast as useChakraToast } from '@chakra-ui/react';

/**
 * Custom hook for modern glassmorphism toasts
 * Automatically applies consistent styling and positioning
 */
export const useModernToast = () => {
  const chakraToast = useChakraToast();

  const toastBase = (options) => {
    return chakraToast({
      duration: 500,
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
  const toast = Object.assign(toastBase, {
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

  return toast;
};

export default useModernToast;
