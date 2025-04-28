#!/bin/bash
echo "===== Оптимизированная сборка приложения Bunker Boats для macOS ====="

echo "1. Очистка кэша и временных файлов..."
rm -rf dist
rm -rf release
rm -rf .vite

echo "2. Проверка и установка зависимостей..."
npm ci --production=false
if [ $? -ne 0 ]; then
  echo "ОШИБКА: Не удалось установить зависимости!"
  exit 1
fi

echo "3. Сборка React-приложения с оптимизацией..."
npm run build
if [ $? -ne 0 ]; then
  echo "ОШИБКА: Не удалось собрать приложение!"
  exit 1
fi

echo "4. Копирование необходимых файлов в dist..."
cp main.js dist/main.js
cp preload.js dist/preload.js

echo "5. Создание минимального package.json в dist..."
echo '{
  "name": "fuel",
  "version": "1.0.0",
  "main": "main.js",
  "private": true,
  "dependencies": {}
}' > dist/package.json

echo "6. Создание оптимизированного установщика..."
npm run package:mac
if [ $? -ne 0 ]; then
  echo "ОШИБКА: Не удалось создать установщик!"
  exit 1
fi

echo "===== Сборка успешно завершена! ====="
echo "DMG-файл приложения находится в папке dist/"
echo "Размер установщика значительно уменьшен благодаря оптимизации."
echo 