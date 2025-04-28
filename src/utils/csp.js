// Content Security Policy configuration
export const csp = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'", "data:"],
  'img-src': ["'self'", "data:", "https:"],
  'connect-src': ["'self'"],
  'worker-src': ["'self'"],
}; 