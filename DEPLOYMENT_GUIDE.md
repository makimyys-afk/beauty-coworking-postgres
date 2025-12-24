# Инструкция по развертыванию сайта "Бьюти-коворкинг"

## Описание проекта

Веб-приложение для управления бронированиями рабочих мест в бьюти-коворкинге с полным функционалом:
- Автоматическая аутентификация (mock-режим под именем "Орлова Мария")
- Каталог рабочих мест с фильтрацией
- Система бронирований с QR-кодами
- Финансовая система с автоматическими транзакциями
- Страница отзывов от пользователей
- Административная панель SQL-логов

## Технологический стек

**Frontend:**
- React 19
- TypeScript
- Tailwind CSS 4
- tRPC (для API)
- Wouter (роутинг)
- shadcn/ui (UI компоненты)
- QRCode.react (генерация QR-кодов)

**Backend:**
- Node.js 22
- Express 4
- tRPC 11
- Drizzle ORM
- PostgreSQL (база данных)

## Требования

- Node.js 22.x или выше
- pnpm 9.x или выше
- PostgreSQL 14.x или выше (облачная база данных)
- Порт 3000 свободен

## Шаг 1: Распаковка архива

```bash
# Распаковать архив
tar -xzf beauty-coworking-site.tar.gz

# Перейти в директорию проекта
cd beauty-coworking
```

## Шаг 2: Установка зависимостей

```bash
# Установить pnpm глобально (если еще не установлен)
npm install -g pnpm

# Установить зависимости проекта
pnpm install
```

## Шаг 3: Настройка базы данных

### Вариант A: Использование TiDB Cloud (рекомендуется)

1. Зарегистрируйтесь на https://tidbcloud.com (бесплатный tier доступен)
2. Создайте новый кластер
3. Получите строку подключения (connection string)
4. Скопируйте её для следующего шага

### Вариант B: Локальный PostgreSQL

```bash
# Установить PostgreSQL (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Создать базу данных
psql -u root -p
CREATE DATABASE beauty_coworking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'beauty_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON beauty_coworking.* TO 'beauty_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Шаг 4: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```bash
# Скопировать шаблон
cp .env.example .env

# Отредактировать .env
nano .env
```

Минимальная конфигурация `.env`:

```env
# База данных
DATABASE_URL=postgresql://username:password@host:port/database_name

# JWT секрет (сгенерируйте случайную строку)
JWT_SECRET=your_random_secret_key_here_min_32_chars

# OAuth (для mock-режима можно оставить пустыми)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im

# Информация о владельце
OWNER_OPEN_ID=mock_owner_123
OWNER_NAME=Admin

# Настройки приложения
VITE_APP_ID=beauty-coworking
VITE_APP_TITLE=Бьюти-коворкинг
VITE_APP_LOGO=/logo.svg

# Forge API (опционально, для расширенных функций)
BUILT_IN_FORGE_API_URL=https://forge.manus.im
BUILT_IN_FORGE_API_KEY=your_api_key
VITE_FRONTEND_FORGE_API_KEY=your_frontend_key
VITE_FRONTEND_FORGE_API_URL=https://forge.manus.im
```

## Шаг 5: Инициализация базы данных

```bash
# Применить схему базы данных
pnpm db:push

# Заполнить базу тестовыми данными
node seed-db.mjs
node seed-user-data.mjs
node recreate-reviews.mjs
```

## Шаг 6: Запуск приложения

### Режим разработки

```bash
# Запустить dev-сервер
pnpm dev

# Приложение будет доступно на http://localhost:3000
```

### Режим production

```bash
# Собрать проект
pnpm build

# Запустить production сервер
pnpm start
```

## Шаг 7: Проверка работоспособности

Откройте браузер и перейдите на http://localhost:3000

Вы должны увидеть:
- ✅ Главную страницу с приветствием "Добро пожаловать, Орлова Мария!"
- ✅ Статистику бронирований (18 всего, 2 активных, 12 завершенных)
- ✅ Баланс 7200₽
- ✅ Навигационное меню с разделами

## Структура проекта

```
beauty-coworking/
├── client/                 # Frontend приложение
│   ├── src/
│   │   ├── pages/         # Страницы приложения
│   │   ├── components/    # React компоненты
│   │   ├── _core/         # Базовые утилиты
│   │   └── lib/           # tRPC клиент
│   └── public/            # Статические файлы
├── server/                # Backend приложение
│   ├── routers.ts        # tRPC роутеры (API endpoints)
│   ├── db.ts             # Функции работы с БД
│   ├── sqlLogger.ts      # Логирование SQL
│   └── _core/            # Серверная инфраструктура
├── drizzle/              # Схема базы данных
│   └── schema.ts
├── shared/               # Общие типы и константы
├── seed-db.mjs          # Скрипт заполнения БД
├── package.json         # Зависимости проекта
└── .env                 # Переменные окружения (создать вручную)
```

## Основные функции

### 1. Главная страница (/)
- Статистика бронирований и баланса
- Быстрые действия (карточки с ссылками)
- Популярные рабочие места

### 2. Рабочие места (/workspaces)
- Каталог с фильтрацией по типу и цене
- Карточки с рейтингами и отзывами
- Детальная страница с формой бронирования

### 3. Бронирования (/bookings)
- Список всех бронирований
- Фильтрация по статусу
- Детальная страница с QR-кодом

### 4. Финансы (/finances)
- Вкладки "История" и "Счета"
- Карточка баланса
- История транзакций
- Неоплаченные счета

### 5. Отзывы (/reviews)
- Отзывы от разных пользователей
- Рейтинги и комментарии
- Фильтрация по рабочим местам

### 6. SQL Логи (/sql-logs)
- Просмотр всех SQL-запросов
- Фильтрация по типу операции
- Время выполнения и параметры

## Настройка под production

### 1. Использование PM2 для автозапуска

```bash
# Установить PM2
npm install -g pm2

# Запустить приложение
pm2 start npm --name "beauty-coworking" -- start

# Настроить автозапуск
pm2 startup
pm2 save

# Просмотр логов
pm2 logs beauty-coworking

# Перезапуск
pm2 restart beauty-coworking
```

### 2. Настройка Nginx (опционально)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 3. SSL сертификат (Let's Encrypt)

```bash
# Установить certbot
sudo apt-get install certbot python3-certbot-nginx

# Получить сертификат
sudo certbot --nginx -d your-domain.com

# Автообновление
sudo certbot renew --dry-run
```

## Решение проблем

### Ошибка подключения к БД

```bash
# Проверить строку подключения
echo $DATABASE_URL

# Проверить доступность БД
psql -h host -u username -p database_name
```

### Порт 3000 занят

```bash
# Найти процесс
lsof -i :3000

# Убить процесс
kill -9 PID

# Или изменить порт в package.json (vite.config.ts)
```

### Ошибки при установке зависимостей

```bash
# Очистить кэш
pnpm store prune

# Удалить node_modules и переустановить
rm -rf node_modules
pnpm install
```

## Обновление данных

### Пересоздать тестовые данные

```bash
# Очистить и заполнить заново
node seed-db.mjs
node seed-user-data.mjs
node recreate-reviews.mjs
```

### Изменить схему БД

```bash
# Отредактировать drizzle/schema.ts
nano drizzle/schema.ts

# Применить изменения
pnpm db:push
```

## Безопасность

⚠️ **Важно для production:**

1. Измените `JWT_SECRET` на случайную строку (минимум 32 символа)
2. Используйте сильные пароли для базы данных
3. Не храните `.env` в системе контроля версий
4. Настройте HTTPS через Nginx + Let's Encrypt
5. Ограничьте доступ к SQL-логам только для администраторов
6. Замените mock-аутентификацию на реальную OAuth систему

## Дополнительные команды

```bash
# Проверка типов TypeScript
pnpm typecheck

# Линтинг кода
pnpm lint

# Форматирование кода
pnpm format

# Просмотр логов БД
tail -f server/sql-logs.txt

# Бэкап базы данных
pg_dump -u username -p database_name > backup.sql

# Восстановление из бэкапа
psql -u username -p database_name < backup.sql
```

## Контакты и поддержка

Для вопросов и предложений:
- GitHub Issues: [ссылка на репозиторий]
- Email: support@beauty-coworking.ru

## Лицензия

MIT License - свободное использование и модификация

---

**Версия:** 1.0.0  
**Дата:** 13 ноября 2024  
**Автор:** Manus AI Agent
