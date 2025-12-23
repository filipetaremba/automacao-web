require('dotenv').config();

module.exports = {
    port: process.env.PORT || 3000,
    session: {
        secret: process.env.SESSION_SECRET || 'change-this-secret-key',
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000 // 24 horas
        }
    },
    upload: {
        maxFileSize: 70 * 1024 * 1024, // 70MB
        allowedImageTypes: ['image/jpeg', 'image/jpg', 'image/png'],
        allowedPdfTypes: ['application/pdf']
    },
    admin: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
    }
};