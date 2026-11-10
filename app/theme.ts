'use client';

import { createTheme } from '@mui/material/styles';

/**
 * Calm, ADHD-friendly theme.
 * Goals (WCAG 2.2 AA + W3C COGA): high contrast, generous spacing,
 * large touch targets, readable type, no shouting ALL-CAPS buttons.
 */
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#00695f', contrastText: '#ffffff' }, // calm teal, AA on white
    secondary: { main: '#5e548e' }, // muted violet accent
    success: { main: '#2e7d32' },
    warning: { main: '#b26a00' }, // darkened for AA contrast
    error: { main: '#c62828' },
    background: { default: '#f7f9f9', paper: '#ffffff' },
    text: { primary: '#1b2423', secondary: '#45514f' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontSize: 16,
    h1: { fontSize: '2rem', fontWeight: 700 },
    h2: { fontSize: '1.5rem', fontWeight: 700 },
    h3: { fontSize: '1.25rem', fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
    body1: { lineHeight: 1.6 },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: { minHeight: 48, paddingInline: 20, fontSize: '1rem' }, // large touch target
      },
    },
    MuiIconButton: {
      styleOverrides: { root: { minWidth: 44, minHeight: 44 } },
    },
    MuiLink: {
      defaultProps: { underline: 'always' }, // links are visibly links (COGA)
    },
  },
});

export default theme;
