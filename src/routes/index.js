const express = require('express');
const router = express.Router();
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const authController = require('../controllers/authController');
const dashboardController = require('../controllers/dashboardController');
const bookController = require('../controllers/bookController');
const settingsController = require('../controllers/settingsController');
const upload = require('../middleware/upload');

// Rotas públicas
router.get('/login', isNotAuthenticated, authController.showLogin);
router.post('/login', isNotAuthenticated, authController.login);
router.get('/logout', authController.logout);

// Rotas protegidas
router.get('/', isAuthenticated, dashboardController.showDashboard);

// Livros
router.get('/books', isAuthenticated, bookController.listBooks);
router.get('/books/new', isAuthenticated, bookController.showNewForm);
router.post('/books', isAuthenticated, upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), bookController.createBook);
router.get('/books/edit/:id', isAuthenticated, bookController.showEditForm);
router.post('/books/edit/:id', isAuthenticated, upload.fields([
    { name: 'cover', maxCount: 1 },
    { name: 'pdf', maxCount: 1 }
]), bookController.updateBook);
router.post('/books/delete/:id', isAuthenticated, bookController.deleteBook);

// Configurações
router.get('/settings', isAuthenticated, settingsController.showSettings);
router.post('/settings', isAuthenticated, settingsController.updateSettings);
router.post('/settings/toggle-scheduler', isAuthenticated, settingsController.toggleScheduler);
router.post('/settings/send-now', isAuthenticated, settingsController.sendNow);

module.exports = router;