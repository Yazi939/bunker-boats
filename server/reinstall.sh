#!/bin/bash
set -e

echo "Останавливаем сервер..."
pm2 stop fuel-server || true

echo "Создаем резервную копию базы данных..."
cp ./data/database.sqlite ./data/database.sqlite.backup.$(date +%Y%m%d%H%M%S)

echo "Применяем SQL-скрипт для исправления структуры базы данных..."
cd ./data
sqlite3 database.sqlite < ../reset_database.sql
cd ..

echo "Устанавливаем зависимости..."
npm install

echo "Запускаем сервер..."
pm2 start fuel-server

echo "Проверяем логи..."
sleep 3
pm2 logs fuel-server --lines 20

echo "Восстановление завершено!" 