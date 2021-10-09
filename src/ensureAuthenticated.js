function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.session.error = "Login to view this page";
    res.redirect("/login");
}

module.exports = ensureAuthenticated;
