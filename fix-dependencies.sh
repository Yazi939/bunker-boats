#!/bin/bash

# Скрипт для исправления проблем с зависимостями

echo "=== Исправление зависимостей проекта ==="

# 1. Устанавливаем более старую версию react-router-dom, совместимую с Node.js v18
echo "Понижаем версию react-router-dom до версии, совместимой с Node.js v18..."
npm uninstall react-router-dom
npm install react-router-dom@6.20.1 --save

# 2. Устанавливаем необходимые зависимости для компиляции sqlite3
echo "Устанавливаем дополнительные зависимости для sqlite3..."
sudo apt-get update && sudo apt-get install -y build-essential python3

# 3. Переустанавливаем sqlite3 с компиляцией из исходников
echo "Переустанавливаем sqlite3..."
npm uninstall sqlite3
npm uninstall better-sqlite3
npm install sqlite3 --build-from-source
npm install better-sqlite3 --build-from-source

# 4. Устанавливаем зависимости в директории сервера
echo "Устанавливаем зависимости в директории сервера..."
cd server
npm install

echo "=== Исправление зависимостей завершено ===" 