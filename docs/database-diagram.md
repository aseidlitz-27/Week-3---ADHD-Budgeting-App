# Database Diagram — ADHD Budgeting App (MVP #1)

Entity-relationship diagram of the Supabase schema. GitHub renders the Mermaid
block below as a picture. Cross-checked against Supabase's Schema Visualizer.

Every table is owned by a Supabase auth user and protected by owner-only Row
Level Security. `USERS` is Supabase's built-in `auth.users`.

```mermaid
erDiagram
    USERS ||--|| PROFILES : "has"
    USERS ||--|| SETTINGS : "has"
    USERS ||--o{ INCOMES : "owns"
    USERS ||--o{ ACCOUNTS : "owns"
    USERS ||--o{ CATEGORIES : "owns"
    USERS ||--o{ CATEGORY_RULES : "owns"
    USERS ||--o{ BILLS : "owns"
    USERS ||--o{ TRANSACTIONS : "owns"
    USERS ||--o{ REMINDERS : "owns"
    USERS ||--o{ REWARDS : "owns"

    ACCOUNTS ||--o{ TRANSACTIONS : "contains"
    ACCOUNTS ||--o{ INCOMES : "lands in"
    ACCOUNTS ||--o{ BILLS : "paid from"

    CATEGORIES ||--o{ TRANSACTIONS : "classifies"
    CATEGORIES ||--o{ CATEGORY_RULES : "targets"

    BILLS ||--o{ TRANSACTIONS : "paid by (counted once)"
    BILLS ||--o{ REMINDERS : "triggers"

    PROFILES {
        uuid id PK "= auth.users.id"
        text display_name
        boolean onboarding_completed
    }
    SETTINGS {
        uuid user_id PK
        numeric safe_to_spend_buffer
        boolean notifications_enabled
        int reminder_lead_days
        text reminder_style
        text density
    }
    INCOMES {
        uuid id PK
        uuid user_id FK
        text source_name
        numeric amount
        boolean is_variable
        text recurrence
        date next_date
        uuid account_id FK
    }
    ACCOUNTS {
        uuid id PK
        uuid user_id FK
        text name
        text type
        numeric current_balance
        text connection_status
    }
    CATEGORIES {
        uuid id PK
        uuid user_id FK
        text name
        boolean is_default
    }
    CATEGORY_RULES {
        uuid id PK
        uuid user_id FK
        text match_text
        uuid category_id FK
    }
    BILLS {
        uuid id PK
        uuid user_id FK
        text name
        numeric amount
        date due_date
        text recurrence
        text status
        boolean is_subscription
        uuid account_id FK
    }
    TRANSACTIONS {
        uuid id PK
        uuid user_id FK
        uuid account_id FK
        uuid category_id FK
        uuid bill_id FK "links a paid bill"
        numeric amount
        text type
        text merchant
        date occurred_on
        text source
    }
    REMINDERS {
        uuid id PK
        uuid user_id FK
        uuid bill_id FK
        timestamptz remind_at
        text status
    }
    REWARDS {
        uuid id PK
        uuid user_id FK
        text kind
        timestamptz earned_at
        boolean acknowledged
    }
```

## How money is counted once
A paid bill is recorded as a `TRANSACTIONS` row with its `bill_id` set, so
safe-to-spend subtracts only **unpaid** upcoming bills and never double-counts.
Expected future income comes from `INCOMES`; once received it becomes a
`TRANSACTIONS` row of type `income`.
