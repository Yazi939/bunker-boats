# Руководство по развертыванию приложения на Yandex Cloud

## Информация о сервере
- **IP адрес:** 89.169.170.164
- **Порт API:** 5000
- **Порт клиента (для разработки):** 5176

## Подготовка сервера

### 1. Установка Node.js
```bash
# Обновите пакеты
sudo apt update && sudo apt upgrade -y

# Установите Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Проверьте установку
node -v
npm -v
```

### 2. Установка необходимых пакетов для сборки
```bash
sudo apt-get install -y build-essential python3 git
```

### 3. Установка PM2 (менеджер процессов для Node.js)
```bash
sudo npm install -g pm2
```

## Развертывание приложения

### 1. Клонирование репозитория
```bash
git clone https://github.com/Yazi939/bunker-boats.git fuel-app
cd fuel-app
```

### 2. Исправление проблем с зависимостями
```bash
chmod +x fix-dependencies.sh
./fix-dependencies.sh
```

### 3. Сборка клиентской части (опционально для полного стека)
```bash
npm install
npm run build
```

### 4. Настройка и запуск сервера
```bash
cd server
npm install
cd ..
```

### 5. Настройка PM2 для управления процессами
```bash
chmod +x pm2-setup.sh
./pm2-setup.sh
```

### 6. Проверка работы сервера
Сервер должен запуститься на порту 5000. Проверьте его работу:
```bash
# Проверка статуса PM2
pm2 status

# Просмотр логов
pm2 logs fuel-server
```

Проверьте доступность API, отправив запрос:
```bash
curl http://localhost:5000/api/health
```

## Обновление приложения

### Обновление из репозитория
```bash
cd fuel-app
git pull

# Пересборка клиентской части (если требуется)
npm install
npm run build

# Обновление серверной части
cd server
npm install
cd ..

# Перезапуск сервера
pm2 restart fuel-server
```

## Настройка Firewall

Убедитесь, что порты 5000 (API) и 5176 (Dev сервер, если нужен) открыты в брандмауэре:

```bash
sudo ufw allow 5000/tcp
sudo ufw allow 5176/tcp
sudo ufw enable
sudo ufw status
```

## Проверка работоспособности

1. API должен быть доступен по адресу: `http://89.169.170.164:5000/api`
2. Проверка работы API: `http://89.169.170.164:5000/api/health`
3. Для разработки клиент доступен по адресу: `http://89.169.170.164:5176`

## Устранение неполадок

### Проблемы с подключением к API
1. Проверьте статус сервера: `pm2 status`
2. Проверьте логи на ошибки: `pm2 logs fuel-server`
3. Проверьте настройки CORS в server.js
4. Убедитесь, что порты открыты: `sudo ufw status`

### Проблемы с SQLite
Если возникают ошибки с базой данных SQLite:
```bash
mkdir -p server/data
npm rebuild sqlite3 --build-from-source
```

### Рестарт приложения при ошибках
```bash
pm2 restart fuel-server
```

## Сведения о приложении

- **Серверная часть:** Express.js + SQLite
- **Клиентская часть:** React + Vite
- **Менеджер процессов:** PM2
- **База данных:** SQLite (файловая) 