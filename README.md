# Capstone 4 — Product Management System

A full-stack product catalog with a Flask REST API, React UI, PostgreSQL database, and an n8n AI bot integration.

**Live URL:** http://capstone-christina.pathway4.click

---

## Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL (AWS RDS) |
| Backend  | Python / Flask |
| Frontend | React + Vite |
| Automation | n8n workflow |

---

## Project Structure

```
Capstone-4/
├── backend/                    ← Flask API (backend)
│   ├── app.py                  # Entry point — serves API + React build
│   ├── database.py             # DB connection & table init
│   ├── routes/
│   │   └── product.py          # CRUD Blueprint (/products)
│   ├── static/                 # React build assets (after npm run build)
│   ├── templates/
│   │   └── index.html          # React index (after npm run build)
│   └── requirements.txt
├── frontend/                   ← React application (frontend)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── Pages/Home.jsx
│   ├── public/
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── n8n_workflow.json           ← Import into n8n
└── README.md
```

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/products/` | List all products |
| GET | `/products/count` | Return total product count |
| POST | `/products/` | Create a product |
| PUT | `/products/<id>` | Update a product |
| DELETE | `/products/<id>` | Delete a product |

**Request / Response shape (POST & PUT):**
```json
{ "name": "Wireless Headphones", "price": 49.99, "quantity": 25 }
```

---

## Local Development

### 1. Backend

```bash
cd Capstone-4/Backend
pip install -r requirements.txt
python app.py
# Flask running at http://localhost:5000
```

### 2. Frontend

```bash
cd Capstone-4/frontend
npm install
npm run dev
# Vite dev server at http://localhost:5173
# /products requests are proxied to http://localhost:5000
```

---

## Production Build

### Step 1 — Build React

```bash
cd Capstone-4/frontend
npm run build
```

### Step 2 — Copy build into Flask

```bash
# From Capstone-4/frontend after build completes:
cp -r dist/assets ../backend/static/
cp dist/index.html ../backend/templates/index.html
```

### Step 3 — Run Flask with Gunicorn

```bash
cd Capstone-4/Backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

Flask now serves both the API and the React UI from a single process on port 5000.

---

## n8n Bot Setup

1. Import `n8n_workflow.json` into your n8n instance.
2. In the **Get All Products** HTTP Request node, replace `localhost` with your server IP or domain.
3. Activate the workflow.
4. Webhook endpoint: `https://<your-n8n-host>/webhook/product-bot`

**Sample interaction:**

```
POST /webhook/product-bot
{ "message": "How many products do we have in the catalog?" }

→ { "reply": "We currently have 5 products registered in the catalog." }
```

**Supported queries:**
- "How many products do we have?"
- "List all products"
- "Show the most expensive products"
- "Which products are low on stock?"
- "Find [product name]"

---

## Environment Variables


