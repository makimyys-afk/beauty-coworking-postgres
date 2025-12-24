# Beauty Coworking - Миграция с MySQL на PostgreSQL

## Обзор

Проект Beauty Coworking успешно мигрирован с MySQL на PostgreSQL и запущен локально.

## Выполненные изменения

### 1. Схема базы данных

**Файл:** `drizzle/schema.ts`

Изменения:
- Заменен импорт с `drizzle-orm/mysql-core` на `drizzle-orm/pg-core`
- Заменены типы MySQL на PostgreSQL:
  - `mysqlTable` → `pgTable`
  - `int()` → `integer()`
  - `varchar()` → `varchar()`
  - `text()` → `text()`
  - `decimal()` → `numeric()`
  - `datetime()` → `timestamp()`
  - `mysqlEnum()` → `pgEnum()`
- Обновлены значения по умолчанию:
  - `now()` → `sql\`CURRENT_TIMESTAMP\``
- Добавлены enum типы для PostgreSQL перед определением таблиц

### 2. Конфигурация Drizzle

**Файл:** `drizzle.config.ts`

Изменения:
- `dialect: "mysql"` → `dialect: "postgresql"`
- Обновлен путь к схеме для корректной работы с PostgreSQL

### 3. Зависимости

**Файл:** `package.json`

Изменения:
- Удален пакет: `mysql2`
- Добавлен пакет: `postgres` (версия ^3.4.7)

### 4. Подключение к базе данных

**Файл:** `server/db.ts`

Изменения:
- Заменен импорт с `mysql2/promise` на `postgres`
- Обновлена функция `getDb()` для использования драйвера `postgres`
- Заменен метод `.onDuplicateKeyUpdate()` (MySQL) на `.onConflictDoUpdate()` (PostgreSQL)

### 5. Переменные окружения

**Файл:** `.env`

Изменения:
- `DATABASE_URL=mysql://root:password@localhost:3306/beauty_coworking`
- → `DATABASE_URL=postgresql://beauty_user:beauty_pass_2024@localhost:5432/beauty_coworking`

**Файл:** `package.json` (скрипт dev)

Добавлена явная установка DATABASE_URL в команду запуска:
```json
"dev": "DATABASE_URL=postgresql://beauty_user:beauty_pass_2024@localhost:5432/beauty_coworking NODE_ENV=development tsx watch server/_core/index.ts"
```

## Настройка PostgreSQL

### Установка и запуск

```bash
sudo apt-get update && sudo apt-get install -y postgresql postgresql-contrib
sudo service postgresql start
```

### Создание базы данных и пользователя

```sql
CREATE DATABASE beauty_coworking;
CREATE USER beauty_user WITH PASSWORD 'beauty_pass_2024';
ALTER USER beauty_user WITH SUPERUSER;
GRANT ALL PRIVILEGES ON DATABASE beauty_coworking TO beauty_user;
```

### Миграция схемы

```bash
cd /home/ubuntu/beauty-coworking-postgres
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

### Заполнение тестовыми данными

Создан и выполнен скрипт `seed.mjs` для заполнения базы данных:
- 5 рабочих мест (workspaces)
- 1 тестовый пользователь

## Запуск приложения

```bash
cd /home/ubuntu/beauty-coworking-postgres
pnpm install
pnpm dev
```

Приложение запускается на порту **3001** (порт 3000 занят другим проектом).

## Проверка работоспособности

✅ **Успешно протестировано:**

1. **Аутентификация**
   - Вход с тестовыми данными (orlova.maria@example.com / password)
   - Создание пользователя в PostgreSQL при первом входе

2. **Главная страница**
   - Отображение статистики пользователя
   - Быстрые действия
   - Популярные места

3. **Страница "Рабочие места"**
   - Загрузка всех 5 рабочих мест из PostgreSQL
   - Фильтрация по категориям
   - Отображение рейтингов и цен

4. **База данных**
   - Все запросы выполняются корректно
   - Данные сохраняются и загружаются без ошибок

## Структура проекта

```
beauty-coworking-postgres/
├── client/              # Frontend (React + Vite)
├── server/              # Backend (Express + Drizzle ORM)
├── drizzle/             # Database schema and migrations
│   ├── schema.ts        # PostgreSQL schema
│   └── migrations/      # Migration files
├── shared/              # Shared types and constants
├── package.json         # Dependencies
├── drizzle.config.ts    # Drizzle configuration
└── .env                 # Environment variables
```

## Рекомендации по развертыванию

### Бесплатные хостинги для PostgreSQL + Node.js:

1. **Railway** ($5/мес, но включает все необходимое)
   - PostgreSQL база данных
   - Node.js приложение
   - Автоматическое развертывание из Git

2. **Render + Aiven** (Бесплатно)
   - Render: Node.js приложение (бесплатный tier)
   - Aiven: PostgreSQL база данных (бесплатно 1GB)

3. **Vercel + Neon** (Бесплатно)
   - Vercel: Frontend и API routes
   - Neon: PostgreSQL база данных (бесплатно 0.5GB)

## Примечания

- Системная переменная окружения `DATABASE_URL` имела приоритет над `.env` файлом, поэтому была добавлена явная установка в скрипт `dev`
- PostgreSQL требует больше памяти, чем MySQL, но предоставляет более богатые возможности
- Все enum типы должны быть объявлены до использования в таблицах
- Метод `onConflictDoUpdate()` в PostgreSQL требует указания конфликтующего поля через `target`

## Дальнейшие шаги

1. Настроить production окружение
2. Добавить резервное копирование базы данных
3. Оптимизировать индексы для часто используемых запросов
4. Настроить мониторинг производительности
5. Развернуть на выбранном хостинге

---

**Дата миграции:** 14 ноября 2025  
**Версия PostgreSQL:** 14.x  
**Статус:** ✅ Успешно завершено
