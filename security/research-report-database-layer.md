# Securing the Database Layer

**Security Research Report**
**Author:** Anika Seidlitz
**Course:** Tech Fleet AI Development Residency, Week 6 Coding Challenge
**Date:** 26 November 2026
**Layer studied:** Database Layer
**Reference:** OWASP Cheat Sheet Series

---

## Introduction

Every application is built to do one thing with data: store it, read it back, and keep it correct. The database layer is where that data lives after everything else has finished running. The user interface is gone, the request has ended, but the data stays. That permanence is what makes this layer the highest-value target in most systems. An attacker who reaches the presentation layer sees one screen; an attacker who reaches the database sees every user's records at once.

This report studies the database layer on its own terms. It describes what the layer does from a software and a network standpoint, the kinds of attacks that threaten it, the reasons it is hard to secure completely, and the secure-coding and configuration principles from the OWASP Cheat Sheet Series that harden it. The examples are grounded in a real stack, a Next.js application backed by Supabase (managed PostgreSQL with Row Level Security), because that is the architecture of the app tested in this week's PenTest, but the principles apply to any relational or document store.

## Layer

From a software standpoint, the database layer is the persistent store and the engine that manages it. In a relational system such as PostgreSQL, the engine holds the data in tables, organized by a schema, and exposes it through a query language, SQL. It does far more than hold rows. It enforces types and constraints, runs transactions so that a set of changes either all succeed or all fail, resolves concurrent access, and can run logic of its own through views, stored procedures, functions, and triggers. It also enforces access control: database roles, grants, and, in PostgreSQL, Row Level Security policies that decide which rows a given role may read or write. In a managed setup like Supabase, a layer sits in front of the engine that turns HTTP requests into SQL and checks a JSON Web Token, but the authorization decision still happens inside the database, row by row.

From a network standpoint, the database is a service that listens on a port, 5432 for PostgreSQL, and accepts connections from application servers. Those connections carry credentials, run queries, and return results. The security of the layer therefore depends on who can reach that port, whether the connection is encrypted in transit, and how the credentials that open it are stored and rotated. In a managed cloud database the port is usually not exposed to the public internet; the application reaches it over a private network or through an API gateway, and the host handles patching, disk encryption, and backups. The data itself sits on disk (data at rest), travels over the connection (data in transit), and is copied into backups and read replicas that each hold a full copy of the same sensitive data.

## Vulnerabilities

The database layer is attacked through several distinct areas. Each one is a different way in, with its own consequences.

**Injection.** The classic and still most damaging attack. When an application builds a query by gluing untrusted input into a SQL string, an attacker can change the meaning of the query. A login check that becomes `... WHERE user = '' OR '1'='1'` returns every row. Injection comes in many forms: UNION-based attacks that append a second query to read other tables, blind injection that infers data one true-or-false answer at a time, and second-order injection where the payload is stored first and executed later. The consequences are the worst in the stack: reading every record, changing or deleting data, bypassing authentication, and in some database configurations running operating-system commands. NoSQL and command injection follow the same pattern with different syntax.

**Broken access control and authorization.** This is the central risk for any application that holds more than one user's data. If authorization is missing, misconfigured, or applied in only some query paths, one user can read or change another user's rows. In a system that relies on Row Level Security, a single table without a policy, or a policy with the wrong condition, exposes that table to every authenticated user. Insecure Direct Object Reference (IDOR) is the same failure seen from the outside: a query scoped only by a record id, not by the owner, lets an attacker iterate ids and pull records that are not theirs. Privilege escalation is the sharpest version: if the high-privilege service key, which bypasses row security entirely, is used where the low-privilege key should be, the row controls no longer apply.

**Authentication to the database.** The database trusts whoever presents valid credentials. Weak, shared, or default passwords, and credentials that never rotate, all widen this door. The most common modern version is a connection string or service key committed to source control or shipped inside the browser bundle, where anyone can read it and connect directly.

**Secrets exposure.** Related to the above but broader: connection strings, API keys, and service-role tokens leak through repositories, environment files checked in by mistake, log output, and client-side code. One leaked high-privilege secret defeats every other control on the layer.

**Sensitive data exposure and weak cryptography.** Storing personal or financial data in plaintext, hashing passwords with a weak or fast algorithm, selecting more columns than the feature needs, and writing sensitive values into logs all expose data without any clever attack. If the disk or a backup is ever read, plaintext data is read with it.

**Mass assignment at the write path.** When an insert or update lets the client set any column, an attacker can write fields they should not control: another user's id, a role or admin flag, or an account balance. The database faithfully stores whatever the query tells it to.

**Transport exposure.** A database connection that is not encrypted can be read or altered by anyone on the network path, exposing both the credentials and the data in flight.

**Backups, replicas, and network exposure.** Backups and read replicas hold the same data, often with weaker access controls and less attention. A publicly reachable database port, a snapshot in an open storage bucket, or a replica without the same policies is a full breach through a side door.

**Database logic and auditing gaps.** Functions and triggers that build dynamic SQL reintroduce injection inside the database. Functions that run with elevated privilege (in PostgreSQL, `SECURITY DEFINER`) can escalate access if their logic is loose. Finally, the absence of an audit trail means a breach can happen and leave no record of who read what, which turns a contained incident into an unbounded one.

**Denial of service.** Expensive or unbounded queries, missing row limits, and reads with no rate limiting let an attacker exhaust the database's resources and take the application down without stealing anything.

## Challenges of Securing This Layer

Several properties of the database layer make it genuinely hard to protect, even for careful teams.

Authorization is invisible in the application code. When row security lives in the database, a developer reading the application cannot see whether a table is protected; the policy is somewhere else, and a reviewer has to go look. This is also why a missing policy is such a quiet failure: nothing in the code looks wrong.

The highest-privilege key is a single point of collapse. A service-role key that bypasses row security is necessary for some trusted server work, but one leak, or one use in the wrong place, removes every row-level control at once. The strength of the whole layer is bounded by how well that one secret is kept.

Multi-tenancy demands perfection across every path. A single query that forgets to scope to the owner leaks data across tenants, and applications have many query paths. The control has to hold everywhere; the attacker needs it to fail once.

Managed databases move control to the host. A team using a managed database controls less of the stack: the host patches the engine, encrypts the disk, and runs the network. That removes work but also removes visibility, so the team has to verify the settings it does control and trust the host for the rest.

Security competes with speed. Encryption, strict validation, audit logging, and careful policies all cost latency and development time, and under deadline pressure they are the first things relaxed. Backups and replicas are easy to forget precisely because they are not in the daily path.

Authorization is hard to test. Proving that user A cannot reach user B's data requires at least two accounts and deliberate negative tests, which most test suites skip in favor of the happy path. And schema migrations can silently drop or weaken a policy, so a layer that was secure last month may not be today.

## How to Fix The Vulnerabilities

The OWASP Cheat Sheet Series gives a consistent set of principles for hardening this layer. They work together; no single one is enough on its own.

**Parameterize every query.** Following the SQL Injection Prevention and Query Parameterization cheat sheets, never build a query by concatenating input. Use prepared statements, an ORM, or a query builder that binds values separately from the query text, so input can never change the query's meaning. Where a value has to be an identifier or a sort direction that cannot be bound, check it against an allow-list.

**Enforce authorization in the database, with least privilege.** Following the Authorization and Database Security cheat sheets, put a Row Level Security policy on every table, scope it to the owner (for example, `auth.uid() = user_id`), and deny by default. Grant the application's role only the privileges it needs. Keep the high-privilege service key on the server only, never in the browser, and use it only for trusted operations that must bypass row security.

**Add defense in depth in the application.** Do not let the database policy be the only control. Scope queries by owner in the application code as well, so that if a policy is ever missing or wrong, the application's own filter still limits the damage. Two independent controls fail independently.

**Manage secrets deliberately.** Following the Secrets Management cheat sheet, keep connection strings and keys out of source control and out of the client bundle, store them in environment variables or a secret manager, and rotate them. Separate a public, row-security-bound key from a server-only privileged key, and confirm that only the public one ever reaches the browser.

**Encrypt at rest and in transit.** Following the Cryptographic Storage and Transport Layer Security cheat sheets, require TLS on database connections, rely on disk encryption for data at rest, let the authentication provider handle salted, slow password hashing, and encrypt the most sensitive fields on top of that.

**Minimize and scope data.** Select only the columns a feature needs, collect only the data the product requires, and define retention and deletion, including cascading deletes so that removing a user removes their data everywhere.

**Prevent mass assignment.** List the columns an insert or update may set explicitly, and never trust a client-supplied owner id, role, or balance. Derive the owner from the authenticated session, not from the request body.

**Isolate the network and protect backups.** Keep the database off the public internet, behind a private network or an allow-list, and give backups and replicas the same encryption and access controls as the primary, testing restores so the protection is real.

**Audit without leaking.** Following the Logging cheat sheet, record access and authentication events so a breach leaves a trail, while keeping secrets and personal data out of the logs themselves.

**Harden database logic and keep testing.** Avoid dynamic SQL inside functions, prefer invoker privileges over definer privileges unless a specific need is scoped carefully, and keep the engine and its extensions patched. Finally, make authorization testable: write negative, multi-account tests that assert one user cannot reach another's rows, and run them automatically so a future migration cannot quietly remove a policy.

The thread through all of these is one idea: treat the database as a trust boundary, not a safe interior. Validate what crosses it, enforce least privilege on both sides of it, never rely on a single control, and make the controls testable so they stay true as the application changes. Development and product teams that build this into their defaults, rather than adding it after a review, protect the one layer where a mistake exposes everything at once.
