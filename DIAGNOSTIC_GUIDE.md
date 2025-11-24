# Диагностика и исправление проблем

## Шаг 1: Запустите диагностику

Откройте в браузере (после деплоя):
```
https://programming-helper-ai-mf3p.vercel.app/api/diagnose
```

Или через curl:
```bash
curl https://programming-helper-ai-mf3p.vercel.app/api/diagnose
```

Этот endpoint проверит:
- ✅ Подключение к базе данных
- ✅ Наличие всех необходимых колонок
- ✅ Настройку переменных окружения (ADMIN_EMAILS)
- ✅ Вашу аутентификацию
- ✅ Наличие вашего пользователя в базе данных
- ✅ Правильность роли admin

## Шаг 2: Синхронизируйте схему базы данных

Если диагностика показала отсутствующие колонки, выполните:

**POST запрос:**
```bash
curl -X POST https://programming-helper-ai-mf3p.vercel.app/api/sync-database
```

Или откройте в браузере (может не сработать для POST, используйте curl или Postman):
```
https://programming-helper-ai-mf3p.vercel.app/api/sync-database
```

Это добавит все недостающие колонки в таблицу `users`.

## Шаг 3: Установите админ роль

После синхронизации схемы, установите админ роль:

**GET запрос:**
```bash
curl https://programming-helper-ai-mf3p.vercel.app/api/fix-admin-role
```

Или откройте в браузере:
```
https://programming-helper-ai-mf3p.vercel.app/api/fix-admin-role
```

**Важно:** Вы должны быть залогинены в Clerk для этого endpoint!

## Шаг 4: Проверьте переменные окружения

Убедитесь, что в Vercel установлена переменная `ADMIN_EMAILS`:

1. Vercel Dashboard → Ваш проект → Settings → Environment Variables
2. Найдите `ADMIN_EMAILS`
3. Значение должно быть: `bogdyn13@gmail.com` (или ваш email)
4. Убедитесь, что она установлена для **Production**
5. Если изменили - перезапустите deployment

## Шаг 5: Проверьте работу

1. Обновите страницу `/stats` - ошибка должна исчезнуть
2. Перейдите на `/admin` - должна появиться админ панель
3. Проверьте `/chat` - должен работать чат

## Что было исправлено

1. ✅ `getCurrentUser()` теперь использует `select` для выбора только необходимых колонок
2. ✅ Создан `/api/diagnose` для диагностики всех проблем
3. ✅ `/api/sync-database` добавляет все недостающие колонки
4. ✅ `/api/fix-admin-role` создает пользователя и устанавливает роль

## Если ничего не помогло

Отправьте мне результат `/api/diagnose` - он покажет все проблемы.

