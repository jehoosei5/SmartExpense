USE smartspend_db;

SELECT * FROM users;
SELECT * FROM refresh_tokens;
SELECT * FROM expenses;
DELETE FROM expenses;
DELETE FROM sync_logs;

SELECT date, type, category, amount, details, source, sync_hash
FROM expenses 
WHERE category = 'Side Hustle';

UPDATE expenses 
SET details = NULL 
WHERE details = 'nan';


UPDATE expenses SET payment_method = NULL WHERE payment_method = 'nan';
UPDATE expenses SET notes = NULL WHERE notes = 'nan';

SELECT u.email, u.display_name, COUNT(e.id) as expense_count
FROM users u
LEFT JOIN expenses e ON e.user_id = u.id
GROUP BY u.id;

DELETE FROM expenses;
DELETE FROM sync_logs;
DELETE FROM refresh_tokens;
DELETE FROM users;
DELETE FROM ai_chat_messages;
DELETE FROM ai_chat_sessions;

SELECT * FROM expenses;

INSERT INTO categories (user_id, name, type, is_default) VALUES
(NULL, 'Food', 'Expenses', 1),
(NULL, 'Transportation', 'Expenses', 1),
(NULL, 'Utilities', 'Expenses', 1),
(NULL, 'Clothing', 'Expenses', 1),
(NULL, 'Body Care & Medicine', 'Expenses', 1),
(NULL, 'Entertainment', 'Expenses', 1),
(NULL, 'Media', 'Expenses', 1),
(NULL, 'Education', 'Expenses', 1),
(NULL, 'Employment (NSS)', 'Income', 1),
(NULL, 'Side Hustle', 'Income', 1),
(NULL, 'Dividend', 'Income', 1),
(NULL, 'Freelance', 'Income', 1),
(NULL, 'Emergency Fund', 'Savings', 1),
(NULL, 'Mini Business', 'Savings', 1),
(NULL, 'Future Account', 'Savings', 1),
(NULL, 'Investment', 'Savings', 1);

DELETE FROM categories;
INSERT INTO categories (user_id, name, type, is_default) VALUES
(NULL, 'Food', 'Expenses', 1),
(NULL, 'Transportation', 'Expenses', 1),
(NULL, 'Utilities', 'Expenses', 1),
(NULL, 'Clothing', 'Expenses', 1),
(NULL, 'Body Care & Medicine', 'Expenses', 1),
(NULL, 'Entertainment', 'Expenses', 1),
(NULL, 'Media', 'Expenses', 1),
(NULL, 'Education', 'Expenses', 1),
(NULL, 'Other', 'Expenses', 1),
(NULL, 'Employment (NSS)', 'Income', 1),
(NULL, 'Side Hustle', 'Income', 1),
(NULL, 'Dividend', 'Income', 1),
(NULL, 'Freelance', 'Income', 1),
(NULL, 'Other Income', 'Income', 1),
(NULL, 'Emergency Fund', 'Savings', 1),
(NULL, 'Mini Business', 'Savings', 1),
(NULL, 'Future Account', 'Savings', 1),
(NULL, 'Investment', 'Savings', 1);

select * from categories;
select * from users;
select * from expenses;