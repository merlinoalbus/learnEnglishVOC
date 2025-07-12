// =====================================================
// 📁 src/hooks/core/useDebounce.js - HOOK SPECIALIZZATO per Debouncing
// =====================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";

/**
 * 🎯 CORE HOOK: useDebounce
 *
 * Hook specializzato per debouncing di valori con configurazioni ottimizzate
 * per i diversi use case di Vocabulary Master
 *
 * @param {any} value - Valore da sottoporre a debouncing
 * @param {number|object} delayOrOptions - Delay in ms o oggetto opzioni
 * @returns {any} Valore con debouncing applicato
 */
export const useDebounce = (value, delayOrOptions = 300) => {
  // ⭐ NORMALIZE OPTIONS
  const options = useMemo(() => {
    if (typeof delayOrOptions === "number") {
      return { delay: delayOrOptions };
    }
    return {
      delay: 300,
      immediate: false,
      maxWait: null,
      ...delayOrOptions,
    };
  }, [delayOrOptions]);

  const [debouncedValue, setDebouncedValue] = useState(
    options.immediate ? value : undefined
  );
  const timeoutRef = useRef(null);
  const maxTimeoutRef = useRef(null);
  const lastCallTimeRef = useRef(Date.now());
  const mountedRef = useRef(true);

  // ⭐ CLEANUP on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  // ⭐ MAIN DEBOUNCING LOGIC
  useEffect(() => {
    if (!mountedRef.current) return;

    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set up new timeout
    timeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        setDebouncedValue(value);
        if (maxTimeoutRef.current) {
          clearTimeout(maxTimeoutRef.current);
          maxTimeoutRef.current = null;
        }
      }
    }, options.delay);

    // ⭐ MAX WAIT logic - force update after maxWait period
    if (options.maxWait && !maxTimeoutRef.current) {
      const timeSinceLastCall = Date.now() - lastCallTimeRef.current;
      if (timeSinceLastCall >= options.maxWait) {
        // Force immediate update if maxWait exceeded
        if (mountedRef.current) {
          setDebouncedValue(value);
        }
      } else {
        maxTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            setDebouncedValue(value);
            lastCallTimeRef.current = Date.now();
          }
        }, options.maxWait - timeSinceLastCall);
      }
    }

    // Update last call time
    lastCallTimeRef.current = Date.now();

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, options.delay, options.maxWait]);

  return debouncedValue;
};

/**
 * 🎯 SPECIALIZED HOOK: useDebouncedCallback
 *
 * Hook per debouncing di callback functions
 *
 * @param {function} callback - Funzione da sottoporre a debouncing
 * @param {number} delay - Delay in ms
 * @param {array} deps - Dipendenze per useCallback
 * @returns {function} Callback con debouncing applicato
 */
export const useDebouncedCallback = (callback, delay = 300, deps = []) => {
  const timeoutRef = useRef(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(
    (...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          callback(...args);
        }
      }, delay);
    },
    [callback, delay, ...deps]
  );
};

/**
 * 🎯 APP-SPECIFIC HOOKS: Configurazioni pre-ottimizzate per Vocabulary Master
 */

/**
 * Hook per search nelle WordsList - ottimizzato per filtering veloce
 */
export const useWordsSearch = (searchTerm) => {
  return useDebounce(searchTerm, {
    delay: 300,
    immediate: false,
    maxWait: 1000,
  });
};

/**
 * Hook per search complessa nelle Stats con performance calculations
 */
export const useStatsSearch = (searchTerm) => {
  return useDebounce(searchTerm, {
    delay: 400,
    immediate: false,
    maxWait: 1200,
  });
};

/**
 * Hook per form validation - ritardo maggiore per evitare validazioni eccessive
 */
export const useFormValidation = (formData) => {
  return useDebounce(formData, {
    delay: 500,
    immediate: false,
    maxWait: 2000,
  });
};

/**
 * Hook per AI assistance - ritardo elevato per ridurre costi API
 */
export const useAIAssistance = (inputValue) => {
  return useDebounce(inputValue, {
    delay: 800,
    immediate: false,
    maxWait: 3000,
  });
};

/**
 * 🎯 ADVANCED HOOK: useDebouncedState
 *
 * Combina useState con debouncing per gestione state complessa
 *
 * @param {any} initialValue - Valore iniziale
 * @param {number} delay - Delay per debouncing
 * @returns {[any, any, function]} [debouncedValue, immediateValue, setValue]
 */
export const useDebouncedState = (initialValue, delay = 300) => {
  const [immediateValue, setImmediateValue] = useState(initialValue);
  const debouncedValue = useDebounce(immediateValue, delay);

  return [debouncedValue, immediateValue, setImmediateValue];
};

/**
 * 🎯 UTILITY HOOK: useDebounceStatus
 *
 * Restituisce informazioni sullo stato del debouncing
 *
 * @param {any} value - Valore da monitorare
 * @param {number} delay - Delay del debouncing
 * @returns {object} Stato del debouncing
 */
export const useDebounceStatus = (value, delay = 300) => {
  const [isPending, setIsPending] = useState(false);
  const debouncedValue = useDebounce(value, delay);
  const timeoutRef = useRef(null);

  useEffect(() => {
    setIsPending(true);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsPending(false);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay]);

  useEffect(() => {
    if (debouncedValue === value) {
      setIsPending(false);
    }
  }, [debouncedValue, value]);

  return {
    debouncedValue,
    isPending,
    isReady: !isPending && debouncedValue !== undefined,
  };
};

// =====================================================
// 📋 CONFIGURATION PRESETS per APP VOCABULARY MASTER
// =====================================================

export const DEBOUNCE_PRESETS = {
  // 🔍 SEARCH Operations
  WORD_SEARCH: { delay: 300, maxWait: 1000 },
  STATS_SEARCH: { delay: 400, maxWait: 1200 },
  FILTER_SEARCH: { delay: 250, maxWait: 800 },

  // ✍️ FORM Operations
  FORM_VALIDATION: { delay: 500, maxWait: 2000 },
  INPUT_VALIDATION: { delay: 300, maxWait: 1000 },

  // 🤖 AI Operations
  AI_ASSISTANCE: { delay: 800, maxWait: 3000 },
  AI_ANALYSIS: { delay: 1000, maxWait: 4000 },

  // 💾 DATA Operations
  AUTO_SAVE: { delay: 1000, maxWait: 5000 },
  SYNC_OPERATION: { delay: 2000, maxWait: 10000 },

  // 🎮 UI Operations
  RESIZE_HANDLER: { delay: 100, maxWait: 300 },
  SCROLL_HANDLER: { delay: 50, maxWait: 200 },
};

/**
 * 🎯 PRESET HOOK: usePresetDebounce
 *
 * Hook che utilizza preset predefiniti
 *
 * @param {any} value - Valore da sottoporre a debouncing
 * @param {string} presetName - Nome del preset da utilizzare
 * @returns {any} Valore con debouncing applicato
 */
export const usePresetDebounce = (value, presetName) => {
  const preset = DEBOUNCE_PRESETS[presetName];

  if (!preset) {
    console.warn(`Debounce preset '${presetName}' not found. Using default.`);
    return useDebounce(value);
  }

  return useDebounce(value, preset);
};

export default useDebounce;
