# Smart Lib Backend

NestJS + MongoDB — aligned with **Use Case Diagram** and **Content ERD**.

## Collections (ERD)

| Collection | Fields |
|------------|--------|
| `authors` | name, bio, avatarUrl |
| `categories` | name, slug (unique), description |
| `books` | title, slug, description, coverUrl, language, publishStatus, authorId, categoryIds[], chaptersCount, isDeleted |
| `chapters` | bookId, chapterNumber, title, contentText, wordCount, estimatedReadMinutes, isDeleted |
| `users` | email, passwordHash, displayName |
| `favorites` | userId, bookId |
| `bookmarks` | userId, bookId, chapterId, chapterNumber, note |
| `reading_progress` | userId, bookId, chapterId, chapterNumber, scrollOffset |

## Run

```powershell
cd smart_lib_backend
npm run start:dev
```

- **API:** http://localhost:3000/api
- **Admin HTML:** http://localhost:3000/admin/

Admin: `admin@smartlib.local` / `admin123`

## Use cases → endpoints

### User (mobile)

| Use case | Endpoint |
|----------|----------|
| Sign up | `POST /api/auth/signup` |
| Sign in | `POST /api/auth/signin` |
| Browse / search books | `GET /api/books?q=` |
| View book + chapters | `GET /api/books/:slug` |
| Sync offline | `GET /api/books/sync?since=` |
| Categories | `GET /api/categories` |
| Favorites | `GET/POST/DELETE /api/me/favorites` |
| Bookmarks | `GET/POST/DELETE /api/me/bookmarks` |
| Sync reading progress | `PUT /api/me/reading-progress` |
| Continue last reading | `GET /api/me/reading-progress/last` |

### Admin (HTML panel, JWT admin)

| Use case | Endpoint |
|----------|----------|
| CRUD authors | `/api/admin/authors` |
| CRUD categories | `/api/admin/categories` |
| CRUD books | `/api/admin/books` |
| Publish / unpublish | `POST /api/admin/books/:id/publish` · `unpublish` |
| CRUD chapters | `/api/admin/books/:bookId/chapters` · `/api/admin/chapters/:id` |
| Seed catalog | `POST /api/admin/seed` |

Mobile `/api/books` returns a **compatibility shape** (id=slug, embedded chapters) for the Flutter offline cache.
