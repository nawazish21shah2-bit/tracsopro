// Form Validation Utilities
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export class FormValidator {
  private rules: Record<string, ValidationRule[]> = {};

  addRule(field: string, rule: ValidationRule) {
    if (!this.rules[field]) {
      this.rules[field] = [];
    }
    this.rules[field].push(rule);
    return this;
  }

  validateField(field: string, value: any): string | null {
    const fieldRules = this.rules[field];
    if (!fieldRules) return null;

    for (const rule of fieldRules) {
      const error = this.validateRule(value, rule);
      if (error) return error;
    }

    return null;
  }

  validateForm(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {};

    for (const field in this.rules) {
      const error = this.validateField(field, data[field]);
      if (error) {
        errors[field] = error;
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  }

  private validateRule(value: any, rule: ValidationRule): string | null {
    // Required validation
    if (rule.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return rule.message || 'This field is required';
    }

    // Skip other validations if value is empty and not required
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    // Min length validation
    if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
      return rule.message || `Minimum length is ${rule.minLength} characters`;
    }

    // Max length validation
    if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
      return rule.message || `Maximum length is ${rule.maxLength} characters`;
    }

    // Pattern validation
    if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
      return rule.message || 'Invalid format';
    }

    // Custom validation
    if (rule.custom) {
      const customError = rule.custom(value);
      if (customError) {
        return customError;
      }
    }

    return null;
  }
}

// Common validation patterns
export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[\+]?[1-9][\d]{0,15}$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  alphanumeric: /^[a-zA-Z0-9]+$/,
  numeric: /^\d+$/,
  url: /^https?:\/\/.+/,
};

// Common validation messages
export const ValidationMessages = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  phone: 'Please enter a valid phone number',
  password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  minLength: (min: number) => `Minimum length is ${min} characters`,
  maxLength: (max: number) => `Maximum length is ${max} characters`,
  pattern: 'Invalid format',
};

// Predefined validators for common fields
export const createEmailValidator = () => {
  return new FormValidator()
    .addRule('email', {
      required: true,
      pattern: ValidationPatterns.email,
      message: ValidationMessages.email,
    });
};

export const createPasswordValidator = () => {
  return new FormValidator()
    .addRule('password', {
      required: true,
      minLength: 8,
      pattern: ValidationPatterns.password,
      message: ValidationMessages.password,
    });
};

export const createLoginValidator = () => {
  return new FormValidator()
    .addRule('email', {
      required: true,
      pattern: ValidationPatterns.email,
      message: ValidationMessages.email,
    })
    .addRule('password', {
      required: true,
      minLength: 6,
      message: 'Password must be at least 6 characters',
    });
};

export const createRegisterValidator = () => {
  return new FormValidator()
    .addRule('email', {
      required: true,
      pattern: ValidationPatterns.email,
      message: ValidationMessages.email,
    })
    .addRule('password', {
      required: true,
      minLength: 8,
      pattern: ValidationPatterns.password,
      message: ValidationMessages.password,
    })
    .addRule('confirmPassword', {
      required: true,
      custom: (value, formData) => {
        if (value !== formData?.password) {
          return 'Passwords do not match';
        }
        return null;
      },
    })
    .addRule('firstName', {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: 'First name must be between 2 and 50 characters',
    })
    .addRule('lastName', {
      required: true,
      minLength: 2,
      maxLength: 50,
      message: 'Last name must be between 2 and 50 characters',
    })
    .addRule('phone', {
      required: true,
      pattern: ValidationPatterns.phone,
      message: ValidationMessages.phone,
    });
};

export default FormValidator;

