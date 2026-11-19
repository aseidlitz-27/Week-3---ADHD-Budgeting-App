# Skill: Performance & Optimization Guardrails

## Context & Purpose
Prevent performance bottlenecks, slow loading times, and bloated bundle sizes across the stack.

## Mandatory Rules
- **Lean Imports:** Never import entire heavy libraries for a single function. Use explicit sub-path or targeted imports (e.g., `import debounce from 'lodash/debounce'`).
- **Data Pagination:** All backend list-fetching endpoints must implement pagination, limits, or cursors by default to prevent pulling massive datasets.
- **Frontend Efficiency:** Avoid unnecessary re-renders in components and leverage lazy-loading or code-splitting for heavy views.
0

