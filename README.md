# Borisjaou — каталог фильмов

Next.js (App Router) + TypeScript strict. Эталон дизайна — `../borisjaou-design-source`.

## Команды

Нужен Node.js 22.12+. Перед первым запуском: скопировать `.env.example` в `.env.local`
и заполнить `AUTH_SECRET` (`npx auth secret`), при необходимости `AUTH_GOOGLE_*` и `ADMIN_EMAILS`.

```bash
npm install        # установить зависимости
npm run dev        # http://localhost:3000
npm run typecheck  # проверка типов
npm run lint       # ESLint
npm test           # Vitest: модульные тесты
npm run test:e2e   # Playwright: сценарии в браузере (см. «Тесты»)
npm run build      # продакшен-сборка
```

## Структура

- `src/app/globals.css` — дизайн-токены (THEMES light/dark → CSS-переменные) и базовые стили.
- `src/styles/_breakpoints.scss` — брейкпоинты 600 / 768 / 1024 / 1280, миксины `from`, `below`, `between`.
  В модулях: `@use "breakpoints" as bp;` → `@include bp.from(lg) { … }`.
- `src/components/ThemeProvider` — тема через next-themes (атрибут `data-theme`, по умолчанию light).
- `src/components/ThemeToggle` — кнопка темы (варианты `outline`, `glass`).
- `src/components/icons.tsx` — иконки из эталона.
- `src/app/page.tsx` — каталог (Catalog / DeskCatalog), `src/app/filters` — фильтры (мобила),
  `src/app/genres` — жанры. Состояние каталога — в URL (`src/lib/films/params.ts`).
- `src/app/film/[slug]` — страница фильма (Movie / DeskMovie), `opengraph-image.tsx` — OG-картинка,
  `not-found.tsx` — 404. Шрифты для OG — `assets/fonts` (OFL).
- `src/components/film` — FilmView, ShareDialog (шторка на мобиле, окно на ПК).
- `.env.example` — `NEXT_PUBLIC_SITE_URL` для ссылок «Поделиться», canonical и OG.
- `src/app/login` — вход (Main / DeskAuth), серверные действия в `actions.ts`. Регистрация закрыта: форма открывается только по прямой ссылке `/login?mode=register` и создаёт аккаунт лишь для почты из `ADMIN_EMAILS`; через Google новый аккаунт тоже только для неё.
- `src/lib/watchlists` — «Надо посмотреть» / «Просмотрено» (как избранное: гость — localStorage, вошедший — таблица `WatchItem`; фильм только в одном из списков). Мобила: `/watchlist`, `/watched`; ПК: каталог `?list=watchlist|watched`.
- `src/lib/films/import` — автозаполнение формы фильма по ссылке Кинопоиска / TMDB / IMDb.
- `src/auth.ts`, `src/auth.config.ts` — Auth.js v5: email + пароль (bcryptjs), Google; роли `user` | `admin`.
- `src/proxy.ts` — бывший middleware (Next 16): закрывает `/admin/*`.
- `src/lib/users` — пользователи в базе (`UserRepository` на Prisma).
- `prisma/` — схема, миграции и сид; `src/lib/db` — клиент Prisma; `src/lib/films/repository.ts` — запросы к фильмам.
- `src/components/ui` — Logo, Chip, Segmented, SearchField, Toast.
- `src/components/layout` — BottomNav (мобила), DesktopHeader (ПК).
- `src/components/films` — FilmCard, FreshCard, GenreTile.
- `src/app/favorites` — избранное (мобила, Favorites); на ПК — редирект на `/?fav=1`.
- `src/lib/favorites/` — избранное: у гостя — localStorage, у пользователя — база (серверные действия
  в `src/app/actions/favorites.ts`); при входе гостевой список переносится в аккаунт. Компоненты работают только через `useFavorites()`.
- `src/lib/films/` — данные без базы: тип `Film`, справочники, тестовые фильмы,
  `getFilms(filters)`, `getFilmBySlug`, `getNewFilms`, `slugify`.

## База данных (Prisma)

Две базы, одна схема:

| | Разработка | Продакшен |
|---|---|---|
| База | SQLite, файл `data/dev.db` | PostgreSQL |
| `DATABASE_URL` | `file:./data/dev.db` | `postgresql://…` |
| Схема | `prisma/sqlite/schema.prisma` (генерируется) | `prisma/schema.prisma` (основная) |
| Миграции | `prisma/sqlite/migrations` | `prisma/migrations` |

`prisma.config.ts` сам выбирает схему и папку миграций по `DATABASE_URL`.
Редактируется только `prisma/schema.prisma`; копию для SQLite делает `npm run db:sync`
(тест `scripts/prisma-sync-sqlite.test.ts` падает, если копия устарела).

### Первый запуск (SQLite)

```bash
cp .env.example .env.local      # заполнить AUTH_SECRET
npm install                     # заодно соберёт клиент Prisma
npx prisma migrate deploy       # создаст data/dev.db по готовой миграции
npm run db:seed                 # фильмы из эталона (+ пользователи из data/users.json, если он есть)
npm run dev
```

### Изменение схемы

```bash
# 1. правим prisma/schema.prisma
# 2. миграция для SQLite (разработка):
npm run db:migrate -- --name описание_изменения
# 3. миграция для PostgreSQL — против dev-базы Postgres:
DATABASE_URL=postgresql://… npx prisma migrate dev --name описание_изменения
# 4. вернуть клиент под SQLite:
npm run db:generate
```

Обе папки миграций коммитятся в git.

### Продакшен (PostgreSQL)

```bash
DATABASE_URL=postgresql://… npm run build      # клиент Prisma соберётся под PostgreSQL
DATABASE_URL=postgresql://… npm run db:deploy  # применить миграции
DATABASE_URL=postgresql://… npm run db:seed    # один раз: фильмы из эталона
```

Полезное: `npm run db:studio` — просмотр данных, `npm run db:reset` — пересоздать базу и залить сид.

## Админка

- `/admin/films` — список, `/admin/films/new` — новый фильм, `/admin/films/{id}/edit` — правка. Только роль `admin` (почта из `ADMIN_EMAILS`): проверка в `proxy.ts`, в layout админки и в каждом серверном действии.
- Проверка формы — одна zod-схема (`src/lib/films/filmForm.ts`) на клиенте и на сервере.
- Постеры: JPG/PNG до 4 МБ (лимит запроса на Vercel — 4,5 МБ), формат проверяется по содержимому файла. При замене старый файл удаляется.
- Хранилище постеров — `STORAGE_DRIVER`: `local` (`public/uploads`, в `.gitignore`) или `supabase` (Supabase Storage). Другое (S3, Cloudinary): реализовать `FileStorage` из `src/lib/storage/types.ts` и выбрать в `src/lib/storage/index.ts`.

## Аккаунт

- ПК: в шапке у вошедшего — имя и «Выйти» вместо «Войти».
- Мобила: вкладка «Профиль» у гостя ведёт на вход, у вошедшего — на `/profile` (имя, почта, «Админка» для admin, «Выйти»). На ≥1024px `/profile` уводит в каталог.
- В эталоне этих экранов нет — собраны из существующих элементов.

## Тесты

- `npm test` — Vitest.
- `npm run test:e2e` — Playwright, проекты `mobile` (390×844) и `desktop` (1440×900). Первый раз: `npx playwright install chromium`.
  Сервер поднимается сам: чистая база `data/e2e.db` → `npm run build` → `next start -p 3210`, администратор `admin@e2e.test`.
  Уже запущенный сервер на 3210 переиспользуется (кроме `CI=1`).
- Сценарии (`e2e/`): поиск, фильтры (мобила и панель ПК), редирект `/filters` на ПК, избранное (гость, перенос в аккаунт), «Поделиться» (копирование, соцсети, Escape, фокус), вход и закрытая регистрация, «Надо посмотреть» / «Просмотрено», шапка вошедшего и выход, доступ к админке, добавление фильма с постером, черновики, robots/sitemap/метаданные.

## SEO

- `/sitemap.xml` — главная, жанры и опубликованные фильмы (из базы, при каждом запросе).
- `/robots.txt` — закрыты `/admin`, `/api/`, `/login`, `/profile`, `/favorites`, `/filters`.
- Метаданные: title-шаблон, description, Open Graph, canonical; у поиска/фильтров на главной, входа, избранного и профиля — `noindex`. На странице фильма — OG-картинка и JSON-LD `Movie`.

## Деплой: Vercel + Supabase (или Neon)

Рекомендую Supabase: там и PostgreSQL, и хранилище постеров. С Neon база будет в Neon, а постеры всё равно нужно где-то хранить — Supabase Storage (бесплатный проект) или своя реализация `FileStorage`.

1. **База.**
   - Supabase: Project → Connect → строки подключения. `DATABASE_URL` — Transaction pooler (порт 6543), `DIRECT_URL` — Direct connection или Session pooler (порт 5432).
   - Neon: Dashboard → Connection string. `DATABASE_URL` — с `-pooler` в адресе, `DIRECT_URL` — без него.
2. **Постеры (Supabase Storage).** Storage → New bucket `posters`, включить **Public bucket**. Ключ: Project Settings → API → `service_role`.
3. **Первичное наполнение** (один раз, со своего компьютера):
   Клиент Prisma собирается под базу из `DATABASE_URL`, поэтому сначала `prisma generate` под PostgreSQL, в конце — обратно под SQLite.

   PowerShell (Windows):
   ```powershell
   $env:DATABASE_URL="<DIRECT_URL>"
   npx prisma generate
   npx prisma migrate deploy
   npm run db:seed
   Remove-Item Env:DATABASE_URL
   npx prisma generate
   ```
   bash (macOS / Linux):
   ```bash
   export DATABASE_URL="<DIRECT_URL>"
   npx prisma generate && npx prisma migrate deploy && npm run db:seed
   unset DATABASE_URL && npx prisma generate
   ```
4. **Vercel.** Import Git Repository → фреймворк Next.js определится сам; команда сборки берётся из `vercel.json` (`npm run vercel-build`: `prisma generate` → `prisma migrate deploy` → `next build`), так что новые миграции применяются при каждом деплое. Node.js — 22.x.
5. **Переменные окружения** (Settings → Environment Variables, Production и Preview):

   | Переменная | Значение |
   |---|---|
   | `DATABASE_URL` | пулер (Supabase 6543 / Neon `-pooler`) |
   | `DIRECT_URL` | прямое подключение (5432) — для миграций при сборке |
   | `AUTH_SECRET` | `npx auth secret` |
   | `ADMIN_EMAILS` | почты администраторов через запятую |
   | `NEXT_PUBLIC_SITE_URL` | свой домен, например `https://borisjaou.app`; без него — `*.vercel.app` |
   | `STORAGE_DRIVER` | `supabase` |
   | `SUPABASE_URL` | `https://<project>.supabase.co` |
   | `SUPABASE_SERVICE_ROLE_KEY` | ключ `service_role` (секрет) |
   | `SUPABASE_STORAGE_BUCKET` | `posters` |
   | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | по желанию; redirect URI: `https://<домен>/api/auth/callback/google` |
   | `KINOPOISK_API_KEY` | автозаполнение по ссылке Кинопоиска: ключ с kinopoiskapiunofficial.tech |
   | `TMDB_API_KEY` | автозаполнение по ссылке TMDB / IMDb: ключ API или токен доступа на чтение с themoviedb.org |
   | `CRON_SECRET` | по желанию: случайная строка; тогда `/api/keepalive` отвечает только Vercel Cron |

6. После первого деплоя: зарегистрироваться на `/login?mode=register` с почтой из `ADMIN_EMAILS` — роль admin выдастся сама. Другим почтам регистрация закрыта.

Ежедневный запрос к базе (`vercel.json` → `crons`, `/api/keepalive`, 03:00 UTC) не даёт бесплатному проекту Supabase уйти на паузу после недели без активности.

Почему не `local` на Vercel: файловая система функций только для чтения и не сохраняется между запусками.
