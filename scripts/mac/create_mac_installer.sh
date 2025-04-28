#!/bin/bash
echo "Создание установщика приложения Bunker Boats для macOS"

# Проверка наличия Node.js
if ! command -v node &> /dev/null; then
    echo "ОШИБКА: Node.js не найден!"
    echo "Для создания установщика нужен Node.js"
    exit 1
fi

# Установка зависимостей
echo "Установка зависимостей..."
npm install
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось установить зависимости!"
    exit 1
fi

# Сборка React-приложения
echo "Сборка React-приложения..."
npm run build
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось собрать React-приложение!"
    exit 1
fi

# Проверка наличия необходимых файлов
if [ ! -f "main.js" ]; then
    echo "ОШИБКА: Файл main.js не найден!"
    exit 1
fi

if [ ! -f "preload.js" ]; then
    echo "ОШИБКА: Файл preload.js не найден!"
    exit 1
fi

# Копирование main.js и preload.js в папку dist
echo "Копирование main.js и preload.js в папку dist..."
cp main.js dist/main.js
cp preload.js dist/preload.js

# Создание package.json в папке dist
echo "Создание package.json в папке dist..."
echo '{
  "main": "main.js",
  "name": "fuel",
  "private": true,
  "version": "1.0.0", 
  "dependencies": {} 
}' > dist/package.json

# Сборка установщика для macOS
echo "Сборка установщика..."
npm run package:mac
if [ $? -ne 0 ]; then
    echo "ОШИБКА: Не удалось создать установщик!"
    exit 1
fi

echo ""
echo "Готово! DMG-файл создан в папке dist/"
echo "Вы можете скопировать его на другие Mac-компьютеры."
echo "" 