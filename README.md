# Medical Sign Recognition Frontend

This Next.js project serves as the web frontend for a CNN+LSTM sign recognition backend. The app records hand landmarks from the camera and sends a 35x42 sequence to the `/predict` endpoint.

## Requirements
- Node.js 20+
- pnpm or npm
- Backend URL configured in `.env.local` as `NEXT_PUBLIC_BACKEND_URL`

## Setup
```bash
pnpm install # or npm install
cp .env.example .env.local # edit NEXT_PUBLIC_BACKEND_URL
pnpm dev      # start development server
```

Available scripts:
- `pnpm dev` – run dev server
- `pnpm build` – build production version
- `pnpm start` – start built app
- `pnpm test` – run Jest tests
- `pnpm lint` – run ESLint

## Example `/predict` Payload
```json
{
  "sequence": [[0.0, 0.1, ...]],
  "expected_label": "dolor_de_cabeza",
  "nickname": "demo"
}
```

## Project Structure
- `app/` – Next.js App Router pages
- `components/` – shared UI components
- `hooks/` – custom React hooks for API access
- `lib/` – API service and utilities
- `pages/api/` – proxy routes to the FastAPI backend

Configure the backend URL in `.env.local` to point the app to your FastAPI deployment.
