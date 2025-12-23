const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const dbConfig = require('../config/database');

let db = null;

/**
 * Inicializa o banco de dados e cria as tabelas
 */
function initDatabase() {
    return new Promise((resolve, reject) => {
        // Verifica se a pasta existe, senão cria
        const dbDir = path.dirname(dbConfig.dbPath);
        if (!fs.existsSync(dbDir) && dbDir !== '.') {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Cria conexão
        db = new sqlite3.Database(dbConfig.dbPath, (err) => {
            if (err) {
                console.error('❌ Erro ao conectar ao banco:', err.message);
                reject(err);
            } else {
                console.log('✅ Conectado ao banco de dados SQLite');
                createTables()
                    .then(() => resolve())
                    .catch(reject);
            }
        });
    });
}

/**
 * Cria as tabelas se não existirem
 */
function createTables() {
    return new Promise((resolve, reject) => {
        // Lê o arquivo schema.sql
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        // Executa o schema
        db.exec(schema, (err) => {
            if (err) {
                console.error('❌ Erro ao criar tabelas:', err.message);
                reject(err);
            } else {
                console.log('✅ Tabelas criadas/verificadas com sucesso');
                resolve();
            }
        });
    });
}

/**
 * Retorna a instância do banco
 */
function getConnection() {
    if (!db) {
        throw new Error('Banco de dados não inicializado. Chame initDatabase() primeiro.');
    }
    return db;
}

/**
 * Fecha a conexão com o banco
 */
function closeConnection() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('❌ Erro ao fechar banco:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Conexão com banco fechada');
                    db = null;
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

module.exports = {
    initDatabase,
    getConnection,
    closeConnection
};