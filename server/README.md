# Настройка сервера Fuel Manager

## Проблема с запуском сервера

Если вы видите ошибку:
```
[nodemon] app crashed - waiting for file changes before starting...
```

Необходимо настроить подключение к MongoDB.

## Настройка MongoDB

1. Убедитесь, что MongoDB установлена и запущена на вашем компьютере.
2. Создайте файл `.env` в папке `server` со следующим содержимым:

```
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://localhost:27017/fuel_manager
JWT_SECRET=fuel1234567890secret
```

## Установка MongoDB (если не установлена)

### Windows
1. Скачайте MongoDB Community Server с официального сайта: https://www.mongodb.com/try/download/community
2. Установите MongoDB, следуя инструкциям установщика.
3. MongoDB будет запущена как служба Windows.

### Проверка MongoDB
Чтобы проверить, запущена ли MongoDB, выполните в командной строке:
```
mongod --version
```

Если команда не найдена, добавьте путь к MongoDB в переменную PATH. 