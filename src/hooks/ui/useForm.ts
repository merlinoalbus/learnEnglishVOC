import { useState, useCallback, useRef, useEffect } from 'react';

type ValidationRule<T = any> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: T) => string | null;
  email?: boolean;
  url?: boolean;
};

type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

type FormField<T> = {
  value: T;
  error: string | null;
  touched: boolean;
  dirty: boolean;
};

type FormState<T> = {
  [K in keyof T]: FormField<T[K]>;
};

interface FormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  validateOnSubmit?: boolean;
  resetOnSubmit?: boolean;
  onSubmit?: (values: T) => void | Promise<void>;
  onReset?: () => void;
  onFieldChange?: (field: keyof T, value: T[keyof T]) => void;
}

interface FormHookReturn<T> {
  values: T;
  errors: ValidationErrors<T>;
  touched: { [K in keyof T]: boolean };
  dirty: { [K in keyof T]: boolean };
  isSubmitting: boolean;
  isValidating: boolean;
  isValid: boolean;
  isDirty: boolean;
  formState: FormState<T>;
  setValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  setError: <K extends keyof T>(field: K, error: string | null) => void;
  setErrors: (errors: Partial<ValidationErrors<T>>) => void;
  setTouched: <K extends keyof T>(field: K, touched: boolean) => void;
  setFieldTouched: (touched: { [K in keyof T]?: boolean }) => void;
  clearErrors: () => void;
  clearField: <K extends keyof T>(field: K) => void;
  resetForm: () => void;
  validateField: <K extends keyof T>(field: K) => Promise<string | null>;
  validateForm: () => Promise<ValidationErrors<T>>;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  handleReset: () => void;
  handleChange: <K extends keyof T>(field: K) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  handleBlur: <K extends keyof T>(field: K) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  getFieldProps: <K extends keyof T>(field: K) => {
    value: T[K];
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    name: string;
    id: string;
  };
}

export const useForm = <T extends Record<string, any>>(
  options: FormOptions<T>
): FormHookReturn<T> => {
  const {
    initialValues,
    validationRules = {},
    validateOnChange = true,
    validateOnBlur = true,
    validateOnSubmit = true,
    resetOnSubmit = false,
    onSubmit,
    onReset,
    onFieldChange,
  } = options;

  const [formState, setFormState] = useState<FormState<T>>(() => {
    const state: FormState<T> = {} as FormState<T>;
    for (const key in initialValues) {
      state[key] = {
        value: initialValues[key],
        error: null,
        touched: false,
        dirty: false,
      };
    }
    return state;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const initialValuesRef = useRef(initialValues);
  const validationRulesRef = useRef<Record<string, ValidationRule>>(validationRules as any);

  // Update refs when options change
  useEffect(() => {
    initialValuesRef.current = initialValues;
    validationRulesRef.current = validationRules;
  }, [initialValues, validationRules]);

  const validateSingleField = useCallback(<K extends keyof T>(
    field: K,
    value: T[K]
  ): string | null => {
    const rules = validationRulesRef.current[field as string];
    if (!rules) return null;

    // Required validation
    if (rules.required && (value === null || value === undefined || value === '')) {
      return 'This field is required';
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === null || value === undefined || value === '')) {
      return null;
    }

    // String validations
    if (typeof value === 'string') {
      if (rules.minLength && value.length < rules.minLength) {
        return `Minimum length is ${rules.minLength} characters`;
      }
      if (rules.maxLength && value.length > rules.maxLength) {
        return `Maximum length is ${rules.maxLength} characters`;
      }
      if (rules.pattern && !rules.pattern.test(value)) {
        return 'Invalid format';
      }
      if (rules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return 'Invalid email format';
      }
      if (rules.url && !/^https?:\/\/[^\s]+$/.test(value)) {
        return 'Invalid URL format';
      }
    }

    // Number validations
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        return `Minimum value is ${rules.min}`;
      }
      if (rules.max !== undefined && value > rules.max) {
        return `Maximum value is ${rules.max}`;
      }
    }

    // Custom validation
    if (rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, []);

  const validateField = useCallback(async <K extends keyof T>(
    field: K
  ): Promise<string | null> => {
    const value = formState[field].value;
    const error = validateSingleField(field, value);
    
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));

    return error;
  }, [formState, validateSingleField]);

  const validateForm = useCallback(async (): Promise<ValidationErrors<T>> => {
    setIsValidating(true);
    
    const errors: ValidationErrors<T> = {};
    
    for (const field in formState) {
      const error = validateSingleField(field, formState[field].value);
      if (error) {
        errors[field] = error;
      }
    }

    setFormState(prev => {
      const newState = { ...prev };
      for (const field in newState) {
        newState[field] = {
          ...newState[field],
          error: errors[field] || null,
        };
      }
      return newState;
    });

    setIsValidating(false);
    return errors;
  }, [formState, validateSingleField]);

  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        value,
        dirty: value !== initialValuesRef.current[field],
      },
    }));

    if (validateOnChange) {
      setTimeout(() => validateField(field), 0);
    }

    if (onFieldChange) {
      onFieldChange(field, value);
    }
  }, [validateOnChange, validateField, onFieldChange]);

  const setValues = useCallback((values: Partial<T>) => {
    setFormState(prev => {
      const newState = { ...prev };
      for (const field in values) {
        if (newState[field]) {
          newState[field] = {
            ...newState[field],
            value: values[field]!,
            dirty: values[field] !== initialValuesRef.current[field],
          };
        }
      }
      return newState;
    });

    if (validateOnChange) {
      Object.keys(values).forEach(field => {
        setTimeout(() => validateField(field as keyof T), 0);
      });
    }
  }, [validateOnChange, validateField]);

  const setError = useCallback(<K extends keyof T>(field: K, error: string | null) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        error,
      },
    }));
  }, []);

  const setErrors = useCallback((errors: Partial<ValidationErrors<T>>) => {
    setFormState(prev => {
      const newState = { ...prev };
      for (const field in errors) {
        if (newState[field]) {
          newState[field] = {
            ...newState[field],
            error: errors[field] || null,
          };
        }
      }
      return newState;
    });
  }, []);

  const setTouched = useCallback(<K extends keyof T>(field: K, touched: boolean) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        touched,
      },
    }));
  }, []);

  const setFieldTouched = useCallback((touched: { [K in keyof T]?: boolean }) => {
    setFormState(prev => {
      const newState = { ...prev };
      for (const field in touched) {
        if (newState[field]) {
          newState[field] = {
            ...newState[field],
            touched: touched[field] || false,
          };
        }
      }
      return newState;
    });
  }, []);

  const clearErrors = useCallback(() => {
    setFormState(prev => {
      const newState = { ...prev };
      for (const field in newState) {
        newState[field] = {
          ...newState[field],
          error: null,
        };
      }
      return newState;
    });
  }, []);

  const clearField = useCallback(<K extends keyof T>(field: K) => {
    setFormState(prev => ({
      ...prev,
      [field]: {
        value: initialValuesRef.current[field],
        error: null,
        touched: false,
        dirty: false,
      },
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormState(() => {
      const state: FormState<T> = {} as FormState<T>;
      for (const key in initialValuesRef.current) {
        state[key] = {
          value: initialValuesRef.current[key],
          error: null,
          touched: false,
          dirty: false,
        };
      }
      return state;
    });

    if (onReset) {
      onReset();
    }
  }, [onReset]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    setIsSubmitting(true);

    try {
      if (validateOnSubmit) {
        const errors = await validateForm();
        const hasErrors = Object.values(errors).some(error => error !== null);
        
        if (hasErrors) {
          setIsSubmitting(false);
          return;
        }
      }

      if (onSubmit) {
        const values = Object.keys(formState).reduce((acc, key) => {
          acc[key as keyof T] = formState[key as keyof T].value;
          return acc;
        }, {} as T);

        await onSubmit(values);
      }

      if (resetOnSubmit) {
        resetForm();
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [validateOnSubmit, validateForm, onSubmit, resetOnSubmit, resetForm, formState]);

  const handleReset = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleChange = useCallback(<K extends keyof T>(field: K) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    
    setValue(field, value as T[K]);
  }, [setValue]);

  const handleBlur = useCallback(<K extends keyof T>(field: K) => (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setTouched(field, true);
    
    if (validateOnBlur) {
      validateField(field);
    }
  }, [setTouched, validateOnBlur, validateField]);

  const getFieldProps = useCallback(<K extends keyof T>(field: K) => ({
    value: formState[field].value,
    onChange: handleChange(field),
    onBlur: handleBlur(field),
    name: String(field),
    id: String(field),
  }), [formState, handleChange, handleBlur]);

  // Computed values
  const values = Object.keys(formState).reduce((acc, key) => {
    acc[key as keyof T] = formState[key as keyof T].value;
    return acc;
  }, {} as T);

  const errors = Object.keys(formState).reduce((acc, key) => {
    acc[key as keyof T] = formState[key as keyof T].error || undefined;
    return acc;
  }, {} as ValidationErrors<T>);

  const touched = Object.keys(formState).reduce((acc, key) => {
    acc[key as keyof T] = formState[key as keyof T].touched;
    return acc;
  }, {} as { [K in keyof T]: boolean });

  const dirty = Object.keys(formState).reduce((acc, key) => {
    acc[key as keyof T] = formState[key as keyof T].dirty;
    return acc;
  }, {} as { [K in keyof T]: boolean });

  const isValid = Object.values(errors).every(error => !error);
  const isDirty = Object.values(dirty).some(Boolean);

  return {
    values,
    errors,
    touched,
    dirty,
    isSubmitting,
    isValidating,
    isValid,
    isDirty,
    formState,
    setValue,
    setValues,
    setError,
    setErrors,
    setTouched,
    setFieldTouched,
    clearErrors,
    clearField,
    resetForm,
    validateField,
    validateForm,
    handleSubmit,
    handleReset,
    handleChange,
    handleBlur,
    getFieldProps,
  };
};

export default useForm;