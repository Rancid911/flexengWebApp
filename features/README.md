# Features

Product-domain code should be added here as the project is migrated out of route-local `app/` modules.

Suggested domain shape:

```txt
features/<domain>/
  components/
  client/
  server/
  validation.ts
  types.ts
```

Do not move existing `lib/<domain>` modules here in bulk. Migrate them gradually when a domain is actively changed.
