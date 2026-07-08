import { VALIDATION } from '../constants/constants';

// ==============================================================
// Validators
// ==============================================================

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  if (!VALIDATION.EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  return { valid: true, error: null };
}

/**
 * Validate password strength
 */
export function validatePassword(password) {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password is required' };
  }
  if (password.length < VALIDATION.MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${VALIDATION.MIN_PASSWORD_LENGTH} characters long`,
    };
  }
  return { valid: true, error: null };
}

/**
 * Validate compose email form
 */
export function validateComposeForm({ recipient, subject, body }) {
  const errors = {};

  const emailResult = validateEmail(recipient);
  if (!emailResult.valid) {
    errors.recipient = emailResult.error;
  }

  if (!subject || subject.trim().length === 0) {
    errors.subject = 'Subject is required';
  } else if (subject.length > VALIDATION.MAX_SUBJECT_LENGTH) {
    errors.subject = `Subject must be under ${VALIDATION.MAX_SUBJECT_LENGTH} characters`;
  }

  if (!body || body.trim().length === 0) {
    errors.body = 'Message body is required';
  } else if (body.length > VALIDATION.MAX_BODY_LENGTH) {
    errors.body = 'Message is too long';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validate passkey for encryption
 */
export function validatePasskey(passkey) {
  if (!passkey || passkey.trim().length === 0) {
    return { valid: false, error: 'Passkey is required for encrypted emails' };
  }
  if (passkey.length < 4) {
    return { valid: false, error: 'Passkey must be at least 4 characters' };
  }
  return { valid: true, error: null };
}

/**
 * Validate registration form
 */
export function validateRegistrationForm({ email, password, confirmPassword }) {
  const errors = {};

  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    errors.email = emailResult.error;
  }

  const passwordResult = validatePassword(password);
  if (!passwordResult.valid) {
    errors.password = passwordResult.error;
  }

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
