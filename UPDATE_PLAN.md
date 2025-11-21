# План обновления проекта Beauty Coworking

## Цель
Расширить проект до 20 таблиц с полной админ-панелью и системой логирования.

## Текущее состояние
- ✅ 7 таблиц: users, workspaces, bookings, reviews, transactions, sqlLogs, adminLogs
- ✅ Базовая админ-панель для users, workspaces, bookings, reviews
- ✅ Drizzle ORM с PostgreSQL
- ✅ Базовое логирование SQL и админ-действий

## Новые таблицы (13 штук)

### 1. tariffs - Тарифные планы
- id, name, description, price, currency, billingIncrement
- validFrom, validThrough, isActive

### 2. equipment - Оборудование
- id, name, brand, model, serialNumber, category
- workspaceId, purchaseDate, warrantyExpiry
- maintenanceStatus, lastMaintenanceDate, location

### 3. materials - Материалы и расходники
- id, name, sku, category, quantityInStock
- unitOfMeasurement, pricePerUnit, supplier
- reorderLevel, lastRestocked

### 4. contracts - Контракты со специалистами
- id, contractNumber, specialistId, tariffId
- startDate, endDate, status
- monthlyFee, deposit, terms, signedAt

### 5. accessPasses - Пропуска доступа
- id, passNumber, userId, contractId
- passType, validFrom, validThrough
- accessLevel, status, issuedAt

### 6. serviceRecords - Записи об услугах
- id, recordNumber, specialistId, clientName, clientPhone
- serviceType, workspaceId, serviceDate
- duration, revenue, notes

### 7. invoices - Счета на оплату
- id, invoiceNumber, userId, bookingId, contractId
- issueDate, dueDate, totalAmount, taxAmount
- status, paidAt

### 8. payments - Платежи
- id, paymentNumber, invoiceId, userId
- amount, currency, paymentMethod
- paymentDate, status, transactionId, receiptUrl

### 9. maintenanceRequests - Заявки на обслуживание
- id, requestNumber, equipmentId, workspaceId
- reportedBy, issueType, priority
- description, status, assignedTo
- resolvedAt, createdAt

### 10. staff - Персонал коворкинга
- id, firstName, lastName, email, phone
- position, department, hireDate
- salary, status

### 11. financialReports - Финансовые отчеты
- id, reportNumber, reportType
- periodStart, periodEnd
- totalRevenue, totalExpenses, netProfit
- occupancyRate, generatedAt, generatedBy

### 12. incidentRegistry - Реестр инцидентов
- id, incidentNumber, incidentType, severity
- workspaceId, reportedBy, description
- actionTaken, status, occurredAt
- resolvedAt, witnesses, damageEstimate

### 13. notifications - Уведомления
- id, userId, type, title, message
- isRead, priority, createdAt, readAt

### 14. promotions - Акции и промокоды
- id, title, description, discountType, discountValue
- code, validFrom, validThrough
- maxUses, currentUses, targetAudience, isActive

### 15. workSchedule - График работы специалистов
- id, specialistId, workspaceId, dayOfWeek
- startTime, endTime, isRecurring
- effectiveDate, expiryDate, status

## Обновления существующих таблиц

### users
- Добавить: firstName, lastName, birthDate, taxID, membershipStatus

### workspaces
- Добавить: identifier, floorLevel, maxCapacity, occupancyStatus

### bookings
- Добавить: bookingNumber, qrCode

### reviews
- Добавить: response, isVerified

### transactions
- Добавить: transactionNumber, currency, paymentMethod

## Новые ENUM типы

```typescript
export const membershipStatusEnum = pgEnum("membership_status", ["active", "inactive", "suspended", "pending"]);
export const billingIncrementEnum = pgEnum("billing_increment", ["hourly", "daily", "weekly", "monthly", "quarterly", "yearly"]);
export const maintenanceStatusEnum = pgEnum("maintenance_status", ["operational", "maintenance", "broken", "retired"]);
export const contractStatusEnum = pgEnum("contract_status", ["active", "expired", "terminated", "pending"]);
export const passTypeEnum = pgEnum("pass_type", ["temporary", "permanent", "visitor"]);
export const accessLevelEnum = pgEnum("access_level", ["basic", "standard", "premium", "vip"]);
export const passStatusEnum = pgEnum("pass_status", ["active", "expired", "revoked"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const paymentMethodEnum = pgEnum("payment_method", ["card", "cash", "transfer", "online", "qr_code"]);
export const priorityEnum = pgEnum("priority", ["low", "medium", "high", "urgent"]);
export const issueTypeEnum = pgEnum("issue_type", ["breakdown", "scheduled", "replacement", "adjustment", "cleaning"]);
export const requestStatusEnum = pgEnum("request_status", ["open", "in_progress", "resolved", "closed"]);
export const staffStatusEnum = pgEnum("staff_status", ["active", "on_leave", "terminated"]);
export const incidentSeverityEnum = pgEnum("incident_severity", ["minor", "moderate", "major", "critical"]);
export const incidentStatusEnum = pgEnum("incident_status", ["reported", "investigating", "resolved", "closed"]);
export const notificationTypeEnum = pgEnum("notification_type", ["booking", "payment", "maintenance", "promotion", "system"]);
export const notificationPriorityEnum = pgEnum("notification_priority", ["low", "normal", "high"]);
export const discountTypeEnum = pgEnum("discount_type", ["percentage", "fixed"]);
export const targetAudienceEnum = pgEnum("target_audience", ["all", "new_clients", "specialists", "vip"]);
export const dayOfWeekEnum = pgEnum("day_of_week", ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"]);
export const scheduleStatusEnum = pgEnum("schedule_status", ["active", "cancelled"]);
export const occupancyStatusEnum = pgEnum("occupancy_status", ["available", "occupied", "reserved", "maintenance"]);
```

## Админ-панель - новые страницы

1. AdminTariffs - управление тарифами
2. AdminEquipment - управление оборудованием
3. AdminMaterials - управление материалами
4. AdminContracts - управление контрактами
5. AdminAccessPasses - управление пропусками
6. AdminServiceRecords - журнал услуг
7. AdminInvoices - управление счетами
8. AdminPayments - управление платежами
9. AdminMaintenance - заявки на обслуживание
10. AdminStaff - управление персоналом
11. AdminFinancialReports - финансовые отчеты
12. AdminIncidents - реестр инцидентов
13. AdminNotifications - управление уведомлениями
14. AdminPromotions - управление акциями
15. AdminSchedule - график работы
16. AdminLogs - просмотр логов (уже есть, расширить)

## Логирование

Расширить adminActionEnum:
```typescript
export const adminActionEnum = pgEnum("admin_action", [
  // Users
  "user_created", "user_updated", "user_deleted",
  // Workspaces
  "workspace_created", "workspace_updated", "workspace_deleted",
  // Bookings
  "booking_created", "booking_updated", "booking_deleted",
  // Reviews
  "review_updated", "review_deleted",
  // Tariffs
  "tariff_created", "tariff_updated", "tariff_deleted",
  // Equipment
  "equipment_created", "equipment_updated", "equipment_deleted",
  // Materials
  "material_created", "material_updated", "material_deleted",
  // Contracts
  "contract_created", "contract_updated", "contract_deleted",
  // Access Passes
  "pass_created", "pass_updated", "pass_deleted",
  // Service Records
  "service_created", "service_updated", "service_deleted",
  // Invoices
  "invoice_created", "invoice_updated", "invoice_deleted",
  // Payments
  "payment_created", "payment_updated", "payment_deleted",
  // Maintenance
  "maintenance_created", "maintenance_updated", "maintenance_deleted",
  // Staff
  "staff_created", "staff_updated", "staff_deleted",
  // Financial Reports
  "report_created", "report_updated", "report_deleted",
  // Incidents
  "incident_created", "incident_updated", "incident_deleted",
  // Notifications
  "notification_created", "notification_updated", "notification_deleted",
  // Promotions
  "promotion_created", "promotion_updated", "promotion_deleted",
  // Schedule
  "schedule_created", "schedule_updated", "schedule_deleted",
]);
```

## Структура файлов

### Schema files
- `/drizzle/schema.ts` - обновить с новыми таблицами
- `/drizzle/relations.ts` - добавить связи между таблицами

### Migration files
- `/drizzle/0004_add_extended_tables.sql` - новая миграция

### Admin Router
- `/server/adminRouter.ts` - добавить CRUD endpoints для всех таблиц

### Admin Pages
- `/client/src/pages/admin/AdminTariffs.tsx`
- `/client/src/pages/admin/AdminEquipment.tsx`
- `/client/src/pages/admin/AdminMaterials.tsx`
- `/client/src/pages/admin/AdminContracts.tsx`
- `/client/src/pages/admin/AdminAccessPasses.tsx`
- `/client/src/pages/admin/AdminServiceRecords.tsx`
- `/client/src/pages/admin/AdminInvoices.tsx`
- `/client/src/pages/admin/AdminPayments.tsx`
- `/client/src/pages/admin/AdminMaintenance.tsx`
- `/client/src/pages/admin/AdminStaff.tsx`
- `/client/src/pages/admin/AdminFinancialReports.tsx`
- `/client/src/pages/admin/AdminIncidents.tsx`
- `/client/src/pages/admin/AdminNotifications.tsx`
- `/client/src/pages/admin/AdminPromotions.tsx`
- `/client/src/pages/admin/AdminSchedule.tsx`

### Shared types
- `/shared/types.ts` - добавить типы для новых таблиц

## Приоритеты

1. ✅ Создать новые ENUM типы
2. ✅ Обновить schema.ts с новыми таблицами
3. ✅ Обновить relations.ts
4. ✅ Создать миграцию
5. ✅ Обновить adminRouter.ts с CRUD endpoints
6. ✅ Создать админ-страницы
7. ✅ Обновить навигацию в админ-панели
8. ✅ Расширить систему логирования
9. ✅ Обновить документацию

## Технические детали

- Использовать Drizzle ORM для всех операций с БД
- Все даты в timestamp
- Цены в integer (копейки) или numeric для точности
- JSON поля для гибких данных (amenities, equipment, details)
- Foreign keys через relations
- Индексы на часто используемые поля
- Валидация на уровне схемы и API
