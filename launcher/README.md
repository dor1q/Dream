# Dream Launcher

Папка для будущего desktop launcher проекта.

## Цель MVP

Минимальный launcher должен уметь:

- хранить URL backend;
- авторизовать игрока;
- показывать статус backend и game server;
- показывать список локальных билдов;
- запускать выбранный билд с нужной конфигурацией;
- писать понятные логи запуска.

## Возможные стеки

| Стек | Плюсы | Минусы |
| --- | --- | --- |
| Tauri | Маленький размер, хороший desktop API | Нужен Rust |
| Electron | Быстрый старт, много UI-пакетов | Большой размер приложения |
| .NET/WPF | Нативно для Windows, удобно для launcher | Менее гибкий web-like UI |

Для быстрого MVP лучше выбрать Electron или .NET/WPF. Для более аккуратного production launcher можно рассмотреть Tauri.

## План структуры

```text
launcher/
  README.md
  src/
  assets/
  config/
  package.json или solution-файлы
```

## Будущий конфиг билдов

Пример идеи для `builds.json`:

```json
{
  "builds": [
    {
      "id": "season-5",
      "name": "Season 5",
      "path": "D:\\Games\\Dream\\Season5",
      "executable": "FortniteClient-Win64-Shipping.exe"
    }
  ]
}
```
