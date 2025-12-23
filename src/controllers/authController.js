const config = require('../config/express');

const authController = {
    showLogin: (req, res) => {
        res.render('login', { error: null });
    },

    login: (req, res) => {
        const { username, password } = req.body;
        
        if (username === config.admin.username && password === config.admin.password) {
            req.session.isAuthenticated = true;
            req.session.username = username;
            return res.redirect('/');
        }
        
        res.render('login', { error: 'Usuário ou senha incorretos' });
    },

    logout: (req, res) => {
        req.session.destroy();
        res.redirect('/login');
    }
};

module.exports = authController;