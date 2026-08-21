import { useState } from 'react';

import {
  emptySignupErrors,
  emptySignupFields,
  hasSignupErrors,
  validateSignupField,
  validateSignupForm,
  type SignupFieldName,
  type SignupFields,
} from '../model/signup-validation';

export function useSignupForm(initialReferral = '') {
  const [fields, setFields] = useState<SignupFields>(emptySignupFields);
  const [errors, setErrors] = useState(emptySignupErrors);
  const [referralId, setReferralId] = useState(initialReferral);

  function change(name: SignupFieldName, value: string) {
    const next = { ...fields, [name]: value };
    setFields(next);
    const nextErrors = {
      ...errors,
      [name]: validateSignupField(name, value, next),
    };
    if (name === 'password' && next.confirmPassword) {
      nextErrors.confirmPassword = validateSignupField(
        'confirmPassword',
        next.confirmPassword,
        next,
      );
    }
    setErrors(nextErrors);
  }

  function validateAll(): boolean {
    const next = validateSignupForm(fields);
    setErrors(next);
    return !hasSignupErrors(next);
  }

  return { fields, errors, referralId, setReferralId, change, validateAll };
}
