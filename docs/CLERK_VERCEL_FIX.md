# Исправление: сайт не открывается / infinite redirect (Clerk на Vercel)

## Симптомы
- «This site can't be reached» (DNS для `*.clerk.accounts.dev`) или бесконечная загрузка
- В логах Vercel: `Clerk: Refreshing the session token resulted in an infinite redirect loop`

## Главная причина в твоём случае

Твой Publishable key привязан к домену **`enhanced-mastiff-18.clerk.accounts.dev`**.  
Этот домен **не отвечает** (таймаут / NXDOMAIN). Поэтому браузер не может достучаться до Clerk → «This site can't be reached» и редиректы.

**Решение: создать новое приложение в Clerk** (оно получит новый рабочий домен) и использовать его ключи.

---

## Пошагово: новое приложение Clerk

### 1. Создать приложение в Clerk
1. [Clerk Dashboard](https://dashboard.clerk.com) → **Add application** (или **Create application**).
2. Имя, например: `Programming Helper AI` или `Programming Helper AI Prod`.
3. Создать.

### 2. Взять новые ключи
1. В **новом** приложении: **Configure** → **API keys**.
2. **Quick copy** → Next.js.
3. Скопировать:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` (начинается с `pk_test_...`)
   - `CLERK_SECRET_KEY` (начинается с `sk_test_...`)

### 3. Обновить Vercel
1. [Vercel](https://vercel.com) → проект **programming-helper-ai** → **Settings** → **Environment Variables**.
2. Для **Production** (и при необходимости Preview):
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — вставить **новый** Publishable key.
   - `CLERK_SECRET_KEY` — вставить **новый** Secret key.
3. Сохранить.

### 4. Обновить локальные .env
В `.env.local` и `.env.production` (если используешь) подставь те же **новые** значения.

### 5. Редеплой (обязательно новая сборка)
Переменные `NEXT_PUBLIC_*` подставляются **во время сборки**. Если просто нажать Redeploy, Vercel может взять старый кэш сборки со старыми ключами.

**Сделай так:**
- Либо **запушь коммит** в репозиторий (любой, например пустой) — так запустится новая сборка с текущими переменными из Vercel.
- Либо в Vercel: **Deployments** → ⋮ у последнего деплоя → **Redeploy** и, если есть опция, включи **Clear build cache** / **Redeploy without cache**.

### 6. Проверить, какие ключи видит деплой
Открой в браузере (без входа):
`https://programming-helper-ai.vercel.app/api/check-clerk-env`

В ответе будет `publishableKeyPrefix` — первые символы ключа. Сравни с началом ключа в Clerk Dashboard → API keys. Если совпадает с **новым** ключом — сборка подхватила новые переменные. Если там ещё старый префикс — нужна пересборка без кэша или пуш нового коммита.

### 7. Проверка сайта
- Открыть `https://programming-helper-ai.vercel.app` в **режиме инкогнито**.
- Должна открыться главная или страница входа без ошибки и бесконечной загрузки.

**Важно:** пользователи из старого приложения Clerk в новое не переносятся — регистрация заново (для теста обычно нормально).

---

## Дополнительно: опечатка в Secret key

Если когда-нибудь будешь вручную вводить ключ: в Secret key легко перепутать **цифру 1** и **букву l**.  
Всегда копируй ключ из Clerk (Ctrl+C) и вставляй в Vercel, не перепечатывай.
