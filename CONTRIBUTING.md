# Contributing

Проект находится на ранней стадии, поэтому любые изменения лучше делать маленькими и проверяемыми.

## Рабочий процесс

1. Создайте отдельную ветку от `main`.
2. Делайте изменения в одной зоне ответственности за раз.
3. Не смешивайте backend, launcher и game server refactor в одном коммите без необходимости.
4. Перед коммитом проверьте `git status`.
5. Не добавляйте секреты, токены, приватные ключи, игровые файлы и личные данные.

## Коммиты

Хорошие сообщения:

```text
Add launcher project notes
Document backend local setup
Fix backend config loading
```

Плохие сообщения:

```text
update
fix
stuff
```

## Backend

Для JavaScript-файлов минимум перед коммитом:

```powershell
cd D:\ProjectDream\LawinServerV2-main
Get-ChildItem -Recurse -Filter *.js | ForEach-Object { node --check $_.FullName }
```

## C++ game server

Сборку проверять через Visual Studio 2022 или Developer PowerShell for VS 2022.

## Документация

Если меняете запуск, конфиги или структуру папок, обновляйте:

- `README.md`
- `docs/SETUP_LOCAL.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
