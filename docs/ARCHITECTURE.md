# Architecture

Dream has two components:

- Backend
- Game server

## Backend

Path: `LawinServerV2-main/`

Responsibilities:

- account and auth endpoints;
- player profiles;
- friends and social endpoints;
- store and catalog responses;
- cloud storage endpoints;
- XMPP;
- matchmaking endpoints;
- launcher status and backend-owned Discord OAuth endpoints;
- configuration for matchmaker and game server addresses.

The backend is a Node.js application and uses MongoDB.

## Game Server

Path: `Project-Reboot-3.0-master/`

Responsibilities:

- match server logic;
- game phases;
- inventory;
- loot;
- storm;
- bots;
- gameplay systems tied to supported old client versions.

The game server workspace is a C++ Visual Studio project.

## Runtime Flow

```mermaid
sequenceDiagram
    participant Client as Game Client
    participant Backend as Backend API
    participant DB as MongoDB
    participant Matchmaker as Matchmaker
    participant GameServer as Game Server

    Client->>Backend: Auth and service requests
    Backend->>DB: Read/write account and profile data
    DB-->>Backend: Account and profile data
    Client->>Backend: Matchmaking request
    Backend->>Matchmaker: Resolve match service
    Matchmaker-->>Client: Game server endpoint
    Client->>GameServer: Connect to match
```

## Configuration

Backend configuration currently lives in:

- `LawinServerV2-main/Config/config.json`
- `LawinServerV2-main/Config/catalog_config.json`
- `LawinServerV2-main/.env.example`

Environment variables are preferred for values that differ per machine:

- `PORT`
- `MONGODB_URI`
- `DISCORD_BOT_TOKEN`
- `DISCORD_CLIENT_ID`
- `DISCORD_CLIENT_SECRET`

## Launcher API

The desktop launcher uses these backend endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/launcher/api/status` | Reports backend API, MongoDB, XMPP, and matchmaker health |
| `GET` | `/launcher/api/auth/discord/start` | Returns a Discord OAuth authorization URL for the desktop launcher |
| `POST` | `/launcher/api/auth/discord/callback` | Converts a Discord OAuth code into a Dream launcher session token |
| `POST` | `/launcher/api/auth/discord/exchange` | Converts a Dream launcher session token into a short-lived exchange code |

## Open Questions

- Which old Fortnite version/season is the first supported target.
- Which game server build configuration is the baseline.
- Which backend endpoints are required for the first full client flow.
- Which runtime files must be documented for game server operation.
