# MoneyTracker

Personal finance tracker built with React + Vite, with MongoDB-backed persistence through an Express API.

## Tech stack

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Express
- MongoDB (Mongoose)

## Local setup

1. Install dependencies:

```sh
npm i
```

2. Create `.env` from `.env.example` and set your Mongo URI:

```sh
MONGODB_URI=mongodb://127.0.0.1:27017/moneytracker
PORT=4000
```

3. Start frontend + backend:

```sh
npm run dev:full
```

Frontend runs on `http://localhost:8080` and API runs on `http://localhost:4000`.

## Scripts

- `npm run dev` — start frontend only
- `npm run server` — start backend only
- `npm run dev:full` — start frontend + backend
- `npm run build` — production build
- `npm run test` — run tests
