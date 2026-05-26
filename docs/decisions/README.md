# Decisions

Status: current  
Audience: engineers, product maintainers, security reviewers, AI coding agents  
Owner area: documentation system  
Last reviewed: 2026-05-25  
Source of truth: yes  
Related code: `docs/templates/adr-template.md`, `docs/decisions/historical/`  
Related tests: `tests/unit/access-docs-consistency.test.ts`

Decision docs explain why major architecture, product, access-control or delivery choices were made. They are context for maintainers, not a replacement for current source-of-truth docs.

## Current Runtime Truth Vs Historical Context

- Current runtime truth starts at `docs/README.md` and the source-of-truth docs linked there.
- Historical docs explain previous plans, audits, migrations and roadmap thinking.
- Historical docs must not be used to infer current behavior without checking current docs and code.

## Future ADRs

Add future decision records under this folder using `docs/templates/adr-template.md`.

Recommended pattern:

- one ADR per durable decision;
- link the current source-of-truth doc affected by the decision;
- mark superseded decisions clearly instead of deleting them.

## Historical Docs

Moved historical migration, audit and roadmap docs live in `docs/decisions/historical/README.md`.
