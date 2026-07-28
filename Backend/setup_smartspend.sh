#!/bin/bash
# SmartSpend AI — Backend Folder Structure
# Run: bash setup_smartspend.sh

mkdir -p smartspend-backend/app/models
mkdir -p smartspend-backend/app/schemas
mkdir -p smartspend-backend/app/routers
mkdir -p smartspend-backend/app/services
mkdir -p smartspend-backend/app/utils

cd smartspend-backend

# Empty init files so Python treats folders as packages
touch app/__init__.py
touch app/models/__init__.py
touch app/schemas/__init__.py
touch app/routers/__init__.py
touch app/services/__init__.py
touch app/utils/__init__.py

# Empty files — we fill these in one by one
touch app/main.py
touch app/config.py
touch app/database.py

touch app/models/user.py
touch app/models/expense.py
touch app/models/category.py
touch app/models/sync_log.py
touch app/models/chat.py
touch app/models/refresh_token.py

touch app/schemas/user.py
touch app/schemas/auth.py
touch app/schemas/expense.py

touch app/routers/auth.py
touch app/routers/expenses.py
touch app/routers/sync.py
touch app/routers/ai.py
touch app/routers/charts.py

touch app/services/auth_service.py
touch app/services/expense_service.py
touch app/services/sync_service.py
touch app/services/ai_service.py

touch app/utils/security.py
touch app/utils/hashing.py

touch .env
touch .env.example
touch requirements.txt
touch README.md

echo "✅ Folder structure created — smartspend-backend/"
