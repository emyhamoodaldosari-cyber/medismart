/**
 * Design System Constants
 * Ensures visual consistency across the entire application
 */

// Color Palette
export const COLORS = {
  // Primary
  PRIMARY: '#099aa7',
  PRIMARY_DARK: '#088a96',
  PRIMARY_LIGHT: '#0db8c4',

  // Semantic
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6',

  // Neutral
  HEADING: '#1f2f31',
  TEXT_DEFAULT: '#363f40',
  TEXT_SECONDARY: '#6b7280',
  TEXT_MUTED: '#9ca3af',
  BORDER: '#e5e7eb',
  BORDER_LIGHT: '#f3f4f6',
  BACKGROUND: '#ffffff',
  BACKGROUND_LIGHT: '#f9fafb',
  BACKGROUND_LIGHTER: '#f3f4f6',

  // Status
  STATUS_PENDING: '#f59e0b',
  STATUS_CONFIRMED: '#3b82f6',
  STATUS_PREPARING: '#8b5cf6',
  STATUS_READY: '#06b6d4',
  STATUS_SHIPPED: '#6366f1',
  STATUS_COMPLETED: '#10b981',
  STATUS_CANCELLED: '#ef4444',
};

// Typography Scale
export const TYPOGRAPHY = {
  // Font Families
  FONT_SANS: '"Inter", system-ui, sans-serif',
  FONT_HEADING: '"Outfit", sans-serif',

  // Font Sizes
  SIZE: {
    XS: '0.75rem',      // 12px
    SM: '0.875rem',     // 14px
    BASE: '1rem',       // 16px
    LG: '1.125rem',     // 18px
    XL: '1.25rem',      // 20px
    '2XL': '1.5rem',    // 24px
    '3XL': '1.875rem',  // 30px
    '4XL': '2.25rem',   // 36px
    '5XL': '3rem',      // 48px
  },

  // Font Weights
  WEIGHT: {
    REGULAR: 400,
    MEDIUM: 500,
    SEMIBOLD: 600,
    BOLD: 700,
  },

  // Line Heights
  LINE_HEIGHT: {
    TIGHT: 1.2,
    NORMAL: 1.5,
    RELAXED: 1.75,
  },

  // Letter Spacing
  LETTER_SPACING: {
    TIGHT: '-0.02em',
    NORMAL: '0em',
    WIDE: '0.05em',
    WIDER: '0.1em',
  },
};

// Spacing Scale (8px base)
export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
};

// Border Radius
export const BORDER_RADIUS = {
  NONE: '0',
  SM: '0.375rem',    // 6px
  BASE: '0.5rem',    // 8px
  MD: '0.75rem',     // 12px
  LG: '1rem',        // 16px
  XL: '1.5rem',      // 24px
  '2XL': '2rem',     // 32px
  FULL: '9999px',
};

// Shadows
export const SHADOWS = {
  NONE: 'none',
  SM: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  BASE: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  MD: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  LG: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  XL: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
};

// Transitions
export const TRANSITIONS = {
  FAST: '150ms ease-in-out',
  BASE: '200ms ease-in-out',
  SLOW: '300ms ease-in-out',
};

// Breakpoints
export const BREAKPOINTS = {
  SM: '640px',
  MD: '768px',
  LG: '1024px',
  XL: '1280px',
  '2XL': '1536px',
};

// Component Sizes
export const COMPONENT_SIZES = {
  // Button Heights
  BUTTON_SM: '2.5rem',      // 40px
  BUTTON_BASE: '3rem',      // 48px
  BUTTON_LG: '3.5rem',      // 56px

  // Input Heights
  INPUT_SM: '2.25rem',      // 36px
  INPUT_BASE: '2.75rem',    // 44px
  INPUT_LG: '3.25rem',      // 52px

  // Icon Sizes
  ICON_SM: '1rem',          // 16px
  ICON_BASE: '1.5rem',      // 24px
  ICON_LG: '2rem',          // 32px
  ICON_XL: '2.5rem',        // 40px

  // Header Height
  HEADER_HEIGHT: '5rem',    // 80px

  // Container Max Width
  CONTAINER_MAX: '1280px',
};

// Z-Index Scale
export const Z_INDEX = {
  HIDE: -1,
  BASE: 0,
  DROPDOWN: 10,
  STICKY: 20,
  FIXED: 30,
  MODAL_BACKDROP: 40,
  MODAL: 50,
  POPOVER: 60,
  TOOLTIP: 70,
  NOTIFICATION: 80,
};

// Focus States (for accessibility)
export const FOCUS_STYLES = {
  OUTLINE: `outline 2px solid ${COLORS.PRIMARY}`,
  OUTLINE_OFFSET: 'outline-offset 2px',
  RING: `ring-2 ring-${COLORS.PRIMARY} ring-offset-2`,
};

// Status Badge Styles
export const STATUS_BADGE_STYLES = {
  PENDING: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    border: 'border-yellow-200',
  },
  CONFIRMED: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
  },
  PREPARING: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
  },
  READY: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
  },
  SHIPPED: {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-200',
  },
  COMPLETED: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    border: 'border-green-200',
  },
  CANCELLED: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-200',
  },
};

// Stock Status Styles
export const STOCK_STATUS_STYLES = {
  IN_STOCK: {
    bg: 'bg-green-50',
    text: 'text-green-700',
    badge: 'In Stock',
  },
  LIMITED: {
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    badge: 'Limited Stock',
  },
  OUT_OF_STOCK: {
    bg: 'bg-red-50',
    text: 'text-red-700',
    badge: 'Out of Stock',
  },
};

export default {
  COLORS,
  TYPOGRAPHY,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  TRANSITIONS,
  BREAKPOINTS,
  COMPONENT_SIZES,
  Z_INDEX,
  FOCUS_STYLES,
  STATUS_BADGE_STYLES,
  STOCK_STATUS_STYLES,
};
