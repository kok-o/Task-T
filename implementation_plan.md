# MVP: Система записи для студии маникюра

Небольшое веб-приложение для управления записями в студии на 3 мастера.
Заменяет WhatsApp/Instagram/бумажный журнал, исключает двойные бронирования и автоматизирует напоминания.

---

## 1. Архитектура проекта

### Общая схема

```
┌──────────────────────────────────────────────────┐
│                   Frontend (React)                │
│    Vite + React + TypeScript + React Query        │
│         Tailwind CSS + shadcn/ui                  │
└─────────────────────┬────────────────────────────┘
                      │ REST API (JSON)
┌─────────────────────▼────────────────────────────┐
│                   Backend (Node.js)               │
│         Express + TypeScript + Prisma ORM         │
│    JWT Auth · Zod Validation · node-cron          │
└─────────────────────┬────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │      PostgreSQL            │
        │  (Railway / Supabase)      │
        └────────────────────────────┘
```

### Разделение ролей

| Роль | Возможности |
|------|-------------|
| **Owner (Владелец)** | Полный доступ: мастера, записи, настройки |
| **Master (Мастер)** | Видит свой календарь, статус записей |
| **Client (Клиент)** | Книжка самозаписи (опционально в MVP) |

> [!NOTE]
> В MVP достаточно двух ролей: **Owner** и **Master**. Самозапись клиентом — опциональная фича.

### Технологический стек

| Слой | Технология | Обоснование |
|------|-----------|-------------|
| Frontend | React 18 + TypeScript | Декларативный UI, строгая типизация |
| Сборщик | Vite | Быстрый hot-reload, простой конфиг |
| UI Kit | shadcn/ui + Tailwind CSS | Готовые компоненты, легко кастомизировать |
| Календарь | react-big-calendar | Зрелая библиотека, недельный/дневной вид |
| HTTP-клиент | TanStack Query (React Query) | Кэш, состояние загрузки, инвалидация |
| Backend | Node.js + Express + TypeScript | Простота, огромная экосистема |
| ORM | Prisma | Type-safe запросы, удобные миграции |
| БД | PostgreSQL | Транзакции, constraints, надёжность |
| Валидация | Zod | Совместима с TypeScript, переиспользуется на front/back |
| Auth | JWT (access + refresh) | Stateless, просто в MVP |
| Уведомления | node-cron + Nodemailer / Telegram Bot API | Крон для напоминаний, Telegram — дешевле SMS |
| Хостинг | Railway (back + DB) + Vercel (front) | Бесплатный tier, деплой из Git |

---

## 2. Основные сущности

### User (Пользователь системы)
Аккаунт для входа в панель. Роли: `OWNER`, `MASTER`.

### Master (Мастер)
Профиль специалиста. Может быть привязан к `User` (если мастер сам логинится) или нет. Хранит имя, контакт, рабочие часы, цвет в календаре.

### Service (Услуга)
Прейскурант студии: название, длительность (мин.), цена. Например: «Маникюр — 60 мин — 2000₽».

### Client (Клиент)
Карточка клиента: имя, телефон, email/Telegram. Не является пользователем системы.

### Appointment (Запись)
Центральная сущность. Связывает мастера, клиента и услугу на конкретный слот времени. Хранит статус и историю изменений.

### TimeSlot / WorkSchedule (Рабочий график)
Определяет доступность мастера: дни недели, начало/конец рабочего дня, перерывы, выходные.

### Notification (Уведомление)
Лог отправленных напоминаний — кому, когда, по какому каналу, доставлено ли.

---

## 3. Структура базы данных

### Таблица `users`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| email | varchar unique | Логин |
| password_hash | varchar | bcrypt |
| role | enum (OWNER, MASTER) | |
| created_at | timestamptz | |

### Таблица `masters`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| user_id | uuid FK → users (nullable) | Если мастер логинится сам |
| name | varchar | Отображаемое имя |
| phone | varchar | |
| telegram_chat_id | varchar (nullable) | Для уведомлений |
| color | varchar | HEX-цвет в календаре (#FF6B9D) |
| is_active | boolean | Мягкое удаление |
| created_at | timestamptz | |

### Таблица `services`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| name | varchar | «Маникюр классический» |
| duration_minutes | int | Длина слота |
| price | decimal(10,2) | |
| is_active | boolean | |

### Таблица `clients`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| name | varchar | |
| phone | varchar unique | Основной идентификатор |
| email | varchar (nullable) | Для email-напоминаний |
| telegram_chat_id | varchar (nullable) | Для Telegram-напоминаний |
| notes | text (nullable) | Заметки мастера |
| created_at | timestamptz | |

### Таблица `work_schedules`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| master_id | uuid FK → masters | |
| day_of_week | int (0–6) | 0=вс, 1=пн, ... |
| start_time | time | «09:00» |
| end_time | time | «19:00» |
| is_day_off | boolean | Выходной день |

### Таблица `day_offs`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| master_id | uuid FK → masters | |
| date | date | Конкретная дата выходного |
| reason | varchar (nullable) | |

### Таблица `appointments`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| master_id | uuid FK → masters | |
| client_id | uuid FK → clients | |
| service_id | uuid FK → services | |
| starts_at | timestamptz | Начало записи |
| ends_at | timestamptz | Вычисляется: starts_at + duration |
| status | enum | PENDING, CONFIRMED, CANCELLED, COMPLETED, NO_SHOW |
| notes | text (nullable) | Примечания |
| cancelled_by | enum (nullable) | CLIENT, MASTER, OWNER |
| cancel_reason | varchar (nullable) | |
| created_at | timestamptz | |
| updated_at | timestamptz | |

> [!IMPORTANT]
> **Защита от двойного бронирования**: уникальный constraint/index на пересечение `(master_id, starts_at, ends_at)` + CHECK constraint на уровне БД. Дополнительно — проверка в транзакции на уровне сервиса.

### Таблица `notifications`
| Поле | Тип | Описание |
|------|-----|----------|
| id | uuid PK | |
| appointment_id | uuid FK → appointments | |
| recipient_type | enum (CLIENT, MASTER) | |
| channel | enum (EMAIL, TELEGRAM, SMS) | |
| scheduled_at | timestamptz | Когда отправить |
| sent_at | timestamptz (nullable) | Фактическое время |
| status | enum (PENDING, SENT, FAILED) | |
| message | text | Текст сообщения |

---

## 4. Backend API (эндпоинты)

Базовый префикс: `/api/v1`

### Auth
| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/auth/login` | Логин, возвращает access + refresh токены |
| POST | `/auth/refresh` | Обновление access токена |
| POST | `/auth/logout` | Инвалидация refresh токена |

### Masters
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/masters` | OWNER, MASTER | Список всех мастеров |
| GET | `/masters/:id` | OWNER, MASTER | Мастер по ID |
| POST | `/masters` | OWNER | Создать мастера |
| PATCH | `/masters/:id` | OWNER | Обновить данные |
| DELETE | `/masters/:id` | OWNER | Деактивировать (soft delete) |
| GET | `/masters/:id/schedule` | OWNER, MASTER | Рабочий график |
| PUT | `/masters/:id/schedule` | OWNER | Обновить график |
| POST | `/masters/:id/day-offs` | OWNER, MASTER | Добавить выходной |
| DELETE | `/masters/:id/day-offs/:dayOffId` | OWNER | Удалить выходной |
| GET | `/masters/:id/slots?date=YYYY-MM-DD` | ANY | Свободные слоты на дату |

### Services
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/services` | ANY | Список услуг |
| POST | `/services` | OWNER | Создать услугу |
| PATCH | `/services/:id` | OWNER | Обновить |
| DELETE | `/services/:id` | OWNER | Деактивировать |

### Clients
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/clients` | OWNER, MASTER | Список (поиск по имени/телефону) |
| GET | `/clients/:id` | OWNER, MASTER | Клиент + история записей |
| POST | `/clients` | OWNER, MASTER | Создать клиента |
| PATCH | `/clients/:id` | OWNER, MASTER | Обновить |

### Appointments
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/appointments` | OWNER, MASTER | Список с фильтрами (date, master_id, status) |
| GET | `/appointments/:id` | OWNER, MASTER | Запись по ID |
| POST | `/appointments` | OWNER, MASTER | **Создать запись** (проверка конфликтов + отправка уведомлений) |
| PATCH | `/appointments/:id` | OWNER, MASTER | Перенос/изменение |
| POST | `/appointments/:id/cancel` | OWNER, MASTER | Отмена с причиной |
| POST | `/appointments/:id/complete` | OWNER, MASTER | Завершить визит |
| POST | `/appointments/:id/no-show` | OWNER, MASTER | Отметить неявку |

### Notifications
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/notifications` | OWNER | Лог уведомлений |
| POST | `/notifications/test` | OWNER | Тест-отправка |

### Dashboard
| Метод | Путь | Доступ | Описание |
|-------|------|--------|----------|
| GET | `/dashboard/today` | OWNER, MASTER | Записи на сегодня + сводка |

---

## 5. Frontend страницы

| Маршрут | Страница | Роль |
|---------|----------|------|
| `/login` | Авторизация | Публичная |
| `/` → redirect | — | — |
| `/dashboard` | Главная / сегодняшние записи | OWNER, MASTER |
| `/calendar` | Полный календарь | OWNER, MASTER |
| `/appointments/new` | Создание записи | OWNER, MASTER |
| `/appointments/:id` | Детали записи | OWNER, MASTER |
| `/clients` | Список клиентов | OWNER, MASTER |
| `/clients/:id` | Профиль клиента + история | OWNER, MASTER |
| `/masters` | Управление мастерами | OWNER |
| `/masters/:id` | Профиль мастера + график | OWNER |
| `/services` | Прейскурант | OWNER |
| `/settings` | Настройки студии, уведомления | OWNER |

---

## 6. Компоненты интерфейса

### Layout
- `AppLayout` — сайдбар + топбар + область контента
- `Sidebar` — навигация с иконками и ролевыми ограничениями
- `TopBar` — заголовок страницы, уведомления, профиль

### Общие (Shared)
- `Avatar` — аватар мастера с цветом
- `StatusBadge` — бейдж статуса записи (цветной)
- `ConfirmDialog` — модалка подтверждения действия
- `EmptyState` — заглушка пустого списка
- `LoadingSpinner` / `SkeletonCard`
- `DateTimePicker` — выбор даты и времени
- `PhoneInput` — форматированный ввод телефона

### Страница Dashboard
- `TodayStats` — счётчики: всего записей / завершено / свободных слотов
- `TodayAppointmentList` — список записей на сегодня по временной шкале
- `AppointmentCard` — карточка одной записи (клиент, мастер, время, статус)
- `QuickActions` — кнопки «Новая запись», «Найти клиента»

### Страница Calendar
- `CalendarView` — обёртка над `react-big-calendar` с переключением вид (день/неделя)
- `MasterFilter` — чипы фильтрации по мастеру (с их цветами)
- `CalendarEvent` — кастомный рендер события в календаре
- `CalendarToolbar` — навигация по датам, переключатель вида

### Форма записи
- `AppointmentForm` — главная форма: мастер → услуга → дата → свободный слот → клиент
- `MasterSelect` — выпадающий список мастеров
- `ServiceSelect` — выпадающий список услуг с ценой/длительностью
- `SlotPicker` — сетка доступных временных слотов на выбранную дату
- `ClientSearchOrCreate` — поиск клиента по телефону или создание нового

### Управление мастерами
- `MasterList` — таблица мастеров с действиями
- `MasterForm` — модальная форма создания/редактирования
- `ScheduleEditor` — редактор рабочих дней (чекбоксы + time-picker)
- `DayOffCalendar` — выходные дни мастера

### Уведомления
- `NotificationSettings` — настройка каналов (email/telegram) и времени напоминания
- `NotificationLog` — таблица отправленных уведомлений

---

## 7. Пользовательские сценарии

### Сценарий 1: Запись через администратора
1. Клиент звонит / пишет в WhatsApp.
2. Администратор/Владелец открывает `/appointments/new`.
3. Выбирает мастера → услугу → дату.
4. Система показывает доступные слоты (учитывая рабочий график и уже существующие записи).
5. Выбирает слот → находит клиента по телефону или создаёт нового.
6. Нажимает «Создать».
7. Система атомарно проверяет конфликт в транзакции, сохраняет запись.
8. Мастер получает уведомление в Telegram.
9. Клиенту уходит SMS/Telegram за 24ч и за 2ч до визита.

### Сценарий 2: Перенос записи
1. Клиент просит перенести визит.
2. Администратор открывает запись → «Перенести».
3. Выбирает новую дату и слот.
4. Система проверяет отсутствие конфликта.
5. Запись обновляется, старые напоминания аннулируются, создаются новые.

### Сценарий 3: Отмена записи
1. Владелец/мастер открывает запись → «Отменить».
2. Указывает причину (опционально).
3. Статус → `CANCELLED`. Слот освобождается.
4. Клиент получает уведомление об отмене.

### Сценарий 4: Мастер смотрит свой день
1. Мастер логинится, видит `/dashboard` — только свои записи на сегодня.
2. Открывает `/calendar` с фильтром по себе.
3. Видит записи цветными блоками.

### Сценарий 5: Автоматическое напоминание клиенту
1. Крон-джоб запускается каждые 15 мин.
2. Ищет записи в статусе `CONFIRMED` с `starts_at` через ~24ч и ~2ч.
3. Для найденных записей создаёт или обновляет уведомления.
4. Отправляет через Telegram Bot / email.
5. Отмечает уведомление как `SENT`.

---

## 8. Пошаговый Roadmap разработки

### Фаза 0: Подготовка (2–3 дня)
- [ ] Создать репозиторий с monorepo-структурой (`/apps/api`, `/apps/web`)
- [ ] Настроить TypeScript, ESLint, Prettier для обоих приложений
- [ ] Инициализировать Prisma, написать базовую схему, первую миграцию
- [ ] Настроить PostgreSQL (локально через Docker Compose)
- [ ] Создать `.env` файлы и добавить в `.gitignore`
- [ ] Настроить базовый Express-сервер с health-check эндпоинтом
- [ ] Инициализировать Vite-проект с React + TypeScript
- [ ] Настроить Tailwind CSS + shadcn/ui

### Фаза 1: Аутентификация (3–4 дня)
- [ ] Backend: модели `User`, хеширование паролей (bcrypt)
- [ ] Backend: `POST /auth/login` — выдача JWT access + refresh
- [ ] Backend: middleware `authenticateJWT` + `authorize(roles[])`
- [ ] Backend: `POST /auth/refresh`, `POST /auth/logout`
- [ ] Frontend: страница `/login` (форма, валидация)
- [ ] Frontend: хук `useAuth`, хранение токенов (httpOnly cookie или localStorage)
- [ ] Frontend: axios interceptor для автоматического обновления токена
- [ ] Frontend: `ProtectedRoute` — редирект неавторизованных
- [ ] Seed-скрипт: создать тестового Owner + 3 Masters

### Фаза 2: Справочники — Мастера и Услуги (3–4 дня)
- [ ] Backend: CRUD для `masters` с мягким удалением
- [ ] Backend: CRUD для `services`
- [ ] Backend: рабочий график `PUT /masters/:id/schedule`
- [ ] Backend: день-офф `POST /masters/:id/day-offs`
- [ ] Frontend: страница `/masters` — таблица, кнопки создать/редактировать
- [ ] Frontend: `MasterForm` — модальная форма (shadcn Dialog)
- [ ] Frontend: `ScheduleEditor` — чекбоксы дней + time-picker
- [ ] Frontend: страница `/services` — таблица услуг с ценами
- [ ] TanStack Query: хуки `useMasters`, `useServices`

### Фаза 3: Клиенты (2–3 дня)
- [ ] Backend: CRUD для `clients`, поиск по телефону/имени
- [ ] Frontend: страница `/clients` — таблица с поиском
- [ ] Frontend: `/clients/:id` — профиль клиента
- [ ] Frontend: компонент `ClientSearchOrCreate` (автодополнение + inline-создание)

### Фаза 4: Записи и защита от конфликтов (5–7 дней)
- [ ] Backend: логика вычисления доступных слотов `GET /masters/:id/slots`
  - Учитывает рабочий график, day-offs, существующие записи
- [ ] Backend: `POST /appointments` в транзакции с pessimistic lock
  - `SELECT ... FOR UPDATE` / уникальный constraint
- [ ] Backend: `PATCH /appointments/:id` — перенос
- [ ] Backend: `POST /appointments/:id/cancel`
- [ ] Backend: `POST /appointments/:id/complete`, `/no-show`
- [ ] Backend: `GET /appointments` с фильтрами (дата, мастер, статус)
- [ ] Frontend: `SlotPicker` — сетка доступных слотов
- [ ] Frontend: `AppointmentForm` — полная форма создания записи
- [ ] Frontend: страница `/appointments/:id` — детали + действия
- [ ] Frontend: интеграция с TanStack Query + оптимистичные обновления

### Фаза 5: Календарь (3–4 дня)
- [ ] Установить и настроить `react-big-calendar` с `date-fns`
- [ ] Frontend: `CalendarView` — недельный и дневной вид
- [ ] Frontend: `MasterFilter` — фильтрация по мастерам с цветами
- [ ] Frontend: `CalendarEvent` — кастомный рендер события (имя клиента, услуга, статус)
- [ ] Frontend: клик по событию → сайдпанель с деталями
- [ ] Frontend: клик по пустому слоту → открыть форму создания с предзаполненными мастером и датой

### Фаза 6: Dashboard (2 дня)
- [ ] Backend: `GET /dashboard/today`
- [ ] Frontend: `TodayStats` — метрики дня
- [ ] Frontend: `TodayAppointmentList` — хронологический список
- [ ] Frontend: `QuickActions` — кнопки быстрого доступа

### Фаза 7: Уведомления (4–5 дней)
- [ ] Выбрать канал: Telegram Bot (приоритет) + email (Nodemailer/Resend)
- [ ] Backend: сервис `NotificationService` — шаблоны сообщений
- [ ] Backend: `node-cron` — запуск каждые 15 мин
  - Находит записи через 24ч → отправляет первое напоминание
  - Находит записи через 2ч → отправляет второе напоминание
- [ ] Backend: уведомление мастеру при создании/переносе/отмене записи
- [ ] Backend: уведомление клиенту при подтверждении и отмене
- [ ] Frontend: страница настроек уведомлений (channel, timing)
- [ ] Frontend: лог уведомлений `/settings` → таб «Уведомления»
- [ ] Тестирование через `POST /notifications/test`

### Фаза 8: Полировка и деплой (3–4 дня)
- [ ] Обработка ошибок: глобальный error handler на backend, toast-уведомления на frontend
- [ ] Валидация всех форм (Zod + react-hook-form)
- [ ] Адаптивная вёрстка для планшета (мастера используют iPad)
- [ ] Базовая защита: rate limiting, helmet.js, CORS
- [ ] Настройка Railway (backend + PostgreSQL)
- [ ] Настройка Vercel (frontend)
- [ ] Переменные окружения в продакшн
- [ ] Финальное тестирование всех сценариев

---

## 9. Приоритет реализации

### Первым: Ядро (Фазы 0–4)
> Цель — иметь рабочую систему записи без двойных бронирований.

Это критический путь. Без этого продукт не существует.

**Результат**: можно создать запись вручную, перенести, отменить, система блокирует конфликты.

### Вторым: Интерфейс и удобство (Фазы 5–6)
> Цель — сделать систему удобной для ежедневного использования.

Календарь и дашборд — это то, что превращает набор эндпоинтов в продукт, которым хотят пользоваться.

**Результат**: мастера видят свой день с первого взгляда, навигация интуитивна.

### Третьим: Уведомления и деплой (Фазы 7–8)
> Цель — решить главную боль: клиенты забывают о визите.

Автоматические напоминания = меньше no-show = больше денег. Деплой переводит систему из «тестового» в «боевой» режим.

**Результат**: реальные уведомления в Telegram, система доступна по домену 24/7.

---

## 10. Риски и как их избежать

| # | Риск | Вероятность | Влияние | Митигация |
|---|------|-------------|---------|-----------|
| 1 | **Двойное бронирование** при конкурентных запросах | Средняя | Критическое | Транзакция + `SELECT FOR UPDATE` + DB unique constraint на пересечение слотов |
| 2 | **Уведомления не доходят** (Telegram заблокирован, спам-фильтр) | Средняя | Высокое | Fallback-канал (email), лог статусов, ручная повторная отправка |
| 3 | **Устаревший UI-кэш** (React Query) при параллельной работе двух мастеров | Средняя | Среднее | Инвалидация кэша после мутаций, polling каждые 30 сек для календаря |
| 4 | **Перегрузка крон-джоба** на слабом сервере | Низкая | Среднее | Легковесный крон, idempotent-логика (нет повторной отправки если уже SENT) |
| 5 | **Неверный часовой пояс** (клиент в другом городе / сервер в UTC) | Средняя | Высокое | Хранить все даты в UTC в БД, часовой пояс студии — настройка, конвертация на frontend |
| 6 | **Сопротивление владельца** новой системе | Высокая | Критическое | Запустить параллельно с бумажным журналом на 2 недели; обучение 30 мин |
| 7 | **Scope creep** — «добавь онлайн-оплату прямо сейчас» | Высокая | Высокое | Жёсткая граница MVP, backlog для v2; показывать roadmap владельцу |
| 8 | **Потеря данных при миграции** | Низкая | Критическое | Ежедневные бэкапы (Railway Auto Backup), миграции через Prisma с rollback |
| 9 | **JWT-токен не обновляется** (race condition при параллельных запросах) | Средняя | Среднее | Очередь запросов в axios interceptor при 401 — один refresh, остальные ждут |
| 10 | **Отсутствие интернета** у мастера | Низкая | Среднее | PWA с базовым offline-кэшем (только чтение) — опционально после MVP |

---

## Оценка трудозатрат (один разработчик)

| Фаза | Название | Дни |
|------|----------|-----|
| 0 | Подготовка | 2–3 |
| 1 | Аутентификация | 3–4 |
| 2 | Мастера и услуги | 3–4 |
| 3 | Клиенты | 2–3 |
| 4 | Записи + конфликты | 5–7 |
| 5 | Календарь | 3–4 |
| 6 | Dashboard | 2 |
| 7 | Уведомления | 4–5 |
| 8 | Полировка + деплой | 3–4 |
| **Итого** | | **27–36 рабочих дней** |

> [!TIP]
> Реалистичный срок для одного разработчика с частичной занятостью — **6–8 недель**. При полной занятости — **4–5 недель**.

---

## Структура репозитория

```
nail-studio/
├── apps/
│   ├── api/                    # Express backend
│   │   ├── src/
│   │   │   ├── routes/         # Express routers
│   │   │   ├── services/       # Бизнес-логика
│   │   │   ├── middleware/     # Auth, error handler
│   │   │   ├── jobs/           # Cron-задачи
│   │   │   └── utils/          # Helpers
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── migrations/
│   └── web/                    # React frontend
│       ├── src/
│       │   ├── pages/          # Страницы (по маршрутам)
│       │   ├── components/     # UI-компоненты
│       │   ├── hooks/          # React Query хуки
│       │   ├── api/            # axios-клиент + запросы
│       │   ├── store/          # Zustand (auth state)
│       │   └── types/          # Shared TypeScript типы
│       └── public/
├── packages/
│   └── shared/                 # Общие Zod-схемы и типы
├── docker-compose.yml          # PostgreSQL для локальной разработки
└── README.md
```
