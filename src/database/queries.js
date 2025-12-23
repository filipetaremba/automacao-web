const { getConnection } = require('./connection');

// ============================================
// OPERAÇÕES COM LIVROS
// ============================================

/**
 * Adiciona um novo livro ao banco
 */
function addBook(bookData) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const { title, author, pages, description, coverPath, pdfPath } = bookData;

        const sql = `
            INSERT INTO books (title, author, pages, description, cover_path, pdf_path)
            VALUES (?, ?, ?, ?, ?, ?)
        `;

        db.run(sql, [title, author, pages, description, coverPath, pdfPath], function(err) {
            if (err) {
                console.error('❌ Erro ao adicionar livro:', err.message);
                reject(err);
            } else {
                console.log(`✅ Livro adicionado com ID: ${this.lastID}`);
                resolve({ id: this.lastID, ...bookData });
            }
        });
    });
}

/**
 * Busca todos os livros
 */
function getAllBooks(orderBy = 'created_at DESC') {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `SELECT * FROM books ORDER BY ${orderBy}`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao buscar livros:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Busca livros por status
 */
function getBooksByStatus(status) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `SELECT * FROM books WHERE status = ? ORDER BY created_at ASC`;

        db.all(sql, [status], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao buscar livros por status:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Busca livros pendentes (não enviados)
 */
function getPendingBooks() {
    return getBooksByStatus('pending');
}

/**
 * Busca um livro por ID
 */
function getBookById(id) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `SELECT * FROM books WHERE id = ?`;

        db.get(sql, [id], (err, row) => {
            if (err) {
                console.error('❌ Erro ao buscar livro:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

/**
 * Busca o próximo livro para enviar (primeiro pendente)
 */
function getNextBookToSend() {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            SELECT * FROM books 
            WHERE status = 'pending' 
            ORDER BY created_at ASC 
            LIMIT 1
        `;

        db.get(sql, [], (err, row) => {
            if (err) {
                console.error('❌ Erro ao buscar próximo livro:', err.message);
                reject(err);
            } else {
                resolve(row || null);
            }
        });
    });
}

/**
 * Atualiza o status de um livro
 */
function updateBookStatus(id, status, sentAt = null) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            UPDATE books 
            SET status = ?, sent_at = ?
            WHERE id = ?
        `;

        const sentDate = sentAt || new Date().toISOString();

        db.run(sql, [status, sentDate, id], function(err) {
            if (err) {
                console.error('❌ Erro ao atualizar status:', err.message);
                reject(err);
            } else {
                console.log(`✅ Status do livro ${id} atualizado para: ${status}`);
                resolve({ changes: this.changes });
            }
        });
    });
}

/**
 * Atualiza dados de um livro
 */
function updateBook(id, bookData) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const { title, author, pages, description, coverPath, pdfPath } = bookData;

        // Monta SQL dinamicamente baseado nos campos fornecidos
        let fields = [];
        let values = [];

        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (author !== undefined) { fields.push('author = ?'); values.push(author); }
        if (pages !== undefined) { fields.push('pages = ?'); values.push(pages); }
        if (description !== undefined) { fields.push('description = ?'); values.push(description); }
        if (coverPath !== undefined) { fields.push('cover_path = ?'); values.push(coverPath); }
        if (pdfPath !== undefined) { fields.push('pdf_path = ?'); values.push(pdfPath); }

        if (fields.length === 0) {
            return reject(new Error('Nenhum campo para atualizar'));
        }

        values.push(id);
        const sql = `UPDATE books SET ${fields.join(', ')} WHERE id = ?`;

        db.run(sql, values, function(err) {
            if (err) {
                console.error('❌ Erro ao atualizar livro:', err.message);
                reject(err);
            } else {
                console.log(`✅ Livro ${id} atualizado`);
                resolve({ changes: this.changes });
            }
        });
    });
}

/**
 * Deleta um livro
 */
function deleteBook(id) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `DELETE FROM books WHERE id = ?`;

        db.run(sql, [id], function(err) {
            if (err) {
                console.error('❌ Erro ao deletar livro:', err.message);
                reject(err);
            } else {
                console.log(`✅ Livro ${id} deletado`);
                resolve({ changes: this.changes });
            }
        });
    });
}

/**
 * Conta livros por status
 */
function countBooksByStatus() {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            SELECT 
                status,
                COUNT(*) as count
            FROM books
            GROUP BY status
        `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao contar livros:', err.message);
                reject(err);
            } else {
                const counts = {
                    pending: 0,
                    sent: 0,
                    error: 0
                };
                rows.forEach(row => {
                    counts[row.status] = row.count;
                });
                resolve(counts);
            }
        });
    });
}

// ============================================
// OPERAÇÕES COM CONFIGURAÇÕES
// ============================================

/**
 * Busca uma configuração por chave
 */
function getSetting(key) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `SELECT value FROM settings WHERE key = ?`;

        db.get(sql, [key], (err, row) => {
            if (err) {
                console.error('❌ Erro ao buscar configuração:', err.message);
                reject(err);
            } else {
                resolve(row ? row.value : null);
            }
        });
    });
}

/**
 * Salva ou atualiza uma configuração
 */
function setSetting(key, value) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            INSERT INTO settings (key, value, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(key) DO UPDATE SET 
                value = excluded.value,
                updated_at = CURRENT_TIMESTAMP
        `;

        db.run(sql, [key, value], function(err) {
            if (err) {
                console.error('❌ Erro ao salvar configuração:', err.message);
                reject(err);
            } else {
                console.log(`✅ Configuração ${key} salva`);
                resolve({ key, value });
            }
        });
    });
}

/**
 * Busca todas as configurações
 */
function getAllSettings() {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `SELECT * FROM settings`;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao buscar configurações:', err.message);
                reject(err);
            } else {
                // Converte array de rows em objeto
                const settings = {};
                rows.forEach(row => {
                    settings[row.key] = row.value;
                });
                resolve(settings);
            }
        });
    });
}

// ============================================
// OPERAÇÕES COM LOGS
// ============================================

/**
 * Adiciona um log de envio
 */
function addLog(bookId, status, errorMessage = null) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            INSERT INTO send_logs (book_id, status, error_message)
            VALUES (?, ?, ?)
        `;

        db.run(sql, [bookId, status, errorMessage], function(err) {
            if (err) {
                console.error('❌ Erro ao adicionar log:', err.message);
                reject(err);
            } else {
                resolve({ id: this.lastID });
            }
        });
    });
}

/**
 * Busca logs recentes
 */
function getRecentLogs(limit = 50) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            SELECT 
                l.*,
                b.title as book_title,
                b.author as book_author
            FROM send_logs l
            LEFT JOIN books b ON l.book_id = b.id
            ORDER BY l.sent_at DESC
            LIMIT ?
        `;

        db.all(sql, [limit], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao buscar logs:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Busca logs de um livro específico
 */
function getLogsByBook(bookId) {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            SELECT * FROM send_logs 
            WHERE book_id = ? 
            ORDER BY sent_at DESC
        `;

        db.all(sql, [bookId], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao buscar logs do livro:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

/**
 * Conta logs por status
 */
function countLogsByStatus() {
    return new Promise((resolve, reject) => {
        const db = getConnection();
        const sql = `
            SELECT 
                status,
                COUNT(*) as count
            FROM send_logs
            GROUP BY status
        `;

        db.all(sql, [], (err, rows) => {
            if (err) {
                console.error('❌ Erro ao contar logs:', err.message);
                reject(err);
            } else {
                const counts = {
                    success: 0,
                    error: 0
                };
                rows.forEach(row => {
                    counts[row.status] = row.count;
                });
                resolve(counts);
            }
        });
    });
}

// ============================================
// EXPORTAR TODAS AS FUNÇÕES
// ============================================

module.exports = {
    // Livros
    addBook,
    getAllBooks,
    getBooksByStatus,
    getPendingBooks,
    getBookById,
    getNextBookToSend,
    updateBookStatus,
    updateBook,
    deleteBook,
    countBooksByStatus,
    
    // Configurações
    getSetting,
    setSetting,
    getAllSettings,
    setSetting,
    
    // Logs
    addLog,
    getRecentLogs,
    getLogsByBook,
    countLogsByStatus
};