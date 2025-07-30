import { useState, useCallback, useEffect, useRef } from 'react';

interface ModalConfig {
  id?: string;
  title?: string;
  content?: React.ReactNode;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  variant?: 'default' | 'confirmation' | 'alert' | 'info' | 'success' | 'warning' | 'error';
  closable?: boolean;
  backdrop?: boolean;
  keyboard?: boolean;
  centered?: boolean;
  fullscreen?: boolean;
  animation?: boolean;
  persistent?: boolean;
  zIndex?: number;
  className?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showConfirm?: boolean;
  showCancel?: boolean;
  confirmVariant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  cancelVariant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  loading?: boolean;
  disabled?: boolean;
}

interface ModalState {
  isOpen: boolean;
  isAnimating: boolean;
  isLoading: boolean;
  error: string | null;
  config: ModalConfig;
}

interface ModalHookReturn {
  isOpen: boolean;
  isAnimating: boolean;
  isLoading: boolean;
  error: string | null;
  config: ModalConfig;
  open: (config?: ModalConfig) => void;
  close: (force?: boolean) => void;
  toggle: () => void;
  confirm: () => Promise<void>;
  cancel: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateConfig: (config: Partial<ModalConfig>) => void;
  clearError: () => void;
}

const DEFAULT_CONFIG: ModalConfig = {
  size: 'medium',
  variant: 'default',
  closable: true,
  backdrop: true,
  keyboard: true,
  centered: true,
  fullscreen: false,
  animation: true,
  persistent: false,
  zIndex: 1000,
  showConfirm: true,
  showCancel: true,
  confirmText: 'OK',
  cancelText: 'Cancel',
  confirmVariant: 'primary',
  cancelVariant: 'secondary',
  loading: false,
  disabled: false,
};

export const useModal = (initialConfig: ModalConfig = {}): ModalHookReturn => {
  const [state, setState] = useState<ModalState>({
    isOpen: false,
    isAnimating: false,
    isLoading: false,
    error: null,
    config: { ...DEFAULT_CONFIG, ...initialConfig },
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const safeSetState = useCallback((updater: (prev: ModalState) => ModalState) => {
    if (!isUnmountedRef.current) {
      setState(updater);
    }
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    safeSetState(prev => ({ ...prev, isLoading: loading }));
  }, [safeSetState]);

  const setError = useCallback((error: string | null) => {
    safeSetState(prev => ({ ...prev, error }));
  }, [safeSetState]);

  const clearError = useCallback(() => {
    setError(null);
  }, [setError]);

  const updateConfig = useCallback((config: Partial<ModalConfig>) => {
    safeSetState(prev => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, [safeSetState]);

  const open = useCallback((config: ModalConfig = {}) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const newConfig = { ...state.config, ...config };
    
    safeSetState(prev => ({
      ...prev,
      isOpen: true,
      isAnimating: true,
      error: null,
      config: newConfig,
    }));

    // Call onOpen callback
    if (newConfig.onOpen) {
      newConfig.onOpen();
    }

    // Handle animation
    if (newConfig.animation) {
      timeoutRef.current = setTimeout(() => {
        safeSetState(prev => ({ ...prev, isAnimating: false }));
      }, 300); // Animation duration
    } else {
      safeSetState(prev => ({ ...prev, isAnimating: false }));
    }
  }, [state.config, safeSetState]);

  const close = useCallback((force = false) => {
    if (state.config.persistent && !force) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Call onClose callback
    if (state.config.onClose) {
      state.config.onClose();
    }

    if (state.config.animation) {
      safeSetState(prev => ({ ...prev, isAnimating: true }));
      
      timeoutRef.current = setTimeout(() => {
        safeSetState(prev => ({
          ...prev,
          isOpen: false,
          isAnimating: false,
          isLoading: false,
          error: null,
        }));
      }, 300); // Animation duration
    } else {
      safeSetState(prev => ({
        ...prev,
        isOpen: false,
        isAnimating: false,
        isLoading: false,
        error: null,
      }));
    }
  }, [state.config, safeSetState]);

  const toggle = useCallback(() => {
    if (state.isOpen) {
      close();
    } else {
      open();
    }
  }, [state.isOpen, close, open]);

  const confirm = useCallback(async () => {
    if (state.config.onConfirm) {
      try {
        setLoading(true);
        clearError();
        
        await state.config.onConfirm();
        
        // Close modal after successful confirmation
        close();
      } catch (error: any) {
        setError(error.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    } else {
      close();
    }
  }, [state.config, setLoading, clearError, setError, close]);

  const cancel = useCallback(() => {
    if (state.config.onCancel) {
      state.config.onCancel();
    }
    close();
  }, [state.config, close]);

  // Handle keyboard events
  useEffect(() => {
    if (!state.isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!state.config.keyboard) return;

      switch (event.key) {
        case 'Escape':
          if (state.config.closable) {
            close();
          }
          break;
        case 'Enter':
          if (state.config.variant === 'confirmation' && state.config.showConfirm) {
            confirm();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'unset';
    };
  }, [state.isOpen, state.config.keyboard, state.config.closable, state.config.variant, state.config.showConfirm, close, confirm]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (state.config.backdrop && state.config.closable && event.target === event.currentTarget) {
      close();
    }
  }, [state.config.backdrop, state.config.closable, close]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      document.body.style.overflow = 'unset';
    };
  }, []);

  return {
    isOpen: state.isOpen,
    isAnimating: state.isAnimating,
    isLoading: state.isLoading,
    error: state.error,
    config: state.config,
    open,
    close,
    toggle,
    confirm,
    cancel,
    setLoading,
    setError,
    updateConfig,
    clearError,
  };
};

// Helper hook for confirmation modals
export const useConfirmationModal = () => {
  const modal = useModal({
    variant: 'confirmation',
    size: 'small',
    showConfirm: true,
    showCancel: true,
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmVariant: 'danger',
  });

  const confirm = useCallback(async (
    title: string,
    message: string,
    options: Partial<ModalConfig> = {}
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      modal.open({
        title,
        content: message,
        ...options,
        onConfirm: () => {
          resolve(true);
        },
        onCancel: () => {
          resolve(false);
        },
      });
    });
  }, [modal]);

  return {
    ...modal,
    confirm,
  };
};

// Helper hook for alert modals
export const useAlertModal = () => {
  const modal = useModal({
    variant: 'alert',
    size: 'small',
    showConfirm: true,
    showCancel: false,
    confirmText: 'OK',
  });

  const alert = useCallback((
    title: string,
    message: string,
    variant: 'info' | 'success' | 'warning' | 'error' = 'info',
    options: Partial<ModalConfig> = {}
  ): Promise<void> => {
    return new Promise((resolve) => {
      modal.open({
        title,
        content: message,
        variant,
        ...options,
        onConfirm: () => {
          resolve();
        },
      });
    });
  }, [modal]);

  return {
    ...modal,
    alert,
  };
};

export default useModal;