# Инструкция по установке на сервере

## Требования
- Node.js (рекомендуется версия 18+)
- Git
- SQLite3

## Шаги по установке

### 1. Клонировать репозиторий
```bash
git clone https://github.com/Yazi939/bunker-boats.git fuel-app
cd fuel-app
```

### 2. Исправить проблемы с зависимостями
Для исправления проблем с зависимостями используйте скрипт:

```bash
chmod +x fix-dependencies.sh
./fix-dependencies.sh
```

Этот скрипт:
- Понизит версию react-router-dom до совместимой с Node.js 18
- Установит необходимые зависимости для компиляции sqlite3
- Переустановит sqlite3 и better-sqlite3 с компиляцией из исходников
- Установит зависимости в директории сервера

### 3. Запуск приложения
После установки зависимостей вы можете запустить:

**Только сервер:**
```bash
cd server
npm start
```

**Клиент (в режиме разработки):**
```bash
npm run dev
```

**Всё приложение:**
```bash
npm run start:all
```

## Возможные проблемы

### 1. Ошибки с SQLite3
Если у вас возникают проблемы с SQLite3, попробуйте:

```bash
sudo apt-get update
sudo apt-get install -y build-essential python3
npm rebuild sqlite3 --build-from-source
npm rebuild better-sqlite3 --build-from-source
```

### 2. Несовместимость версий Node.js
Если вы видите ошибки несовместимости версий (EBADENGINE), убедитесь, что использовали скрипт `fix-dependencies.sh`, который установит совместимые версии пакетов.

### 3. Проблемы с директорией данных
Убедитесь, что директория для данных существует:

```bash
mkdir -p server/data
``` 