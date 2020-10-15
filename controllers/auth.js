const crypto = require("crypto");
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const { validationResult } = require("express-validator");

const transporter = nodemailer.createTransport(sendGridTransport({
    auth: {
        api_key: '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'
    }
}));

exports.getLogin = (req, res, next) => {
    // const isLoggedIn = req.get('Cookie').split("=")[1].trim();
    let message = req.flash('error');
    if(message.length > 0){
        message = req.flash('error')[0];
    }
    else {
        message = null;
    }



    res.render("auth/login", {
        pageTitle: "Shop - Login",
        path: "/login",
        isAuthenticated: req.session.isLoggedIn,
        errorMessage: message,
        oldInput: {
            email: '',
            password: ''
        },
        validationErrors: []
    })
};

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);
    if(!errors.isEmpty()){
        res.status(422).render('auth/login', {
            pageTitle: 'Login',
            path: "/login",
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password
            },
            validationErrors: errors.array()
        })
    }
    User.findOne({email: email})
    .then(user => {
        if(!user){
            req.flash('error', 'Invalid email or password.');
            return res.redirect("/login");
        }
        bcrypt
        .compare(password, user.password)
        .then(doMatch => {
            if(doMatch) {
                req.session.isLoggedIn = true;
                req.session.user = user;
                return req.session.save(err => {
                    console.log(err);
                    res.redirect("/");
                })
            }
            req.flash('error', 'Invalid email or password.');
            res.redirect("/login");
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy(err => {
        console.log(err);
        res.redirect("/")
    })
}

exports.getSignUp = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = req.flash('error')[0];
    }
    else {
        message = null;
    }
    res.render("auth/signup", 
    {pageTitle: "Shop - Sign Up",
    path: "/signup",
    errorMessage: message,
    oldInput: {
        email: '',
        password: '',
        confirmPassword: ''
    },
    validationErrors: []
 })
}

exports.postSignUp = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        return res.status(422).render('auth/signup', {
            path: '/signup',
            pageTitle: 'Signup',
            errorMessage: errors.array()[0].msg,
            oldInput: {
                email: email,
                password: password,
                confirmPassword: confirmPassword,
            },
            validationErrors: errors.array()
        })
    }
     bcrypt.hash(password, 12)
        .then(hashedPassword => {
            const user = new User ({
                email: email,
                password: hashedPassword,
                cart: { items: []}
            });
            return user.save();
        })
        .then(result => {
            res.redirect("/login");
            return transporter.sendMail({
                to: email,
                from: 'russianshrek69@gmail.com',
                subject: 'Sign Up Succeeded',
                html: "<h1>You signed up successfully.</h1>"
            })
        })
    }


exports.getReset = (req, res, next) => {
    let message = req.flash('error');
    if(message.length > 0){
        message = message[0];
    }
    else {
        message = null;
        console.log(message);
    }
    res.render("auth/reset", {
        pageTitle: "Shop - Reser",
        path: "/reset",
        errorMessage: message
    })
};

exports.postReset = (req, res, next) => {
   crypto.randomBytes(32, (err, buffer) => {
       if(err){
           console.log(err);
           return res.redirect("/reset")
       }
       const token = buffer.toString('hex');
       User.findOne({ email: req.body.email })
       .then(user => {
           if (!user) {
               req.flash('error', 'No account with that email found');
               return res.redirect("/reset")
           }
           user.resetToken = token;
           user.resetTokenExpiration = Date.now() + 3600000;
           return user.save()
       })
       .then(result => {
           res.redirect("/");
        return transporter.sendMail({
            to: req.body.email,
            from: 'adampower45@hotmail.com',
            subject: 'Password Reset',
            html: `
            <p>You requested a password reset.</p>
            <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to set a new password.</p>
            `
        })
       })
       .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
   })
}

exports.getNewPassword = (req, res, next) => {
    const token = req.params.token;
    User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
    .then(user => {
        let message = req.flash('error');
        if(message.length > 0){
            message = message[0];
        }
        else {
            message = null;
            console.log(message);
        }
        res.render("auth/new-password", {
            pageTitle: "New Password",
            path: "/new-password",
            errorMessage: message,
            userId: user._id.toString(),
            passwordToken: token
        })
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });

    
}

exports.postNewPassword = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const passwordToken = req.body.passwordToken;
    let resetUser;

    User.findOne({
        resetToken: passwordToken,
        resetTokenExpiration: { $gt: Date.now() },
        _id: userId
    })
    .then(user => {
          resetUser = user;
          return bcrypt.hash(newPassword, 12);
    })
    .then(hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = null;
        resetUser.resetTokenExpiration = undefined;
        return resetUser.save();
    })
    .then(result => {
        res.redirect("/login");
    })
    .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
    });
};