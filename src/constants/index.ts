export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    PROFILE: "/api/auth/profile",
  },
  PROPERTIES: {
    BASE: "/api/properties",
    BY_ID: (id: string) => `/api/properties/${id}`,
  },
  TENANTS: {
    BASE: "/api/tenants",
    BY_ID: (id: string) => `/api/tenants/${id}`,
  },
  MAINTENANCE: {
    BASE: "/api/maintenance",
    BY_ID: (id: string) => `/api/maintenance/${id}`,
  },
  HEALTH: "/api/health",
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

export const VALIDATION = {
  PASSWORD_MIN_LENGTH: 6,
  PHONE_REGEX: /^\+?[1-9]\d{1,14}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};
