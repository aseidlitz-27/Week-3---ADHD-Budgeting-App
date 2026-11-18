# Skill: Security & Data Protection Guardrails

## Mandatory Rules
- **Input Validation:** Validate all input data using schema validation (e.g., Zod) before handling.
- **Database Security:** Always use parameterized queries; never concatenate strings into queries.
- **Secrets:** Store API keys in environment variables (`process.env`), never hardcoded in files.0
