#!/bin/bash
echo "Исправление проблемы белого экрана в приложении Bunker Boats для macOS"

# 1. Проверка существования папки dist
if [ ! -d "dist" ]; then
  echo "Папка dist не найдена. Нужна сборка приложения."
  echo "Сборка приложения..."
  npm run build
  if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось собрать приложение!"
    exit 1
  fi
fi

# 2. Создание файла конфигурации
echo '{
  "main": "main.js",
  "name": "fuel",
  "private": true,
  "version": "1.0.0",
  "dependencies": {}
}' > dist/package.json

# 3. Копирование main.js
cp main.js dist/main.js
cp preload.js dist/preload.js

# 4. Запуск приложения
cd dist
electron .

echo ""
echo "Если приложение запустилось корректно, значит исправление сработало."
echo "Вы можете закрыть это окно."
echo "" 