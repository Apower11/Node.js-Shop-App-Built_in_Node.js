const express = require("express");
const http = require("http");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const expressHbs = require("express-handlebars");
const mongoose = require("mongoose");
const session = require("express-session");
const mongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");
const morgan = require("morgan");

const errorsController = require("./controllers/errors");
const User = require("./models/user");



const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster1-5mpwi.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;

const app = express();
const store = new mongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions"
});

const csrfProtection = csrf();

const date = new Date();

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'images');
    },
    filename: (req, file, cb) => {
        cb(null, new Date().getFullYear() + "-" + new Date().getMonth() +  "-" + new Date().getDate() + "_" + "T" + new Date().getHours() + "_" + new Date().getMinutes() + "_" + new Date().getSeconds() + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if(file.mimetype === "image/png" || file.mimetype === "image/jpg" || file.mimetype === "image/jpeg"){
       cb(null, true)
    } else{
        cb(null, false)
    }
}
app.set("view engine", "ejs");
app.set("views", "views");

  
const adminData = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' }
);

app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({storage: fileStorage, fileFilter: fileFilter}).single('image'));

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "js")));

app.use("/images", express.static(path.join(__dirname, "images")))

app.use(
    session({
      secret: 'User info',
      resave: false,
      saveUninitialized: false,
      store: store 
     })
    );


    app.use(csrfProtection);
    app.use(flash());

    

    app.use((req, res, next) => {
        res.locals.isAuthenticated = req.session.isLoggedIn,
        res.locals.csrfToken = req.csrfToken();
        next()
    });


    

    app.use((req, res, next) => {
        if (!req.session.user) {
            return next();
        }
        User.findById(req.session.user._id)
        .then(user => {
            if(!user){
                next();
            }
            req.user = user;
            next();
        })
        .catch(err => {
            next(new Error(err));
        })
    });

    

/*
app.engine("hbs", expressHbs({
layoutsDir: "views/layouts/", 
defaultLayout: 'main-layout',
extname: 'hbs'}));
*/













// app.use((req, res, next) => {
//       User.findById("5e7eee851c9d440000f4d7d4")
//       .then(user => {
//           console.log(user);
//           req.user = new User(user.name, user.email, user.cart, user._id);
//           next();
//       })
//       .catch(err => console.log(err));
// });

app.use(adminData);

app.use(shopRoutes);
app.use(authRoutes);

app.get("/500", errorsController.get500);

app.use(errorsController.get404);

app.use((error, req, res, next) => {
    console.log(error);
    app.use(
        session({
          secret: 'User info',
          resave: false,
          saveUninitialized: false,
          store: store 
         })
        );  

    res.status(500).render('500', {
        pageTitle: "Error!",
        path: "/500",
        isAuthenticated: session.isLoggedIn
    });
});










mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(process.env.PORT || 3000);
})
.catch(err => {
    console.log(err);
})



