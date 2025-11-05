// Comprehensive Validation Utilities Tests
import {
  FormValidator,
  ValidationPatterns,
  ValidationMessages,
  createEmailValidator,
  createPasswordValidator,
  createLoginValidator,
  createRegisterValidator,
} from '../../utils/validation';

describe('FormValidator', () => {
  let validator: FormValidator;

  beforeEach(() => {
    validator = new FormValidator();
  });

  describe('Required Validation', () => {
    it('validates required fields', () => {
      validator.addRule('name', { required: true });
      
      expect(validator.validateField('name', '')).toBe('This field is required');
      expect(validator.validateField('name', '   ')).toBe('This field is required');
      expect(validator.validateField('name', 'John')).toBeNull();
    });

    it('validates required fields with custom message', () => {
      validator.addRule('name', { required: true, message: 'Name is required' });
      
      expect(validator.validateField('name', '')).toBe('Name is required');
    });
  });

  describe('Length Validation', () => {
    it('validates minimum length', () => {
      validator.addRule('password', { minLength: 8 });
      
      expect(validator.validateField('password', '123')).toBe('Minimum length is 8 characters');
      expect(validator.validateField('password', '12345678')).toBeNull();
    });

    it('validates maximum length', () => {
      validator.addRule('description', { maxLength: 100 });
      
      expect(validator.validateField('description', 'a'.repeat(101))).toBe('Maximum length is 100 characters');
      expect(validator.validateField('description', 'a'.repeat(100))).toBeNull();
    });

    it('validates both min and max length', () => {
      validator.addRule('username', { minLength: 3, maxLength: 20 });
      
      expect(validator.validateField('username', 'ab')).toBe('Minimum length is 3 characters');
      expect(validator.validateField('username', 'a'.repeat(21))).toBe('Maximum length is 21 characters');
      expect(validator.validateField('username', 'abc')).toBeNull();
    });
  });

  describe('Pattern Validation', () => {
    it('validates email pattern', () => {
      validator.addRule('email', { pattern: ValidationPatterns.email });
      
      expect(validator.validateField('email', 'invalid-email')).toBe('Invalid format');
      expect(validator.validateField('email', 'test@example.com')).toBeNull();
    });

    it('validates phone pattern', () => {
      validator.addRule('phone', { pattern: ValidationPatterns.phone });
      
      expect(validator.validateField('phone', 'invalid-phone')).toBe('Invalid format');
      expect(validator.validateField('phone', '+1234567890')).toBeNull();
    });

    it('validates password pattern', () => {
      validator.addRule('password', { pattern: ValidationPatterns.password });
      
      expect(validator.validateField('password', 'weak')).toBe('Invalid format');
      expect(validator.validateField('password', 'StrongPass123!')).toBeNull();
    });
  });

  describe('Custom Validation', () => {
    it('validates with custom function', () => {
      validator.addRule('age', {
        custom: (value) => {
          const age = parseInt(value);
          if (isNaN(age) || age < 18) {
            return 'Must be at least 18 years old';
          }
          return null;
        },
      });
      
      expect(validator.validateField('age', '17')).toBe('Must be at least 18 years old');
      expect(validator.validateField('age', '18')).toBeNull();
    });

    it('validates with custom function accessing form data', () => {
      validator.addRule('confirmPassword', {
        custom: (value, formData) => {
          if (value !== formData?.password) {
            return 'Passwords do not match';
          }
          return null;
        },
      });
      
      const formData = { password: 'password123' };
      expect(validator.validateField('confirmPassword', 'different', formData)).toBe('Passwords do not match');
      expect(validator.validateField('confirmPassword', 'password123', formData)).toBeNull();
    });
  });

  describe('Form Validation', () => {
    it('validates entire form', () => {
      validator
        .addRule('email', { required: true, pattern: ValidationPatterns.email })
        .addRule('password', { required: true, minLength: 8 });

      const formData = {
        email: 'invalid-email',
        password: '123',
      };

      const result = validator.validateForm(formData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Invalid format');
      expect(result.errors.password).toBe('Minimum length is 8 characters');
    });

    it('returns valid result for valid form', () => {
      validator
        .addRule('email', { required: true, pattern: ValidationPatterns.email })
        .addRule('password', { required: true, minLength: 8 });

      const formData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validator.validateForm(formData);
      
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
    });
  });

  describe('Multiple Rules', () => {
    it('validates multiple rules for same field', () => {
      validator
        .addRule('email', { required: true })
        .addRule('email', { pattern: ValidationPatterns.email });

      expect(validator.validateField('email', '')).toBe('This field is required');
      expect(validator.validateField('email', 'invalid')).toBe('Invalid format');
      expect(validator.validateField('email', 'test@example.com')).toBeNull();
    });
  });
});

describe('Validation Patterns', () => {
  describe('Email Pattern', () => {
    it('validates correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@domain.co.uk',
        'user+tag@example.org',
        'user123@test-domain.com',
      ];

      validEmails.forEach(email => {
        expect(ValidationPatterns.email.test(email)).toBe(true);
      });
    });

    it('rejects invalid email formats', () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test.example.com',
        '',
      ];

      invalidEmails.forEach(email => {
        expect(ValidationPatterns.email.test(email)).toBe(false);
      });
    });
  });

  describe('Phone Pattern', () => {
    it('validates correct phone formats', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+44123456789',
        '123456789012345',
      ];

      validPhones.forEach(phone => {
        expect(ValidationPatterns.phone.test(phone)).toBe(true);
      });
    });

    it('rejects invalid phone formats', () => {
      const invalidPhones = [
        '123',
        'abc123',
        '+123-456-7890',
        '',
      ];

      invalidPhones.forEach(phone => {
        expect(ValidationPatterns.phone.test(phone)).toBe(false);
      });
    });
  });

  describe('Password Pattern', () => {
    it('validates strong passwords', () => {
      const strongPasswords = [
        'Password123!',
        'MyStr0ng#Pass',
        'ComplexP@ssw0rd',
      ];

      strongPasswords.forEach(password => {
        expect(ValidationPatterns.password.test(password)).toBe(true);
      });
    });

    it('rejects weak passwords', () => {
      const weakPasswords = [
        'password',
        '12345678',
        'PASSWORD',
        'Pass123',
        'Password!',
        '',
      ];

      weakPasswords.forEach(password => {
        expect(ValidationPatterns.password.test(password)).toBe(false);
      });
    });
  });
});

describe('Predefined Validators', () => {
  describe('Email Validator', () => {
    it('validates email correctly', () => {
      const validator = createEmailValidator();
      
      expect(validator.validateField('email', '')).toBe('This field is required');
      expect(validator.validateField('email', 'invalid')).toBe('Please enter a valid email address');
      expect(validator.validateField('email', 'test@example.com')).toBeNull();
    });
  });

  describe('Password Validator', () => {
    it('validates password correctly', () => {
      const validator = createPasswordValidator();
      
      expect(validator.validateField('password', '')).toBe('This field is required');
      expect(validator.validateField('password', 'weak')).toBe('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      expect(validator.validateField('password', 'StrongPass123!')).toBeNull();
    });
  });

  describe('Login Validator', () => {
    it('validates login form correctly', () => {
      const validator = createLoginValidator();
      
      const invalidData = { email: 'invalid', password: '123' };
      const result = validator.validateForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.password).toBe('Password must be at least 6 characters');
    });
  });

  describe('Register Validator', () => {
    it('validates registration form correctly', () => {
      const validator = createRegisterValidator();
      
      const invalidData = {
        email: 'invalid',
        password: 'weak',
        confirmPassword: 'different',
        firstName: 'A',
        lastName: 'B',
        phone: 'invalid',
      };
      
      const result = validator.validateForm(invalidData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.password).toBe('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      expect(result.errors.confirmPassword).toBe('Passwords do not match');
      expect(result.errors.firstName).toBe('First name must be between 2 and 50 characters');
      expect(result.errors.lastName).toBe('Last name must be between 2 and 50 characters');
      expect(result.errors.phone).toBe('Please enter a valid phone number');
    });

    it('validates matching passwords', () => {
      const validator = createRegisterValidator();
      
      const formData = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        confirmPassword: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
      };
      
      const result = validator.validateForm(formData);
      expect(result.isValid).toBe(true);
    });
  });
});

describe('Validation Messages', () => {
  it('provides correct default messages', () => {
    expect(ValidationMessages.required).toBe('This field is required');
    expect(ValidationMessages.email).toBe('Please enter a valid email address');
    expect(ValidationMessages.phone).toBe('Please enter a valid phone number');
    expect(ValidationMessages.password).toBe('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
  });

  it('provides dynamic messages', () => {
    expect(ValidationMessages.minLength(5)).toBe('Minimum length is 5 characters');
    expect(ValidationMessages.maxLength(100)).toBe('Maximum length is 100 characters');
  });
});

