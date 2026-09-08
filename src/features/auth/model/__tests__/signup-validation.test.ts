import {
  emptySignupFields,
  groupedSignupError,
  hasSignupErrors,
  validateOtp,
  validateSignupField,
  validateSignupForm,
  wantsThingsMatchFlow,
} from '../signup-validation';

const valid = {
  ...emptySignupFields,
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@natcycle.app',
  city: 'Hamden',
  password: 'Secret1x',
  confirmPassword: 'Secret1x',
  age: '28',
  gender: 'female',
};

describe('validateSignupField', () => {
  it('rejects short and non-letter names', () => {
    expect(validateSignupField('firstName', '', valid)).toBe(
      'First name is required',
    );
    expect(validateSignupField('firstName', 'A', valid)).toBe(
      'First name must be at least 2 characters',
    );
    expect(validateSignupField('firstName', 'Ada2', valid)).toBe(
      'First name can only contain letters',
    );
    expect(validateSignupField('lastName', '', valid)).toBe(
      'Last name is required',
    );
  });

  it('rejects invalid emails and weak passwords', () => {
    expect(validateSignupField('email', '', valid)).toBe('Email is required');
    expect(validateSignupField('email', 'ada@', valid)).toBe(
      'Please enter a valid email address',
    );
    expect(validateSignupField('password', 'short', valid)).toBe(
      'Password must be at least 8 characters',
    );
    expect(validateSignupField('password', 'alllowercase1', valid)).toBe(
      'Password must contain uppercase, lowercase, and number',
    );
    expect(validateSignupField('confirmPassword', 'other', valid)).toBe(
      'Passwords do not match',
    );
  });

  it('enforces age bounds and required gender', () => {
    expect(validateSignupField('age', '12', valid)).toBe(
      'You must be at least 13 years old to create an account',
    );
    expect(validateSignupField('age', '121', valid)).toBe(
      'Please enter a valid age',
    );
    expect(validateSignupField('age', 'ab', valid)).toBe(
      'Age must be a number',
    );
    expect(validateSignupField('gender', '', valid)).toBe('Gender is required');
  });

  it('requires town / city', () => {
    expect(validateSignupField('city', '', valid)).toBe(
      'Town / city is required',
    );
    expect(validateSignupField('city', 'H', valid)).toBe(
      'Enter a valid town or city',
    );
  });
});

describe('validateSignupForm', () => {
  it('accepts a complete valid form', () => {
    expect(hasSignupErrors(validateSignupForm(valid))).toBe(false);
  });

  it('returns the first grouped field error', () => {
    const errors = validateSignupForm({
      ...valid,
      firstName: '',
      lastName: 'X',
    });
    expect(groupedSignupError(errors, ['firstName', 'lastName'])).toBe(
      'First name is required',
    );
  });
});

describe('wantsThingsMatchFlow', () => {
  it('detects the web query flags', () => {
    expect(wantsThingsMatchFlow({ thingsmatch: '1' })).toBe(true);
    expect(wantsThingsMatchFlow({ origin: 'thingsmatch' })).toBe(true);
    expect(wantsThingsMatchFlow({})).toBe(false);
  });
});

describe('validateOtp', () => {
  it('requires a 6-digit code', () => {
    expect(validateOtp('')).toBe('OTP is required');
    expect(validateOtp('123')).toBe('OTP must be 6 characters long');
    expect(validateOtp('abcdef')).toBe('OTP must be 6 characters long');
    expect(validateOtp('123456')).toBe('');
  });
});
