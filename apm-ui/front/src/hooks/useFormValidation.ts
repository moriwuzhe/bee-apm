import { useState, useCallback, useMemo } from "react";

export interface ValidationRule {
  field: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  message: string;
}

export interface UseFormValidationReturn {
  values: Record<string, string>;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isValid: boolean;
  handleChange: (field: string, value: string) => void;
  handleBlur: (field: string) => void;
  validate: () => boolean;
  reset: () => void;
  setValues: (values: Record<string, string>) => void;
}

export function useFormValidation(
  initialValues: Record<string, string> = {},
  rules: ValidationRule[] = []
): UseFormValidationReturn {
  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback(
    (field: string, value: string): string => {
      const fieldRules = rules.filter((r) => r.field === field);
      for (const rule of fieldRules) {
        if (rule.required && !value.trim()) {
          return rule.message;
        }
        if (rule.minLength && value.length < rule.minLength) {
          return rule.message;
        }
        if (rule.maxLength && value.length > rule.maxLength) {
          return rule.message;
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          return rule.message;
        }
      }
      return "";
    },
    [rules]
  );

  const validateAll = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    rules.forEach((rule) => {
      const value = values[rule.field] || "";
      const error = validateField(rule.field, value);
      if (error) {
        newErrors[rule.field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, rules, validateField]);

  const handleChange = useCallback(
    (field: string, value: string) => {
      setValues((prev) => ({ ...prev, [field]: value }));
      if (touched[field]) {
        const error = validateField(field, value);
        setErrors((prev) => ({ ...prev, [field]: error }));
      }
    },
    [touched, validateField]
  );

  const handleBlur = useCallback(
    (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      const value = values[field] || "";
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    },
    [values, validateField]
  );

  const validate = useCallback(() => {
    const allTouched: Record<string, boolean> = {};
    rules.forEach((rule) => {
      allTouched[rule.field] = true;
    });
    setTouched(allTouched);
    return validateAll();
  }, [rules, validateAll]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  return {
    values,
    errors,
    touched,
    isValid,
    handleChange,
    handleBlur,
    validate,
    reset,
    setValues,
  };
}
