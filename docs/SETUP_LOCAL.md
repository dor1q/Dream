# Local Setup

This document covers the local setup for backend and game server development.

It does not cover proprietary game files, private keys, or third-party service bypasses.

## Requirements

- Windows 10/11
- Git
- Node.js and npm
- MongoDB Community Server
- Visual Studio 2022 or Visual Studio 2022 Build Tools
- Visual Studio workload: `Desktop development with C++`

## Backend

Go to the backend directory:

```powershell
cd D:\ProjectDream\LawinServerV2-main
```

Install dependencies:

```powershell
npm install
```

Check syntax:

```powershell
npm run check
```

Start backend:

```powershell
npm start
```

Default ports:

- Backend HTTP API: `8080`
- XMPP / matchmaker service: `80`

## MongoDB

The default backend database URI is:

```text
mongodb://127.0.0.1/lawindb
```

Check the Windows service:

```powershell
Get-Service MongoDB
```

If MongoDB runs as a service, `mongod` does not need to be available in `PATH`.

## Environment

Example file:

```text
LawinServerV2-main/.env.example
```

Supported values:

```env
PORT=8080
MONGODB_URI=mongodb://127.0.0.1/lawindb
DISCORD_BOT_TOKEN=
DISCORD_CLIENT_ID=
DISCORD_CLIENT_SECRET=
```

If `DISCORD_BOT_TOKEN` is empty, the backend starts without the Discord bot.
`DISCORD_CLIENT_ID` and `DISCORD_CLIENT_SECRET` are required for desktop launcher login through Discord OAuth.

## Game Server

Open the Visual Studio solution:

```text
D:\ProjectDream\Project-Reboot-3.0-master\Project Reboot 3.0.sln
```

Recommended first build:

- Configuration: `Release`
- Platform: `x64`

If `msbuild` is not available in normal PowerShell, open:

```text
Developer PowerShell for VS 2022
```

Then verify:

```powershell
msbuild -version
```

## Quick Health Check

Backend:

```powershell
cd D:\ProjectDream\LawinServerV2-main
npm run check
npm start
```

Repository:

```powershell
cd D:\ProjectDream
git status --short --branch
```
