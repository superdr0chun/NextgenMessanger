# Database Schema - Nextgen Messenger

## Таблицы и связи

### 1. Users (Пользователи)
**Primary Key:** `ID` (UUID или BIGSERIAL)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL |
| `password_hash` | VARCHAR(255) | NOT NULL |
| `full_name` | VARCHAR(100) | |
| `status` | VARCHAR(20) | active, banned |
| `email_verified` | BOOLEAN | DEFAULT false |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_users_email` (email)
- `idx_users_username` (username)
- `idx_users_status` (status)
- `idx_users_deleted` (deleted, deleted_at)

---

### 2. Profiles (Профили)
**Primary Key:** `user_id` (FK → Users.id)
**Связь:** 1:1 с Users

| Поле | Тип | Описание |
|------|-----|----------|
| `user_id` | UUID/BIGSERIAL | PK, FK → Users.id |
| `avatar_url` | VARCHAR(500) | URL к аватару в S3 |
| `bio` | TEXT | Описание профиля |
| `phone` | VARCHAR(20) | |
| `location` | VARCHAR(100) | |
| `date_of_birth` | DATE | |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_profiles_user_id` (user_id) - уже PK

---

### 3. Posts (Посты)
**Primary Key:** `id` (UUID или BIGSERIAL)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `author_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `content` | TEXT | Текст поста |
| `media_url` | VARCHAR(500)[] | Массив URL к медиафайлам |
| `visibility` | VARCHAR(20) | public, followers, private |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_posts_author_id` (author_id)
- `idx_posts_created_at` (created_at DESC) - для сортировки ленты
- `idx_posts_visibility` (visibility)
- `idx_posts_deleted` (deleted, deleted_at)
- `idx_posts_feed` (author_id, deleted, created_at DESC) - составной для ленты
- `idx_posts_user_feed` (author_id, visibility, deleted, created_at DESC) - для постов пользователя

**Связи:**
- Many-to-One: Posts.author_id → Users.id

---

### 4. Follows (Подписки)
**Primary Key:** `id` (UUID или BIGSERIAL)
**Unique Constraint:** (follower_id, followee_id) - нельзя подписаться дважды

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `follower_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `followee_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `status` | VARCHAR(20) | pending, accepted, blocked |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_follows_follower_id` (follower_id)
- `idx_follows_followee_id` (followee_id)
- `idx_follows_unique` UNIQUE (follower_id, followee_id)
- `idx_follows_status` (status)
- `idx_follows_feed` (follower_id, status, created_at DESC) - для ленты постов

**Связи:**
- Many-to-Many: Users ↔ Users через Follows
- Foreign Keys:
  - Follows.follower_id → Users.id
  - Follows.followee_id → Users.id

**Ограничения:**
- CHECK: follower_id ≠ followee_id (нельзя подписаться на себя)

---

### 5. Comments (Комментарии)
**Primary Key:** `id` (UUID или BIGSERIAL)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `post_id` | UUID/BIGSERIAL | FK → Posts.id, NOT NULL |
| `author_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `content` | TEXT | NOT NULL |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_comments_post_id` (post_id)
- `idx_comments_author_id` (author_id)
- `idx_comments_created_at` (created_at)
- `idx_comments_deleted` (deleted, deleted_at)

**Связи:**
- Many-to-One: Comments.post_id → Posts.id
- Many-to-One: Comments.author_id → Users.id

---

### 6. Reactions (Реакции)
**Primary Key:** `id` (UUID или BIGSERIAL)
**Unique Constraint:** (post_id, user_id) - один пользователь = одна реакция на пост

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `post_id` | UUID/BIGSERIAL | FK → Posts.id, NOT NULL |
| `user_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `type` | VARCHAR(20) | like, dislike, love, etc. |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_reactions_post_id` (post_id)
- `idx_reactions_user_id` (user_id)
- `idx_reactions_unique` UNIQUE (post_id, user_id)
- `idx_reactions_type` (type)

**Связи:**
- Many-to-One: Reactions.post_id → Posts.id
- Many-to-One: Reactions.user_id → Users.id

---

### 7. Chats (Чаты)
**Primary Key:** `id` (UUID или BIGSERIAL)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `type` | VARCHAR(20) | direct, group |
| `title` | VARCHAR(100) | Для групповых чатов |
| `created_by` | UUID/BIGSERIAL | FK → Users.id |
| `last_message_at` | TIMESTAMP | Время последнего сообщения (для сортировки) |
| `last_message_id` | UUID/BIGSERIAL | FK → ChatMessages.id (опционально, для быстрого доступа) |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Примечание:** Получатели сообщений определяются через таблицу `ChatParticipants`. 
Для получения списка получателей сообщения: `SELECT user_id FROM chat_participants WHERE chat_id = ? AND left_at IS NULL AND deleted = false`

**Индексы:**
- `idx_chats_type` (type)
- `idx_chats_created_by` (created_by)
- `idx_chats_last_message_at` (last_message_at DESC) - для сортировки чатов
- `idx_chats_updated_at` (updated_at DESC) - для сортировки чатов
- `idx_chats_deleted` (deleted, deleted_at)

**Связи:**
- Many-to-One: Chats.created_by → Users.id
- One-to-One (опционально): Chats.last_message_id → ChatMessages.id

**Ограничения:**
- Для direct чатов: должно быть ровно 2 участника (проверка на уровне приложения или триггер)
- Для предотвращения дубликатов direct чатов: уникальный constraint через ChatParticipants (см. раздел ChatParticipants)

---

### 8. ChatParticipants (Участники чатов)
**Primary Key:** `id` (UUID или BIGSERIAL)
**Unique Constraint:** (chat_id, user_id) - пользователь не может быть дважды в одном чате

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `chat_id` | UUID/BIGSERIAL | FK → Chats.id, NOT NULL |
| `user_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `role` | VARCHAR(20) | owner, admin, member |
| `joined_at` | TIMESTAMP | DEFAULT NOW() |
| `left_at` | TIMESTAMP | NULL (если покинул чат) |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_chat_participants_chat_id` (chat_id)
- `idx_chat_participants_user_id` (user_id)
- `idx_chat_participants_unique` UNIQUE (chat_id, user_id)
- `idx_chat_participants_active` (chat_id, left_at, deleted) - для активных участников
- `idx_chat_participants_direct` (user_id, chat_id, deleted) - для поиска direct чатов
- `idx_chat_participants_deleted` (deleted, deleted_at)

**Связи:**
- Many-to-Many: Users ↔ Chats через ChatParticipants
- Foreign Keys:
  - ChatParticipants.chat_id → Chats.id
  - ChatParticipants.user_id → Users.id

**Ограничения для Direct чатов:**
- На уровне приложения: при создании direct чата проверять существование чата между теми же пользователями
- SQL триггер (опционально): проверять, что для type='direct' в ChatParticipants ровно 2 записи с left_at IS NULL
- Для предотвращения дубликатов: использовать функцию поиска существующего direct чата перед созданием

---

### 9. ChatMessages (Сообщения в чатах)
**Primary Key:** `id` (UUID или BIGSERIAL)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `chat_id` | UUID/BIGSERIAL | FK → Chats.id, NOT NULL |
| `sender_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `content` | TEXT | Текст сообщения |
| `media_url` | VARCHAR(500)[] | Массив URL к медиафайлам |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Примечание:** Получатели сообщения определяются через `ChatParticipants`:
- Для direct чата: получатель = другой участник чата (не sender_id)
- Для group чата: получатели = все участники чата (кроме sender_id)
- Запрос: `SELECT user_id FROM chat_participants WHERE chat_id = ? AND user_id != ? AND left_at IS NULL AND deleted = false`

**Индексы:**
- `idx_chat_messages_chat_id` (chat_id)
- `idx_chat_messages_sender_id` (sender_id)
- `idx_chat_messages_created_at` (chat_id, created_at DESC) - для пагинации
- `idx_chat_messages_deleted` (deleted, deleted_at)

**Связи:**
- Many-to-One: ChatMessages.chat_id → Chats.id
- Many-to-One: ChatMessages.sender_id → Users.id

---

### 10. Notifications (Уведомления)
**Primary Key:** `id` (UUID или BIGSERIAL)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `user_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `type` | VARCHAR(50) | new_follower, new_like, new_comment, new_message, etc. |
| `data` | JSONB | Дополнительные данные (post_id, comment_id, chat_id, sender_id, etc.) |
| `is_read` | BOOLEAN | DEFAULT false |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Механизм работы уведомлений:**

1. **Создание уведомлений:**
   - `new_follower`: при создании записи в `Follows` → уведомление для `followee_id`
   - `new_like`: при создании `Reaction` → уведомление для автора поста (`Posts.author_id`)
   - `new_comment`: при создании `Comment` → уведомление для автора поста (`Posts.author_id`)
   - `new_message`: при создании `ChatMessage` → уведомления для всех участников чата (кроме отправителя)

2. **Структура data (JSONB):**
   ```json
   {
     "post_id": "uuid",
     "comment_id": "uuid",
     "chat_id": "uuid",
     "sender_id": "uuid",
     "follower_id": "uuid"
   }
   ```

3. **Логика создания:**
   - При создании сообщения: для каждого участника чата (кроме sender_id) создается уведомление
   - При лайке: уведомление только автору поста (не себе)
   - При комментарии: уведомление только автору поста (не себе, если комментирует свой пост)
   - При подписке: уведомление тому, на кого подписались

4. **Запросы:**
   - Получить непрочитанные: `WHERE user_id = ? AND is_read = false AND deleted = false`
   - Отметить прочитанным: `UPDATE SET is_read = true, updated_at = NOW()`

**Индексы:**
- `idx_notifications_user_id` (user_id)
- `idx_notifications_is_read` (user_id, is_read)
- `idx_notifications_created_at` (user_id, created_at DESC)
- `idx_notifications_type` (type)
- `idx_notifications_unread` (user_id, is_read, deleted, created_at DESC) - для непрочитанных
- `idx_notifications_deleted` (deleted, deleted_at)

**Связи:**
- Many-to-One: Notifications.user_id → Users.id

---

### 11. RefreshTokens (Refresh токены)
**Primary Key:** `id` (UUID или BIGSERIAL)

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID/BIGSERIAL | PK |
| `user_id` | UUID/BIGSERIAL | FK → Users.id, NOT NULL |
| `token` | VARCHAR(500) | UNIQUE, NOT NULL |
| `expires_at` | TIMESTAMP | NOT NULL |
| `revoked_at` | TIMESTAMP | NULL (если токен отозван) |
| `deleted` | BOOLEAN | Soft delete, DEFAULT false |
| `deleted_at` | TIMESTAMP | NULL (время удаления) |
| `created_at` | TIMESTAMP | DEFAULT NOW() |
| `updated_at` | TIMESTAMP | DEFAULT NOW() |

**Индексы:**
- `idx_refresh_tokens_user_id` (user_id)
- `idx_refresh_tokens_token` UNIQUE (token)
- `idx_refresh_tokens_expires_at` (expires_at) - для очистки истекших
- `idx_refresh_tokens_active` (user_id, revoked_at, deleted, expires_at) - для активных токенов
- `idx_refresh_tokens_deleted` (deleted, deleted_at)

**Связи:**
- Many-to-One: RefreshTokens.user_id → Users.id

**Ограничения:**
- CHECK: expires_at > created_at
- При использовании refresh token: обновлять или удалять старый (rotation)

---

## Важные пояснения

### Как работают получатели сообщений в чатах

**Вопрос:** В `ChatMessages` нет поля `recipient_id`, как определить получателей?

**Ответ:** Получатели определяются через таблицу `ChatParticipants`:

1. **Direct чат (1-на-1):**
   - В чате ровно 2 участника
   - Получатель = другой участник (не `sender_id`)
   - Запрос: 
     ```sql
     SELECT user_id FROM chat_participants 
     WHERE chat_id = ? AND user_id != ? AND left_at IS NULL AND deleted = false
     ```

2. **Group чат:**
   - В чате может быть много участников
   - Получатели = все участники чата (кроме `sender_id`)
   - Запрос: тот же самый

3. **Почему так сделано:**
   - Гибкость: один и тот же механизм для direct и group чатов
   - Масштабируемость: легко добавить/удалить участников
   - Нормализация: нет дублирования данных

### Как работают уведомления

**Механизм создания:**

1. **При отправке сообщения:**
   ```sql
   -- 1. Создать сообщение
   INSERT INTO chat_messages (chat_id, sender_id, content) VALUES (?, ?, ?);
   
   -- 2. Найти всех получателей (участников чата, кроме отправителя)
   SELECT user_id FROM chat_participants 
   WHERE chat_id = ? AND user_id != ? AND left_at IS NULL AND deleted = false;
   
   -- 3. Создать уведомления для каждого получателя
   INSERT INTO notifications (user_id, type, data) 
   VALUES (?, 'new_message', '{"chat_id": "...", "sender_id": "...", "message_id": "..."}');
   ```

2. **При лайке поста:**
   ```sql
   -- 1. Создать реакцию
   INSERT INTO reactions (post_id, user_id, type) VALUES (?, ?, 'like');
   
   -- 2. Получить автора поста
   SELECT author_id FROM posts WHERE id = ?;
   
   -- 3. Создать уведомление (если автор != пользователь, который лайкнул)
   IF author_id != user_id THEN
     INSERT INTO notifications (user_id, type, data) 
     VALUES (author_id, 'new_like', '{"post_id": "...", "user_id": "..."}');
   END IF;
   ```

3. **При комментарии:**
   ```sql
   -- 1. Создать комментарий
   INSERT INTO comments (post_id, author_id, content) VALUES (?, ?, ?);
   
   -- 2. Получить автора поста
   SELECT author_id FROM posts WHERE id = ?;
   
   -- 3. Создать уведомление (если автор != комментатор)
   IF author_id != comment_author_id THEN
     INSERT INTO notifications (user_id, type, data) 
     VALUES (author_id, 'new_comment', '{"post_id": "...", "comment_id": "...", "user_id": "..."}');
   END IF;
   ```

4. **При подписке:**
   ```sql
   -- 1. Создать подписку
   INSERT INTO follows (follower_id, followee_id, status) VALUES (?, ?, 'accepted');
   
   -- 2. Создать уведомление для того, на кого подписались
   INSERT INTO notifications (user_id, type, data) 
   VALUES (followee_id, 'new_follower', '{"follower_id": "..."}');
   ```

### Поля deleted, deleted_at, updated_at

**Все сущности теперь имеют:**
- `deleted` (BOOLEAN) - флаг удаления
- `deleted_at` (TIMESTAMP) - время удаления (NULL если не удалено)
- `updated_at` (TIMESTAMP) - время последнего обновления

**Логика работы:**
- При удалении: `deleted = true`, `deleted_at = NOW()`, `updated_at = NOW()`
- При восстановлении: `deleted = false`, `deleted_at = NULL`, `updated_at = NOW()`
- При обновлении: `updated_at = NOW()` (автоматически через триггер или в коде)

**Запросы с учетом deleted:**
- Всегда фильтровать: `WHERE deleted = false` или `WHERE deleted_at IS NULL`
- Для истории: можно показывать удаленные записи с `deleted = true`

### Индексы для производительности

Все составные индексы учитывают поля `deleted` для оптимизации запросов:
- `idx_posts_feed` включает `deleted` для быстрой фильтрации
- `idx_notifications_unread` включает `deleted` для непрочитанных
- `idx_chat_participants_active` включает `deleted` для активных участников





