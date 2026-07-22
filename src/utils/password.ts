export type PasswordIssue =
  | 'passwordMinLength'
  | 'passwordLowercase'
  | 'passwordUppercase'
  | 'passwordDigit'
  | 'passwordSpecial';

export const PASSWORD_MIN_LENGTH = 8;

export function getPasswordIssue(password: string): PasswordIssue | undefined {
  if (password.length < PASSWORD_MIN_LENGTH) return 'passwordMinLength';
  if (!/[a-z]/.test(password)) return 'passwordLowercase';
  if (!/[A-Z]/.test(password)) return 'passwordUppercase';
  if (!/[0-9]/.test(password)) return 'passwordDigit';
  if (!/[^A-Za-z0-9]/.test(password)) return 'passwordSpecial';
  return undefined;
}
