# Contributing

The active scope of this repository is backend and game server only.

## Workflow

1. Create a branch from `main`.
2. Keep changes focused on one area: backend, game server, or docs.
3. Do not mix backend refactors and game server refactors in one commit unless required.
4. Check `git status` before committing.
5. Do not commit secrets, tokens, private keys, proprietary game files, or real user data.

## Commit Messages

Good examples:

```text
Document backend local setup
Fix backend config loading
Record game server build requirements
```

Avoid vague messages:

```text
update
fix
stuff
```

## Backend Checks

```powershell
cd D:\ProjectDream\LawinServerV2-main
npm run check
```

## Game Server Checks

Build through Visual Studio 2022 or Developer PowerShell for VS 2022.

## Documentation

If startup, config, ports, or folder structure changes, update:

- `README.md`
- `docs/SETUP_LOCAL.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
