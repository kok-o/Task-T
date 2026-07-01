# 💅 Nail Studio — Система управления записями

MVP веб-приложение для студии маникюра на 3 мастера. Заменяет WhatsApp и бумажный журнал.

## Стек
- **Backend:** Node.js + Express + TypeScript + Prisma ORM
- **Frontend:** React 18 + TypeScript + Vite + Tailwind CSS
- **База данных:** PostgreSQL
- **Auth:** JWT (access + refresh tokens)
- **Уведомления:** Telegram Bot API + Nodemailer

## Быстрый старт

### 1. Требования
- Node.js ≥ 18
- Docker Desktop (для PostgreSQL)

### 2. Клонирование и установка

```bash
# Установить все зависимости
npm install

# Установить зависимости воркспейсов
npm install --workspace=apps/api
npm install --workspace=apps/web
```

### 3. Настройка переменных окружения

```bash
# Скопировать шаблон
cp apps/api/.env.example apps/api/.env
# При необходимости отредактируйте apps/api/.env
```

### 4. Запуск базы данных

```bash
docker-compose up -d
```

### 5. Миграция и seed

```bash
# Из папки apps/api:
npx prisma migrate dev --name init
npx prisma db seed
```

### 6. Запуск приложения

```bash
# Оба сервера сразу (из корня):
npm run dev

# Или по отдельности:
npm run dev:api   # Backend на http://localhost:3001
npm run dev:web   # Frontend на http://localhost:5173
```

## Аккаунты после seed

| Роль     | Email                      | Пароль     |
|----------|----------------------------|------------|
| Владелец | owner@nailstudio.com       | owner123   |
| Мастер   | anna@nailstudio.com        | master123  |
| Мастер   | maria@nailstudio.com       | master123  |
| Мастер   | kate@nailstudio.com        | master123  |

## Структура проекта

```
nail-studio/
├── apps/
│   ├── api/              # Express Backend
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── services/ # Бизнес-логика
│   │   │   ├── middleware/
│   │   │   └── jobs/     # Cron задачи
│   │   └── prisma/
│   │       ├── schema.prisma
│   │       └── seed.ts
│   └── web/              # React Frontend
│       └── src/
│           ├── pages/
│           ├── components/
│           ├── hooks/
│           └── api/
├── docker-compose.yml
└── package.json
```

## API Эндпоинты

| Метод  | Путь                           | Описание                        |
|--------|--------------------------------|---------------------------------|
| POST   | /api/v1/auth/login             | Авторизация                     |
| GET    | /api/v1/masters                | Список мастеров                 |
| GET    | /api/v1/masters/:id/slots      | Свободные слоты                 |
| GET    | /api/v1/appointments           | Список записей                  |
| POST   | /api/v1/appointments           | Создать запись (защита от дублей)|
| POST   | /api/v1/appointments/:id/cancel| Отменить                        |
| GET    | /api/v1/dashboard/today        | Сводка за сегодня               |

## Уведомления

Крон-задача запускается каждые 15 минут:
- **За 24ч** до визита → напоминание клиенту
- **За 2ч** до визита → второе напоминание
- **При создании** → уведомление мастеру

Каналы: **Telegram** (приоритет) → **Email** (резерв)

## Деплой

- **Frontend:** [Vercel](https://vercel.com) — `vercel --cwd apps/web`
- **Backend + DB:** [Railway](https://railway.app) — автодеплой из Git
