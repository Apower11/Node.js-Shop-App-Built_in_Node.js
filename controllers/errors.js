exports.get404 = (req, res, next) => {
    res.status(404).render("404", {
        pageTitle: "Error 404: Page not Found",
        isAuthenticated: req.session.isLoggedIn,
        path: "/404"
        })
};

exports.get500 = (req, res, next) => {
    res.status(500).render('500', {
        pageTitle: "Error!",
        path: "/500",
        isAuthenticated: req.session.isLoggedIn
    })
};

exports.get500Error = (error, req, res, next) => {
    // res.status(error.httpStatusCode).render(...);
    // res.redirect('/500');
    res.status(500).render('500', {
      pageTitle: 'Error!',
      path: '/500',
      isAuthenticated: req.session.isLoggedIn,
    });
  };