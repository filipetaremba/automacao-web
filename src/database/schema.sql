-- Tabela de livros
CREATE TABLE IF NOT EXISTS books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    author TEXT NOT NULL,
    pages INTEGER,
    description TEXT,
    cover_path TEXT NOT NULL,
    pdf_path TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME,
    CONSTRAINT chk_status CHECK (status IN ('pending', 'sent', 'error'))
);

-- Tabela de configurações
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de logs de envio
CREATE TABLE IF NOT EXISTS send_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id INTEGER NOT NULL,
    status TEXT NOT NULL,
    error_message TEXT,
    sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
    CONSTRAINT chk_log_status CHECK (status IN ('success', 'error'))
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_books_status ON books(status);
CREATE INDEX IF NOT EXISTS idx_books_created ON books(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_book ON send_logs(book_id);
CREATE INDEX IF NOT EXISTS idx_logs_sent ON send_logs(sent_at);

-- Inserir configurações padrão se não existirem
INSERT OR IGNORE INTO settings (key, value) VALUES ('group_id', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('cron_schedule', '* * * * *');
INSERT OR IGNORE INTO settings (key, value) VALUES ('last_send_date', '');
INSERT OR IGNORE INTO settings (key, value) VALUES ('bot_active', 'false');