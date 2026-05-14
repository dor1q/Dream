# Roadmap

## Stage 0. Repository

- [x] Create git repository.
- [x] Attach remote `dor1q/Dream`.
- [x] Import backend.
- [x] Import game server workspace.
- [x] Add baseline documentation.
- [x] Define repository scope as backend and game server only.

## Stage 1. Backend Baseline

- [x] Install npm dependencies.
- [x] Confirm MongoDB local service.
- [x] Add `.env.example`.
- [x] Add `npm start`.
- [x] Add `npm run check`.
- [x] Allow backend startup without Discord bot token.
- [x] Verify local backend startup.
- [ ] Move more machine-specific config values to environment variables.
- [x] Add launcher health/status endpoint.
- [x] Add backend-owned Discord OAuth flow for the launcher.
- [x] Auto-create Dream account records from Discord launcher login.
- [x] Document required auth/account creation flow.

## Stage 2. Game Server Baseline

- [ ] Verify build in Visual Studio 2022.
- [ ] Record working build configuration.
- [ ] Document required runtime files.
- [ ] Check known issue in `anticheat.h`.
- [ ] Add short debugging instructions.

## Stage 3. Backend and Game Server Integration

- [ ] Confirm backend matchmaker response values.
- [ ] Confirm `matchmakerIP` and `gameServerIP` defaults.
- [ ] Document expected startup order.
- [ ] Document ports and firewall requirements.
- [ ] Add local smoke-test checklist.
- [ ] Expose game-server process/session status to launcher.

## Stage 4. Hardening

- [ ] Review npm audit output without breaking compatibility.
- [ ] Split required and optional backend services.
- [ ] Avoid committing runtime token/session files.
- [ ] Add CI for backend syntax checks.
- [ ] Add CI for C++ build if toolchain is available.
