-- SmartSpend AI — MySQL Database Schema
CREATE DATABASE IF NOT EXISTS smartspend_db
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE smartspend_db;

-- TABLE: users
-- Stores registered user accounts
CREATE TABLE IF NOT EXISTS users (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    email           VARCHAR(255)    NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    display_name    VARCHAR(100)    NOT NULL,
    default_currency VARCHAR(3)     NOT NULL DEFAULT 'GHS',
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: categories
-- Master list of expense/income categories
-- Seeded with defaults, users can add custom ones later
CREATE TABLE IF NOT EXISTS categories (
    id              INT             NOT NULL AUTO_INCREMENT,
    user_id         CHAR(36)        NULL,       -- NULL = system default, UUID = user custom
    name            VARCHAR(100)    NOT NULL,
    type            ENUM(
                        'Expenses',
                        'Income',
                        'Savings'
                    )               NOT NULL,
    is_default      TINYINT(1)      NOT NULL DEFAULT 0,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_category_user_name_type (user_id, name, type),
    CONSTRAINT fk_categories_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- TABLE: expenses
-- Core table — every transaction from all three input sources
CREATE TABLE IF NOT EXISTS expenses (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    user_id         CHAR(36)        NOT NULL,
    date            DATE            NOT NULL,
    type            ENUM(
                        'Expenses',
                        'Income',
                        'Savings'
                    )               NOT NULL,
    category        VARCHAR(100)    NOT NULL,
    amount          DECIMAL(10, 2)  NOT NULL,
    currency        VARCHAR(3)      NOT NULL DEFAULT 'GHS',
    details         VARCHAR(255)    NULL,
    payment_method  ENUM(
                        'Cash',
                        'MoMo',
                        'Card',
                        'Bank Transfer'
                    )               NULL,
    source          ENUM(
                        'excel',
                        'form',
                        'ai_chat'
                    )               NOT NULL DEFAULT 'form',
    notes           TEXT            NULL,

    -- Deduplication hash: prevents duplicate syncs from Excel
    -- Generated as SHA256(user_id + date + type + category + amount + source)
    sync_hash       VARCHAR(64)     NULL,

    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uq_expenses_sync_hash (sync_hash),

    -- Indexes for common query patterns
    INDEX idx_expenses_user_id      (user_id),
    INDEX idx_expenses_date         (date),
    INDEX idx_expenses_user_date    (user_id, date),
    INDEX idx_expenses_user_type    (user_id, type),
    INDEX idx_expenses_user_cat     (user_id, category),
    INDEX idx_expenses_source       (source),

    CONSTRAINT fk_expenses_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- TABLE: sync_logs
-- Tracks every Excel sync attempt (success or failure)
-- Useful for debugging and showing sync history in the dashboard
-- =============================================================================
CREATE TABLE IF NOT EXISTS sync_logs (
    id              INT             NOT NULL AUTO_INCREMENT,
    user_id         CHAR(36)        NOT NULL,
    synced_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_rows      INT             NOT NULL DEFAULT 0,
    inserted_rows   INT             NOT NULL DEFAULT 0,
    skipped_rows    INT             NOT NULL DEFAULT 0,   -- duplicates skipped
    failed_rows     INT             NOT NULL DEFAULT 0,
    status          ENUM(
                        'success',
                        'partial',
                        'failed'
                    )               NOT NULL DEFAULT 'success',
    error_details   TEXT            NULL,                 -- JSON string of failed rows

    PRIMARY KEY (id),
    INDEX idx_sync_logs_user_id (user_id),

    CONSTRAINT fk_sync_logs_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- TABLE: ai_chat_sessions
-- Stores AI chat history per user session
-- Allows the AI to have context across messages in a session
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
    id              CHAR(36)        NOT NULL DEFAULT (UUID()),
    user_id         CHAR(36)        NOT NULL,
    started_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_active_at  DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_chat_sessions_user_id (user_id),

    CONSTRAINT fk_chat_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- TABLE: ai_chat_messages
-- Individual messages within a chat session
-- =============================================================================
CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id              INT             NOT NULL AUTO_INCREMENT,
    session_id      CHAR(36)        NOT NULL,
    role            ENUM(
                        'user',
                        'assistant'
                    )               NOT NULL,
    content         TEXT            NOT NULL,

    -- If this message triggered an expense being saved, link it
    expense_id      CHAR(36)        NULL,

    -- If this message triggered a chart, store the chart type and params
    chart_type      VARCHAR(50)     NULL,
    chart_params    JSON            NULL,

    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    INDEX idx_chat_messages_session (session_id),

    CONSTRAINT fk_chat_messages_session
        FOREIGN KEY (session_id) REFERENCES ai_chat_sessions(id)
        ON DELETE CASCADE ON UPDATE CASCADE,

    CONSTRAINT fk_chat_messages_expense
        FOREIGN KEY (expense_id) REFERENCES expenses(id)
        ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- TABLE: refresh_tokens
-- Stores JWT refresh tokens for persistent login sessions
-- =============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id              INT             NOT NULL AUTO_INCREMENT,
    user_id         CHAR(36)        NOT NULL,
    token_hash      VARCHAR(255)    NOT NULL,       -- hashed refresh token
    expires_at      DATETIME        NOT NULL,
    created_at      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked         TINYINT(1)      NOT NULL DEFAULT 0,

    PRIMARY KEY (id),
    UNIQUE KEY uq_refresh_token (token_hash),
    INDEX idx_refresh_tokens_user_id (user_id),

    CONSTRAINT fk_refresh_tokens_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- SEED DATA: Default categories
-- These are available to all users (user_id = NULL)
-- =============================================================================
INSERT INTO categories (user_id, name, type, is_default) VALUES
    -- Expense categories
    (NULL, 'Food',                  'Expenses', 1),
    (NULL, 'Transportation',        'Expenses', 1),
    (NULL, 'Utilities',             'Expenses', 1),
    (NULL, 'Clothing',              'Expenses', 1),
    (NULL, 'Body Care & Medicine',  'Expenses', 1),
    (NULL, 'Entertainment',         'Expenses', 1),
    (NULL, 'Media',                 'Expenses', 1),
    (NULL, 'Education',             'Expenses', 1),
    (NULL, 'Other',                 'Expenses', 1),

    -- Income categories
    (NULL, 'Employment (NSS)',      'Income',   1),
    (NULL, 'Side Hustle',           'Income',   1),
    (NULL, 'Dividend',              'Income',   1),
    (NULL, 'Freelance',             'Income',   1),
    (NULL, 'Other Income',          'Income',   1),

    -- Savings categories
    (NULL, 'Emergency Fund',        'Savings',  1),
    (NULL, 'Mini Business',         'Savings',  1),
    (NULL, 'Future Account',        'Savings',  1),
    (NULL, 'Investment',            'Savings',  1);


-- =============================================================================
-- USEFUL VIEWS
-- =============================================================================

-- View: monthly summary per user
CREATE OR REPLACE VIEW vw_monthly_summary AS
SELECT
    user_id,
    YEAR(date)          AS year,
    MONTH(date)         AS month,
    type,
    category,
    COUNT(*)            AS transaction_count,
    SUM(amount)         AS total_amount,
    currency
FROM expenses
GROUP BY user_id, YEAR(date), MONTH(date), type, category, currency;


-- View: category totals per user (all time)
CREATE OR REPLACE VIEW vw_category_totals AS
SELECT
    user_id,
    type,
    category,
    COUNT(*)            AS transaction_count,
    SUM(amount)         AS total_amount,
    MIN(date)           AS first_transaction,
    MAX(date)           AS last_transaction,
    currency
FROM expenses
GROUP BY user_id, type, category, currency;


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================