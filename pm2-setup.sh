#!/bin/bash

# Скрипт для настройки PM2

echo "=== Настройка PM2 для проекта FUEL Manager ==="

# 1. Установка PM2 глобально
echo "Устанавливаем PM2 глобально..."
npm install -g pm2

# 2. Создание конфигурационного файла для PM2
echo "Создаем конфигурацию PM2..."
cat > ecosystem.config.js << EOL
module.exports = {
  apps: [
    {
      name: 'fuel-server',
      cwd: './server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      }
    }
  ]
};
EOL

echo "Конфигурация PM2 создана!"

# 3. Запуск приложения с PM2
echo "Запускаем приложение с PM2..."
pm2 start ecosystem.config.js

# 4. Сохраняем настройки PM2 для автозапуска
echo "Сохраняем конфигурацию для автозапуска..."
pm2 save

echo "=== Настройка PM2 завершена ==="
echo ""
echo "Статус запущенных приложений:"
pm2 status

echo ""
echo "Для просмотра логов используйте: pm2 logs"
echo "Для перезапуска сервера используйте: pm2 restart fuel-server"
echo "Для остановки сервера используйте: pm2 stop fuel-server" 