# Анализ базы данных Beauty Coworking

## Общая информация

**Проект:** Бьюти-коворкинг  
**СУБД:** PostgreSQL 14+  
**ORM:** Drizzle ORM  
**Язык схемы:** TypeScript

## Описание проекта

Современное веб-приложение для управления бронированиями рабочих мест в бьюти-коворкинге. Система предоставляет функциональность для пользователей, специалистов и администраторов, включая каталог рабочих мест, систему бронирований с QR-кодами, финансовую систему с автоматическими транзакциями и систему отзывов.

## Структура базы данных

База данных состоит из **7 основных таблиц** и использует **9 перечислений (ENUM)** для типизации данных.

### Таблицы

#### 1. users (Пользователи)

Основная таблица для хранения информации о пользователях системы.

**Поля:**
- `id` (integer, PK, auto-increment) - уникальный идентификатор
- `openId` (varchar(64), unique, NOT NULL) - идентификатор для аутентификации
- `name` (text) - имя пользователя
- `email` (varchar(320)) - электронная почта
- `loginMethod` (varchar(64)) - метод входа в систему
- `role` (enum: user/admin/specialist, default: user) - роль пользователя
- `phone` (varchar(20)) - номер телефона
- `avatar` (text) - URL аватара
- `bio` (text) - биография/описание
- `specialization` (varchar(100)) - специализация (для специалистов)
- `points` (integer, default: 0) - баллы лояльности
- `status` (enum: bronze/silver/gold, default: bronze) - статус пользователя
- `createdAt` (timestamp, default: now()) - дата создания
- `updatedAt` (timestamp, default: now()) - дата обновления
- `lastSignedIn` (timestamp, default: now()) - последний вход

**Особенности:**
- Поддержка системы лояльности (points, status)
- Разделение ролей: обычные пользователи, администраторы и специалисты
- Гибкая система аутентификации через openId

#### 2. workspaces (Рабочие места)

Таблица для хранения информации о рабочих местах в коворкинге.

**Поля:**
- `id` (integer, PK, auto-increment) - уникальный идентификатор
- `name` (varchar(200), NOT NULL) - название рабочего места
- `description` (text) - описание
- `type` (enum: hairdresser/makeup/manicure/cosmetology/massage, NOT NULL) - тип рабочего места
- `pricePerHour` (integer, NOT NULL) - цена за час (в рублях)
- `pricePerDay` (integer, NOT NULL) - цена за день (в рублях)
- `imageUrl` (text) - URL изображения
- `amenities` (text) - удобства (JSON array)
- `equipment` (text) - оборудование с брендами (JSON array: `[{name, brand, model?}]`)
- `isAvailable` (boolean, default: true) - доступность
- `rating` (numeric(3,1), default: 0) - рейтинг от 0 до 5.0
- `reviewCount` (integer, default: 0) - количество отзывов
- `createdAt` (timestamp, default: now()) - дата создания
- `updatedAt` (timestamp, default: now()) - дата обновления

**Особенности:**
- Поддержка различных типов рабочих мест для бьюти-индустрии
- Гибкая система ценообразования (почасовая и дневная аренда)
- Хранение структурированных данных в JSON (amenities, equipment)
- Автоматический расчет рейтинга на основе отзывов

#### 3. bookings (Бронирования)

Таблица для управления бронированиями рабочих мест.

**Поля:**
- `id` (integer, PK, auto-increment) - уникальный идентификатор
- `workspaceId` (integer, NOT NULL) - ID рабочего места
- `userId` (integer, NOT NULL) - ID пользователя
- `startTime` (timestamp, NOT NULL) - время начала
- `endTime` (timestamp, NOT NULL) - время окончания
- `status` (enum: pending/confirmed/cancelled/completed, default: pending) - статус бронирования
- `totalPrice` (integer, NOT NULL) - общая стоимость (в рублях)
- `paymentStatus` (enum: pending/paid/refunded, default: pending) - статус оплаты
- `notes` (text) - заметки
- `createdAt` (timestamp, default: now()) - дата создания
- `updatedAt` (timestamp, default: now()) - дата обновления

**Особенности:**
- Отдельное отслеживание статуса бронирования и статуса оплаты
- Поддержка временных интервалов для бронирования
- Возможность добавления заметок к бронированию

#### 4. reviews (Отзывы)

Таблица для хранения отзывов пользователей о рабочих местах.

**Поля:**
- `id` (integer, PK, auto-increment) - уникальный идентификатор
- `workspaceId` (integer, NOT NULL) - ID рабочего места
- `userId` (integer, NOT NULL) - ID пользователя
- `bookingId` (integer, nullable) - ID бронирования (опционально)
- `rating` (integer, NOT NULL) - оценка от 1 до 5 звезд
- `comment` (text) - текст отзыва
- `createdAt` (timestamp, default: now()) - дата создания
- `updatedAt` (timestamp, default: now()) - дата обновления

**Особенности:**
- Связь с бронированием (опциональная)
- Простая система оценок (1-5 звезд)
- Возможность оставлять текстовые комментарии

#### 5. transactions (Финансовые транзакции)

Таблица для учета всех финансовых операций в системе.

**Поля:**
- `id` (integer, PK, auto-increment) - уникальный идентификатор
- `userId` (integer, NOT NULL) - ID пользователя
- `bookingId` (integer, nullable) - ID бронирования (опционально)
- `type` (enum: payment/refund/deposit/withdrawal, NOT NULL) - тип транзакции
- `amount` (integer, NOT NULL) - сумма (в рублях)
- `status` (enum: pending/completed/failed, default: pending) - статус транзакции
- `description` (text) - описание
- `createdAt` (timestamp, default: now()) - дата создания
- `updatedAt` (timestamp, default: now()) - дата обновления

**Особенности:**
- Поддержка различных типов транзакций (платежи, возвраты, депозиты, снятия)
- Отслеживание статуса каждой транзакции
- Связь с бронированиями для автоматических платежей

#### 6. sqlLogs (Логи SQL-запросов)

Таблица для мониторинга и отладки SQL-запросов.

**Поля:**
- `id` (integer, PK, auto-increment) - уникальный идентификатор
- `query` (text, NOT NULL) - текст SQL-запроса
- `operation` (enum: SELECT/INSERT/UPDATE/DELETE/OTHER, NOT NULL) - тип операции
- `executionTime` (integer) - время выполнения (в миллисекундах)
- `userId` (integer, nullable) - ID пользователя, инициировавшего запрос
- `endpoint` (varchar(255)) - API endpoint
- `params` (text) - параметры запроса (JSON)
- `error` (text) - текст ошибки (если есть)
- `createdAt` (timestamp, default: now()) - дата создания

**Особенности:**
- Полное логирование всех SQL-операций
- Измерение производительности запросов
- Отслеживание ошибок и их контекста
- Связь с пользователями для аудита

#### 7. adminLogs (Логи действий администратора)

Таблица для аудита действий администраторов.

**Поля:**
- `id` (integer, PK, auto-increment) - уникальный идентификатор
- `adminId` (integer, NOT NULL) - ID администратора
- `action` (enum, NOT NULL) - тип действия (см. ниже)
- `entityType` (varchar(50), NOT NULL) - тип сущности (user/workspace/booking/review)
- `entityId` (integer, nullable) - ID сущности
- `details` (text) - детали действия (JSON)
- `createdAt` (timestamp, default: now()) - дата создания

**Типы действий (admin_action enum):**
- user_created, user_updated, user_deleted
- workspace_created, workspace_updated, workspace_deleted
- booking_updated
- review_deleted

**Особенности:**
- Полный аудит административных действий
- Структурированное хранение деталей в JSON
- Отслеживание изменений во всех критичных сущностях

### Перечисления (ENUM)

#### 1. role (Роли пользователей)
- `user` - обычный пользователь
- `admin` - администратор
- `specialist` - специалист

#### 2. status (Статус лояльности)
- `bronze` - бронзовый статус
- `silver` - серебряный статус
- `gold` - золотой статус

#### 3. workspace_type (Типы рабочих мест)
- `hairdresser` - парикмахер
- `makeup` - визажист
- `manicure` - маникюр
- `cosmetology` - косметология
- `massage` - массаж

#### 4. booking_status (Статусы бронирования)
- `pending` - ожидает подтверждения
- `confirmed` - подтверждено
- `cancelled` - отменено
- `completed` - завершено

#### 5. payment_status (Статусы оплаты)
- `pending` - ожидает оплаты
- `paid` - оплачено
- `refunded` - возвращено

#### 6. transaction_type (Типы транзакций)
- `payment` - платеж
- `refund` - возврат
- `deposit` - депозит
- `withdrawal` - снятие

#### 7. transaction_status (Статусы транзакций)
- `pending` - в обработке
- `completed` - завершена
- `failed` - ошибка

#### 8. operation (Типы SQL-операций)
- `SELECT` - выборка данных
- `INSERT` - вставка данных
- `UPDATE` - обновление данных
- `DELETE` - удаление данных
- `OTHER` - прочие операции

#### 9. admin_action (Действия администратора)
- `user_created`, `user_updated`, `user_deleted`
- `workspace_created`, `workspace_updated`, `workspace_deleted`
- `booking_updated`
- `review_deleted`

## Связи между таблицами

### Прямые связи (Foreign Keys)

Хотя в миграциях не определены явные внешние ключи (constraints), логические связи следующие:

1. **bookings → workspaces** (многие к одному)
   - `bookings.workspaceId` → `workspaces.id`

2. **bookings → users** (многие к одному)
   - `bookings.userId` → `users.id`

3. **reviews → workspaces** (многие к одному)
   - `reviews.workspaceId` → `workspaces.id`

4. **reviews → users** (многие к одному)
   - `reviews.userId` → `users.id`

5. **reviews → bookings** (один к одному, опционально)
   - `reviews.bookingId` → `bookings.id`

6. **transactions → users** (многие к одному)
   - `transactions.userId` → `users.id`

7. **transactions → bookings** (многие к одному, опционально)
   - `transactions.bookingId` → `bookings.id`

8. **sqlLogs → users** (многие к одному, опционально)
   - `sqlLogs.userId` → `users.id`

9. **adminLogs → users** (многие к одному)
   - `adminLogs.adminId` → `users.id`

### Диаграмма связей

```
users (1) ──< (∞) bookings (∞) >── (1) workspaces
  │                   │
  │                   └──> (0..1) reviews (∞) >── (1) workspaces
  │                   │
  │                   └──> (0..∞) transactions
  │
  ├──< (∞) reviews
  ├──< (∞) transactions
  ├──< (0..∞) sqlLogs
  └──< (∞) adminLogs (только для role='admin')
```

## История миграций

### Migration 0000: Начальная схема
- Создание всех основных таблиц
- Определение всех ENUM типов
- Установка базовых ограничений и значений по умолчанию

### Migration 0001: Изменение типа рейтинга
- Изменение типа поля `workspaces.rating` с `integer` на `numeric(3,1)`
- Позволяет хранить рейтинг с точностью до одного десятичного знака (например, 4.5)

### Migration 0002: Добавление логов администратора
- Создание ENUM `admin_action`
- Создание таблицы `adminLogs` для аудита действий администраторов

### Migration 0003: Добавление оборудования
- Добавление поля `equipment` в таблицу `workspaces`
- Поддержка хранения информации об оборудовании с брендами в формате JSON

## Особенности реализации

### 1. Использование JSON для гибких данных
Таблица `workspaces` использует текстовые поля для хранения JSON-структур:
- `amenities` - массив удобств
- `equipment` - массив объектов с информацией об оборудовании `[{name, brand, model?}]`

Это обеспечивает гибкость без необходимости создания дополнительных таблиц.

### 2. Автоматические временные метки
Все основные таблицы имеют поля `createdAt` и `updatedAt` (кроме логов), что позволяет отслеживать историю изменений.

### 3. Система лояльности
Пользователи имеют:
- `points` - накопленные баллы
- `status` - уровень (bronze/silver/gold)

Это позволяет реализовать программу лояльности.

### 4. Двойное отслеживание статусов
Бронирования имеют два независимых статуса:
- `status` - статус самого бронирования (pending/confirmed/cancelled/completed)
- `paymentStatus` - статус оплаты (pending/paid/refunded)

Это обеспечивает гибкость в управлении бронированиями и платежами.

### 5. Комплексное логирование
Система включает два уровня логирования:
- `sqlLogs` - технические логи SQL-запросов для мониторинга производительности
- `adminLogs` - бизнес-логи действий администраторов для аудита

### 6. Гибкая система ценообразования
Рабочие места поддерживают два типа аренды:
- `pricePerHour` - почасовая аренда
- `pricePerDay` - дневная аренда

### 7. Автоматическая генерация ID
Все таблицы используют `GENERATED ALWAYS AS IDENTITY` для автоматической генерации первичных ключей, что является современным подходом в PostgreSQL.

## Индексы и оптимизация

### Существующие уникальные ограничения
- `users.openId` - уникальный индекс для быстрой аутентификации

### Рекомендуемые индексы (не реализованы в текущей схеме)
Для оптимизации производительности рекомендуется добавить следующие индексы:

```sql
-- Для быстрого поиска бронирований
CREATE INDEX idx_bookings_workspace ON bookings(workspaceId);
CREATE INDEX idx_bookings_user ON bookings(userId);
CREATE INDEX idx_bookings_dates ON bookings(startTime, endTime);

-- Для быстрого поиска отзывов
CREATE INDEX idx_reviews_workspace ON reviews(workspaceId);
CREATE INDEX idx_reviews_user ON reviews(userId);

-- Для быстрого поиска транзакций
CREATE INDEX idx_transactions_user ON transactions(userId);
CREATE INDEX idx_transactions_booking ON transactions(bookingId);

-- Для фильтрации рабочих мест
CREATE INDEX idx_workspaces_type ON workspaces(type);
CREATE INDEX idx_workspaces_available ON workspaces(isAvailable);

-- Для логов
CREATE INDEX idx_sqllogs_created ON sqlLogs(createdAt);
CREATE INDEX idx_adminlogs_admin ON adminLogs(adminId);
```

## Потенциальные улучшения

### 1. Добавление Foreign Key Constraints
Текущая схема не содержит явных внешних ключей. Рекомендуется добавить их для обеспечения целостности данных:

```sql
ALTER TABLE bookings 
  ADD CONSTRAINT fk_bookings_workspace 
  FOREIGN KEY (workspaceId) REFERENCES workspaces(id) ON DELETE CASCADE;

ALTER TABLE bookings 
  ADD CONSTRAINT fk_bookings_user 
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE;

-- И так далее для остальных связей
```

### 2. Добавление Check Constraints
Для обеспечения валидности данных:

```sql
-- Проверка рейтинга отзывов
ALTER TABLE reviews 
  ADD CONSTRAINT check_rating 
  CHECK (rating >= 1 AND rating <= 5);

-- Проверка времени бронирования
ALTER TABLE bookings 
  ADD CONSTRAINT check_booking_time 
  CHECK (endTime > startTime);

-- Проверка цен
ALTER TABLE workspaces 
  ADD CONSTRAINT check_prices 
  CHECK (pricePerHour > 0 AND pricePerDay > 0);
```

### 3. Нормализация JSON-полей
Для больших объемов данных рекомендуется создать отдельные таблицы:
- `workspace_amenities` - для удобств
- `workspace_equipment` - для оборудования

Это улучшит производительность поиска и фильтрации.

### 4. Добавление полнотекстового поиска
Для поиска по названиям и описаниям рабочих мест:

```sql
ALTER TABLE workspaces 
  ADD COLUMN search_vector tsvector;

CREATE INDEX idx_workspaces_search 
  ON workspaces USING GIN(search_vector);
```

### 5. Партиционирование логов
Для таблиц `sqlLogs` и `adminLogs` при больших объемах данных рекомендуется использовать партиционирование по дате.

## Безопасность

### Текущие меры
1. Использование ENUM для ограничения допустимых значений
2. NOT NULL constraints для критичных полей
3. Unique constraint для `users.openId`

### Рекомендации
1. Добавить Row Level Security (RLS) для ограничения доступа к данным
2. Создать отдельные роли БД для приложения и администраторов
3. Шифровать чувствительные данные (например, email, phone)
4. Регулярно архивировать старые логи

## Заключение

База данных проекта Beauty Coworking представляет собой хорошо структурированную систему для управления бьюти-коворкингом. Схема включает все необходимые сущности для работы с пользователями, рабочими местами, бронированиями, отзывами и финансовыми транзакциями.

**Сильные стороны:**
- Четкая структура с использованием ENUM для типизации
- Комплексное логирование (SQL и административные действия)
- Гибкая система ценообразования и статусов
- Поддержка программы лояльности
- Использование современных возможностей PostgreSQL

**Области для улучшения:**
- Добавление Foreign Key constraints
- Создание индексов для оптимизации запросов
- Добавление Check constraints для валидации
- Рассмотрение нормализации JSON-полей при росте данных

Схема готова к использованию в production с учетом рекомендованных улучшений для повышения производительности и целостности данных.
