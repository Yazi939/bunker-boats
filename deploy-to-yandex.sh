#!/bin/bash

# Скрипт для автоматического развертывания на сервере Яндекс Облако

SERVER_IP="89.169.170.164"
SERVER_USER="ubuntu"  # Замените на вашего пользователя
REMOTE_DIR="/home/${SERVER_USER}/fuel-app"

echo "=== Начинаем развертывание на Яндекс Облако ($SERVER_IP) ==="

# Сборка клиентской части
echo "=== Сборка клиентской части ==="
npm run build

if [ $? -ne 0 ]; then
  echo "Ошибка при сборке клиентской части"
  exit 1
fi

# Создаем архив для отправки
echo "=== Подготовка архива для отправки ==="
rm -f deploy.tar.gz
tar -czf deploy.tar.gz \
  dist/ \
  server/ \
  ecosystem.config.js \
  package.json \
  fix-dependencies.sh \
  pm2-setup.sh \
  YANDEX_CLOUD_DEPLOYMENT.md

echo "=== Отправляем архив на сервер ==="
scp deploy.tar.gz ${SERVER_USER}@${SERVER_IP}:~/

# Выполняем развертывание на сервере
echo "=== Выполняем развертывание на сервере ==="
ssh ${SERVER_USER}@${SERVER_IP} << 'EOL'
  # Остановка текущего PM2 сервера, если он запущен
  if command -v pm2 &> /dev/null; then
    pm2 stop all || true
  fi

  # Распаковка архива
  mkdir -p ~/fuel-app
  tar -xzf ~/deploy.tar.gz -C ~/fuel-app

  # Установка зависимостей
  cd ~/fuel-app
  
  # Устанавливаем PM2, если его нет
  if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
  fi
  
  # Запускаем скрипт для исправления зависимостей
  chmod +x fix-dependencies.sh
  ./fix-dependencies.sh
  
  # Настраиваем автозапуск с PM2
  chmod +x pm2-setup.sh
  ./pm2-setup.sh
  
  # Проверяем статус
  pm2 status
  
  echo "=== Развертывание завершено ==="
EOL

echo "=== Развертывание завершено успешно! ==="
echo "API должно быть доступно по адресу: http://${SERVER_IP}:5000/"
echo "Для проверки статуса используйте: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 status'"
echo "Для просмотра логов используйте: ssh ${SERVER_USER}@${SERVER_IP} 'pm2 logs fuel-server'" 