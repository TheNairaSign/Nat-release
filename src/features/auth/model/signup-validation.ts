export const GENDER_OPTIONS = ['male', 'female', 'others'] as const;

export type SignupFields = {
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  password: string;
  confirmPassword: string;
  age: string;
  gender: string;
};

export type SignupFieldName = keyof SignupFields;
export type SignupErrors = Record<SignupFieldName, string>;

export const emptySignupFields: SignupFields = {
  firstName: '',
  lastName: '',
  email: '',
  city: '',
  password: '',
  confirmPassword: '',
  age: '',
  gender: '',
};

export const emptySignupErrors: SignupErrors = {
  firstName: '',
  lastName: '',
  email: '',
  city: '',
  password: '',
  confirmPassword: '',
  age: '',
  gender: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[a-zA-Z\s]+$/;
const PASSWORD_PATTERN = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;

export function validateSignupField(
  name: SignupFieldName,
  value: string,
  fields: SignupFields,
): string {
  switch (name) {
    case 'firstName':
      if (!value.trim()) return 'First name is required';
      if (value.trim().length < 2)
        return 'First name must be at least 2 characters';
      if (!NAME_PATTERN.test(value))
        return 'First name can only contain letters';
      return '';
    case 'lastName':
      if (!value.trim()) return 'Last name is required';
      if (value.trim().length < 2)
        return 'Last name must be at least 2 characters';
      if (!NAME_PATTERN.test(value))
        return 'Last name can only contain letters';
      return '';
    case 'email':
      if (!value) return 'Email is required';
      if (!EMAIL_PATTERN.test(value))
        return 'Please enter a valid email address';
      return '';
    case 'city':
      if (!value.trim()) return 'Town / city is required';
      if (value.trim().length < 2) return 'Enter a valid town or city';
      return '';
    case 'password':
      if (!value) return 'Password is required';
      if (value.length < 8) return 'Password must be at least 8 characters';
      if (!PASSWORD_PATTERN.test(value)) {
        return 'Password must contain uppercase, lowercase, and number';
      }
      return '';
    case 'confirmPassword':
      if (!value) return 'Please confirm your password';
      if (value !== fields.password) return 'Passwords do not match';
      return '';
    case 'age':
      if (!value) return 'Age is required';
      if (Number.isNaN(Number(value))) return 'Age must be a number';
      if (Number(value) < 13)
        return 'You must be at least 13 years old to create an account';
      if (Number(value) > 120) return 'Please enter a valid age';
      return '';
    case 'gender':
      if (!value) return 'Gender is required';
      return '';
    default:
      return '';
  }
}

export function validateSignupForm(fields: SignupFields): SignupErrors {
  return {
    firstName: validateSignupField('firstName', fields.firstName, fields),
    lastName: validateSignupField('lastName', fields.lastName, fields),
    email: validateSignupField('email', fields.email, fields),
    city: validateSignupField('city', fields.city, fields),
    password: validateSignupField('password', fields.password, fields),
    confirmPassword: validateSignupField(
      'confirmPassword',
      fields.confirmPassword,
      fields,
    ),
    age: validateSignupField('age', fields.age, fields),
    gender: validateSignupField('gender', fields.gender, fields),
  };
}

export function hasSignupErrors(errors: SignupErrors): boolean {
  return Object.values(errors).some((message) => message.length > 0);
}

export function groupedSignupError(
  errors: SignupErrors,
  keys: readonly SignupFieldName[],
): string {
  return (
    keys.map((key) => errors[key]).find((message) => message.length > 0) ?? ''
  );
}

export function wantsThingsMatchFlow(query: {
  thingsmatch?: string;
  origin?: string;
  tm?: string;
}): boolean {
  return (
    query.thingsmatch === '1' ||
    query.thingsmatch === 'true' ||
    query.origin === 'thingsmatch' ||
    query.tm === '1'
  );
}

export function validateOtp(otp: string): string {
  if (!otp) return 'OTP is required';
  if (otp.length !== 6 || Number.isNaN(Number(otp)))
    return 'OTP must be 6 characters long';
  return '';
}
