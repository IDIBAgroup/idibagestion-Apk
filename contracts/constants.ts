export const Session = {
  cookieName: "idibages_sid",
  maxAgeMs: 7 * 24 * 60 * 60 * 1000,
} as const;

export const PasswordRules = {
  minLength: 12,
  maxLength: 128,
} as const;

export const ErrorMessages = {
  unauthenticated: "Authentication required",
  insufficientRole: "Insufficient permissions",
} as const;

export const Paths = {
  login: "/login",
} as const;
