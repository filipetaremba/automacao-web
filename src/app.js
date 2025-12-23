const express = require('express');
const session = require('express-session');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const config = require('./config/express');
const routes = require('./routes');

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use(session(config.session));

// Disponibilizar variáveis para todas as views
app.use((req, res, next) => {
    res.locals.success = req.query.success || null;
    res.locals.error = req.query.error || null;
    res.locals.isAuthenticated = req.session && req.session.isAuthenticated || false;
    next();
});

// Rotas
app.use('/', routes);

module.exports = app;