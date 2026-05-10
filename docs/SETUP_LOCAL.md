# Локальный запуск

Эта инструкция описывает базовую подготовку dev-окружения. Она не включает игровые файлы, приватные ключи, проприетарные ассеты или обход сторонних сервисов.

## Требования

- Windows 10/11
- Git
- Node.js и npm
- MongoDB Community Server
- Visual Studio 2022 или Visual Studio 2022 Build Tools
- C++ Desktop Development workload для Visual Studio

## Backend

Перейти в backend:

```powershell
cd D:\ProjectDream\LawinServerV2-main
```

Установить зависимости:

```powershell
npm install
```

Проверить конфиг:

```powershell
notepad .\Config\config.json
```

Минимально важные поля:

- `mongodb.database`
- `matchmakerIP`
- `gameServerIP`
- `discord.bot_token`, если нужен Discord bot

Запустить backend:

```powershell
node index.js
```

По умолчанию backend слушает порт `8080`.

## MongoDB

Backend ожидает локальный MongoDB:

```text
mongodb://127.0.0.1/lawindb
```

Если MongoDB установлен как сервис, проверьте его статус:

```powershell
Get-Service MongoDB
```

## Game Server

1. Открыть решение:

```text
D:\ProjectDream\Project-Reboot-3.0-master\Project Reboot 3.0.sln
```

2. Выбрать конфигурацию `Release|x64` или нужную dev-конфигурацию.
3. Собрать проект через Visual Studio 2022.

Если `msbuild` не находится из обычной консоли, откройте `Developer PowerShell for VS 2022`.

## Launcher

Папка `launcher/` пока содержит каркас. Перед началом реализации нужно выбрать стек:

- Tauri: меньше размер, Rust backend, web UI.
- Electron: быстрее MVP, больше размер.
- .NET/WPF: нативно для Windows, удобно для desktop launcher.

Рекомендуемый MVP описан в [ROADMAP.md](ROADMAP.md).

## Проверки

Backend можно быстро проверить статически:

```powershell
cd D:\ProjectDream\LawinServerV2-main
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
node -e "JSON.parse(require('fs').readFileSync('package-lock.json','utf8')); console.log('package-lock OK')"
```
