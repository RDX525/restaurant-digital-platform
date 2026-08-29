# Restaurant Digital Platform — Development Rules

These rules apply to all contributors and AI-assisted development on this project.

## Security & tenancy

1. Never bypass Row Level Security.
2. Never trust client-provided `restaurant_id`.
3. Always derive restaurant access from authenticated user membership.
4. Never expose another restaurant's data.
5. Never trust client-provided prices.
6. Calculate order totals server-side.
7. Never store raw card information.
8. Verify payment through trusted server-side confirmation.
9. Validate all external input.

## TypeScript & data hygiene

10. Use TypeScript strictly.
11. Avoid `any` unless absolutely necessary.
12. Do not hardcode restaurant data.
13. Do not hardcode currency.
14. Do not hardcode timezone.
15. Store timestamps consistently (UTC in the database).
16. Respect restaurant timezone when displaying dates/times.

## Architecture & code quality

17. Use reusable components.
18. Avoid duplicated business logic.
19. Business logic belongs server-side where security matters.
20. Financial metrics must come from authoritative database records.

## AI

21. AI must never invent financial or operational metrics.
22. AI must use approved database tools.
23. AI cannot directly modify production data in Phase 1.
24. Restaurant owner must approve AI-generated content before publishing.

## Scope & testing

25. Do not implement Phase 2/3 features unless explicitly requested.
26. Write tests for important business logic.
27. Write security tests for tenant isolation.
28. Do not disable tests to make the build pass.

## Secrets & operations

29. Do not expose secrets.
30. Do not commit `.env` files.

## Process

31. Prefer simple architecture over premature complexity.
32. Document important architectural decisions.
33. Before changing architecture, review `ARCHITECTURE.md`.
34. Before changing database schema, create a migration.
35. Never make destructive database changes without explicit approval.

## Related documents

- [PHASE_1_COMPLETION_REPORT.md](./PHASE_1_COMPLETION_REPORT.md) — Phase 1 review and known gaps
- [DEPLOYMENT.md](./DEPLOYMENT.md) — deployment and security summary
- [PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md) — pre-launch checklist
