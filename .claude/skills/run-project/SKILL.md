---
description: Launch the Phoenix Capstone-4 app — Flask backend + Vite frontend
---

## How to run this project

### Start both servers together (recommended)
From the `frontend/` folder:
```
npm start
```
This runs Flask and Vite together using `concurrently`.

### Start separately

**Flask backend** (from `Capstone-4/Backend/`):
```
source venv/Scripts/activate
python app.py
```
Runs on http://localhost:5000

**Vite frontend** (from `Capstone-4/frontend/`):
```
npm run dev
```
Runs on http://localhost:5173

## Key facts

- **Stale Flask processes**: Multiple `python.exe` processes can pile up on port 5000. Kill them in Git Bash before restarting:
  ```
  pids=$(netstat -ano | grep ":5000" | grep "LISTENING" | awk '{print $5}' | sort -u)
  for pid in $pids; do taskkill //F //PID $pid; done
  ```
- **Environment**: `.env` lives at `Backend/.env` and is auto-loaded via `load_dotenv()` in `database.py`
- **DB password key**: must be `DB_PASSWORD` (not `DB_PASS`)
- **AI bot**: runs entirely in Flask — queries the DB directly, no n8n required
- **Vite proxy**: `/api` and `/products` requests are proxied to `http://localhost:5000` via `vite.config.js`

## Project structure

```
Capstone-4/
├── Backend/
│   ├── app.py          # Flask app + API routes + AI bot logic
│   ├── database.py     # DB connection + load_dotenv()
│   ├── routes/
│   │   └── product.py  # CRUD routes for /products/
│   └── .env            # DB credentials + N8N_WEBHOOK_URL
└── frontend/
    ├── src/
    │   ├── Pages/Home.jsx  # All React UI
    │   ├── App.jsx
    │   ├── main.jsx
    │   ├── index.css       # Tailwind theme tokens
    │   └── App.css         # Global dark base styles
    └── vite.config.js      # Dev server + proxy config
```
