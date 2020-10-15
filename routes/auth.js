const express = require("express");
const path = require("path");
const { check, body } = require("express-validator");
const User = require("../models/user");

const productsController = require("../controllers/products");

const adminController = require("../controllers/admin")

const authController = require("../controllers/auth")

const router = express.Router();

router.get("/login", authController.getLogin);

router.post("/login", [
    body('email', "Please enter a valid email" )
    .isEmail()
    .normalizeEmail()
    ,
    body('Password', 'Your password must be only text and numbers and be at least 5 characters')
    .isAlphanumeric()
    .isLength({min: 5})
    .trim()
] , authController.postLogin);

router.post("/logout", authController.postLogout);

router.get("/signup", authController.getSignUp);

router.post("/signup",
[ 
check('email')
.isEmail()
.withMessage('Please enter a valid email.')
.custom((value, { req }) => {
    // if (value === "test@test.com") {
    //     throw new Error('This email address is forbidden.');
    // }
    // return true;
    return User.findOne({ email: value })
    .then(userDoc => {
        if (userDoc) {
            return Promise.reject(
                'E-mail exists already, please pick a different one'
            );
        }
    });
})
.normalizeEmail()
,
   body('password', 'Please enter a password with only numbers and text and is at least 5 characters')
   .isLength({ min: 5 })
   .isAlphanumeric()
   .trim()
   ,
   body('confirmPassword').custom((value, { req }) => {
       if(value !== req.body.password) {
           throw new Error('Passwords have to match');
       }
       return true;
   } )
   .trim()
],
 authController.postSignUp);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.getNewPassword);

router.post("/new-password", authController.postNewPassword);

module.exports = router;