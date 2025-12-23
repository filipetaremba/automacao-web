require('dotenv').config();

module.exports = {
    dbPath: process.env.DB_PATH || './database.sqlite',
    // Configurações adicionais do SQLite
    options: {
        verbose: console.log // Log de queries em desenvolvimento
    }
};