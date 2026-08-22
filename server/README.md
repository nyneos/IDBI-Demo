# Dashboard API (port 8081)

Minimal Express API for reading `user_name` from Supabase `app_settings`.

## Structure

```
server/
├── cmd/server/main.ts      # entry
├── config/                 # env + config
├── controllers/            # health, user
├── database/               # postgres pool + migrations
├── middleware/             # cors, logger, require-db
├── models/                 # user types
├── repositories/           # user queries
├── routes/                 # /api/health, /api/user-name
├── services/               # user service
└── utils/                  # logger, response helpers
```

## Run

```bash
# from project root
npm run dev

# or API only
cd server && npm run dev
```

## Env

Copy `.env.example` → `.env`. Use the Session pooler for project `sgryutycrupiuhovmbfo`.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Server + DB status |
| GET | `/api/user-name` | Current `user_name` from `app_settings` |
| GET | `/api/user-name/stream` | SSE — polls DB every 5s, pushes on change |
