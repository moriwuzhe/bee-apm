import { useState, useCallback, useMemo } from "react";

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  validate?: (values: T) => Record<string, string> | Promise<Record<string, string>>;
  onValidationError?: (errors: Record<string, string>) => void;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  setFieldValue: <K extends keyof T>(field: K, value: T[K]) => void;
  setFieldTouched: <K extends keyof T>(field: K, touched?: boolean) => void;
  setValues: (values: Partial<T>) => void;
  handleChange: <K extends keyof T>(field: K) => (e: { target: { value: T[K] } }) => void;
  handleBlur: <K extends keyof T>(field: K) => () => void;
  handleSubmit: (e?: React.FormEvent) => Promise<void>;
  resetForm: () => void;
  isValid: boolean;
}

export function useForm<T extends Record<string, any>>(
  options: UseFormOptions<T>
): UseFormReturn<T> {
  const {
    initialValues,
    onSubmit,
    validate,
    onValidationError,
  } = options;
  const [values, setValuesState] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const setFieldValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValuesState(prev => ({ ...prev, [field]: value }));
  }, []);
  const setFieldTouched = useCallback(<K extends keyof T>(field: K, isTouched = true) => {
    setTouched(prev => ({ ...prev, [field]: isTouched }));
  }, []);
  const setValues = useCallback((newValues: Partial<T>) => {
    setValuesState(prev => ({ ...prev, ...newValues }));
  }, []);
  const handleChange = useCallback(<K extends keyof T>(field: K) => {
    return (e: { target: { value: T[K] } }) => {
      setFieldValue(field, e.target.value);
    };
  }, [setFieldValue]);
  const handleBlur = useCallback(<K extends keyof T>(field: K) => {
    return () => {
      setFieldTouched(field);
    };
  }, [setFieldTouched]);
  const resetForm = useCallback(() => {
    setValuesState(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    let validationErrors: Record<string, string> = {};
    if (validate) {
      const result = validate(values);
      validationErrors = result instanceof Promise ? await result : result;
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      onValidationError?.(validationErrors);
      return;
    }
    try {
      setIsSubmitting(true);
      await onSubmit(values);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, validate, onValidationError, onSubmit]);
  return {
    values,
    errors,
    touched,
    isSubmitting,
    setFieldValue,
    setFieldTouched,
    setValues,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    isValid,
  };
}