function isAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return next();
    }
    res.redirect('/login');
}

function isNotAuthenticated(req, res, next) {
    if (req.session && req.session.isAuthenticated) {
        return res.redirect('/');
    }
    next();
}

module.exports = {
    isAuthenticated,
    isNotAuthenticated
};