# Beauty Coworking - Расширенная база данных

## Обзор обновления

Проект был расширен с **7 до 20 таблиц** с полной админ-панелью для управления всеми данными и комплексной системой логирования.

## Структура базы данных

### Основные таблицы (7)

1. **users** - Пользователи системы (клиенты, специалисты, администраторы)
   - Расширено: firstName, lastName, birthDate, taxID, membershipStatus

2. **workspaces** - Рабочие места в коворкинге
   - Расширено: identifier, floorLevel, maxCapacity, occupancyStatus

3. **bookings** - Бронирования рабочих мест
   - Расширено: bookingNumber, qrCode

4. **reviews** - Отзывы о рабочих местах
   - Расширено: response, isVerified

5. **transactions** - Финансовые транзакции
   - Расширено: transactionNumber, currency, paymentMethod

6. **sqlLogs** - Логи SQL запросов

7. **adminLogs** - Логи действий администратора

### Новые таблицы (13)

8. **tariffs** - Тарифные планы для аренды
9. **equipment** - Оборудование в коворкинге
10. **materials** - Расходные материалы и косметика
11. **contracts** - Контракты со специалистами
12. **accessPasses** - Пропуска для доступа
13. **serviceRecords** - Записи об оказанных услугах
14. **invoices** - Счета на оплату
15. **payments** - Платежи по счетам
16. **maintenanceRequests** - Заявки на техническое обслуживание
17. **staff** - Персонал коворкинга
18. **financialReports** - Финансовые отчеты
19. **incidentRegistry** - Реестр инцидентов
20. **notifications** - Уведомления для пользователей
21. **promotions** - Акции и промокоды
22. **workSchedule** - График работы специалистов

## Новые ENUM типы

```typescript
membership_status: active, inactive, suspended, pending
billing_increment: hourly, daily, weekly, monthly, quarterly, yearly
maintenance_status: operational, maintenance, broken, retired
contract_status: active, expired, terminated, pending
pass_type: temporary, permanent, visitor
access_level: basic, standard, premium, vip
pass_status: active, expired, revoked
invoice_status: draft, sent, paid, overdue, cancelled
payment_method: card, cash, transfer, online, qr_code
priority: low, medium, high, urgent
issue_type: breakdown, scheduled, replacement, adjustment, cleaning
request_status: open, in_progress, resolved, closed
staff_status: active, on_leave, terminated
incident_severity: minor, moderate, major, critical
incident_status: reported, investigating, resolved, closed
notification_type: booking, payment, maintenance, promotion, system
notification_priority: low, normal, high
discount_type: percentage, fixed
target_audience: all, new_clients, specialists, vip
day_of_week: Monday-Sunday
schedule_status: active, cancelled
occupancy_status: available, occupied, reserved, maintenance
```

## API Endpoints

### Админ-панель

Все endpoints требуют авторизации с ролью `admin`.

#### Dashboard
- `GET /api/admin/stats` - Статистика для дашборда

#### Users
- `GET /api/admin/users` - Список всех пользователей
- `PUT /api/admin/users/:id` - Обновить пользователя
- `DELETE /api/admin/users/:id` - Удалить пользователя

#### Workspaces
- `GET /api/admin/workspaces` - Список рабочих мест
- `POST /api/admin/workspaces` - Создать рабочее место
- `PUT /api/admin/workspaces/:id` - Обновить рабочее место
- `DELETE /api/admin/workspaces/:id` - Удалить рабочее место

#### Tariffs
- `GET /api/admin/tariffs` - Список тарифов
- `POST /api/admin/tariffs` - Создать тариф
- `PUT /api/admin/tariffs/:id` - Обновить тариф
- `DELETE /api/admin/tariffs/:id` - Удалить тариф

#### Equipment
- `GET /api/admin/equipment` - Список оборудования
- `POST /api/admin/equipment` - Добавить оборудование
- `PUT /api/admin/equipment/:id` - Обновить оборудование
- `DELETE /api/admin/equipment/:id` - Удалить оборудование

#### Materials
- `GET /api/admin/materials` - Список материалов
- `POST /api/admin/materials` - Добавить материал
- `PUT /api/admin/materials/:id` - Обновить материал
- `DELETE /api/admin/materials/:id` - Удалить материал

#### Logs
- `GET /api/admin/logs` - Просмотр логов действий администратора

*Аналогичные endpoints для всех остальных таблиц*

## Система логирования

### Admin Logs

Все действия администратора автоматически логируются:

```typescript
{
  adminId: number,        // ID администратора
  action: string,         // Тип действия (created, updated, deleted)
  entityType: string,     // Тип сущности (user, workspace, tariff, etc.)
  entityId: number,       // ID сущности
  details: string,        // JSON с деталями действия
  createdAt: timestamp    // Время действия
}
```

### Типы действий

- **Users**: user_created, user_updated, user_deleted
- **Workspaces**: workspace_created, workspace_updated, workspace_deleted
- **Tariffs**: tariff_created, tariff_updated, tariff_deleted
- **Equipment**: equipment_created, equipment_updated, equipment_deleted
- **Materials**: material_created, material_updated, material_deleted
- И так далее для всех таблиц...

## Миграция

### Применение миграции

```bash
# Применить новую миграцию
npm run db:migrate

# Или вручную через psql
psql -h your-host -U your-user -d your-database -f drizzle/0004_add_extended_tables.sql
```

### Откат миграции

Для отката миграции необходимо:
1. Удалить новые таблицы
2. Удалить новые ENUM типы
3. Удалить добавленные колонки из существующих таблиц

## Связи между таблицами

### Users
- Имеет много: bookings, reviews, transactions, contracts, accessPasses, serviceRecords, invoices, payments, maintenanceRequests, notifications, workSchedule

### Workspaces
- Имеет много: bookings, reviews, equipment, serviceRecords, maintenanceRequests, incidents, workSchedule

### Bookings
- Принадлежит: workspace, user
- Имеет много: reviews, transactions, invoices

### Contracts
- Принадлежит: specialist (user), tariff
- Имеет много: accessPasses, invoices

### Equipment
- Принадлежит: workspace
- Имеет много: maintenanceRequests

### Invoices
- Принадлежит: user, booking (optional), contract (optional)
- Имеет много: payments

## Файловая структура

```
beauty-coworking-postgres/
├── drizzle/
│   ├── schema.ts                    # ✅ Обновлено - все 20 таблиц
│   ├── relations.ts                 # ✅ Обновлено - все связи
│   ├── 0004_add_extended_tables.sql # ✅ Новая миграция
│   └── ...
├── server/
│   ├── adminRouter.ts               # ✅ Обновлено - CRUD для всех таблиц
│   └── ...
├── client/
│   └── src/
│       └── pages/
│           └── admin/
│               ├── AdminDashboard.tsx
│               ├── AdminUsers.tsx
│               ├── AdminWorkspaces.tsx
│               ├── AdminTariffs.tsx       # 🔜 Создать
│               ├── AdminEquipment.tsx     # 🔜 Создать
│               ├── AdminMaterials.tsx     # 🔜 Создать
│               └── ...                    # 🔜 Остальные страницы
└── ...
```

## Следующие шаги

### Для завершения обновления необходимо:

1. ✅ Обновить schema.ts
2. ✅ Обновить relations.ts
3. ✅ Создать миграцию
4. ✅ Обновить adminRouter.ts
5. 🔜 Создать админ-страницы для новых таблиц
6. 🔜 Обновить навигацию в админ-панели
7. 🔜 Применить миграцию к базе данных
8. 🔜 Протестировать все CRUD операции

### Создание админ-страниц

Для каждой новой таблицы создать страницу по аналогии с `AdminUsers.tsx`:

```typescript
// Пример: AdminTariffs.tsx
import { useState, useEffect } from "react";
import { Card, Table, Button, Modal, Form } from "react-bootstrap";

export function AdminTariffs() {
  const [tariffs, setTariffs] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTariff, setSelectedTariff] = useState(null);

  // Загрузка данных
  useEffect(() => {
    fetchTariffs();
  }, []);

  const fetchTariffs = async () => {
    const response = await fetch("/api/admin/tariffs");
    const data = await response.json();
    setTariffs(data);
  };

  // CRUD операции
  const handleCreate = async (data) => { /* ... */ };
  const handleUpdate = async (id, data) => { /* ... */ };
  const handleDelete = async (id) => { /* ... */ };

  return (
    <Card>
      <Card.Header>
        <h3>Управление тарифами</h3>
        <Button onClick={() => setShowModal(true)}>Добавить тариф</Button>
      </Card.Header>
      <Card.Body>
        <Table>
          {/* Таблица с данными */}
        </Table>
      </Card.Body>
    </Card>
  );
}
```

## Рекомендации по использованию

### Для разработчиков

1. Используйте Drizzle ORM для всех операций с БД
2. Всегда логируйте действия администратора через `logAdminAction()`
3. Проверяйте права доступа через middleware `requireAdmin`
4. Используйте транзакции для связанных операций

### Для администраторов

1. Все действия логируются и доступны в разделе "Логи"
2. Удаление данных может быть необратимым - будьте осторожны
3. Используйте фильтры и поиск для быстрого нахождения данных
4. Регулярно проверяйте финансовые отчеты

## Безопасность

- ✅ Все админ-endpoints защищены middleware
- ✅ Проверка роли пользователя на каждый запрос
- ✅ Логирование всех действий администратора
- ✅ SQL-инъекции предотвращены через Drizzle ORM
- ✅ Валидация данных на уровне схемы

## Производительность

- ✅ Индексы на внешних ключах
- ✅ Индексы на часто используемых полях
- ✅ Пагинация для больших списков (рекомендуется добавить)
- ✅ Кэширование статистики (рекомендуется добавить)

## Поддержка

При возникновении проблем:
1. Проверьте логи SQL (`sqlLogs`)
2. Проверьте логи администратора (`adminLogs`)
3. Проверьте консоль браузера и сервера
4. Убедитесь, что миграция применена корректно

---

**Дата обновления**: 21 ноября 2024  
**Версия**: 2.0  
**Автор**: Beauty Coworking Development Team
