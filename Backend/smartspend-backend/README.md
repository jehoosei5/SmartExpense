# 💸 SmartSpend AI - Backend

> **Short Description:** An intelligent, AI-powered personal finance and expense tracking API built with FastAPI, integrating Azure OpenAI to parse natural language financial entries and generate insights.

SmartSpend AI takes the manual work out of expense tracking. Instead of manually filling out forms, users can simply type *"I spent GH₵45 on food today"*, and the AI backend will automatically extract the date, amount, category, and payment method to update their dashboard.

## ✨ Key Features
- **🧠 AI Expense Parsing:** Natural language processing to extract structured expense data from free-text using Azure OpenAI.
- **💬 Conversational Queries:** Ask questions about your spending habits (e.g., *"How much did I spend on transport last month?"*) and get AI-driven answers and charting hints.
- **📊 Financial Dashboards:** Aggregation endpoints for monthly summaries, category breakdowns, and spending trends.
- **🔐 Secure Authentication:** JWT-based auth with access and refresh tokens, plus Google OAuth integration.
- **🛡️ Rate Limiting:** Endpoint protection using `slowapi` to prevent brute-forcing and API quota drain.
- **📁 Excel/CSV Syncing:** Upload legacy spreadsheet expense data directly into your database.

## 🛠️ Tech Stack
- **Framework:** FastAPI (Python)
- **Database:** MySQL + SQLAlchemy ORM
- **AI Integration:** Azure OpenAI (GPT-4o)
- **Security:** Passlib (Bcrypt), PyJWT, SlowAPI
- **Validation:** Pydantic V2

## 🚀 Local Setup

### 1. Prerequisites
- Python 3.10+
- MySQL Server (Local or Docker)
- Anaconda/Miniconda (recommended for virtual environments)

### 2. Installation
Clone the repo and install dependencies:
```bash
# Create and activate your virtual environment
conda create -n smart_ai python=3.11
conda activate smart_ai

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the root directory and add your credentials:
```ini
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smartspend_db

# Security
SECRET_KEY=your_secure_random_string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
CORS_ORIGINS=["http://localhost:5173"]

# Azure OpenAI
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-endpoint.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT=gpt-4o-tenscit
AZURE_OPENAI_API_VERSION=2024-12-01-preview

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
```

### 4. Create the Database
```sql
CREATE DATABASE IF NOT EXISTS smartspend_db;
```

### 5. Run the Server
The application will automatically create the required database tables on startup.
```bash
uvicorn app.main:app --reload
```
The API will be available at `http://127.0.0.1:8000`. You can view the interactive Swagger API documentation by visiting `http://127.0.0.1:8000/docs`.