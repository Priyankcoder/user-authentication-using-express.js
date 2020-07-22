"use strict";

const express = require("express"),
  app = express(),
  router = express.Router(),
  layouts = require("express-ejs-layouts"),
  mongoose = require("mongoose"),
  // methodOverride = require("method-override"),
  expressSession = require("express-session"),
  cookieParser = require("cookie-parser"),
  connectFlash = require("connect-flash"),
  expressValidator = require("express-validator"),
  passport = require("passport"),
  errorController = require("./controllers/errorController"),
  homeController = require("./controllers/homeController"),
  // subscribersController = require("./controllers/subscribersController"),
  usersController = require("./controllers/usersController"),
  // coursesController = require("./controllers/coursesController"),
  User = require("./models/user");

mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/recipe_db", {
  useNewUrlParser: true, useUnifiedTopology: true
});
mongoose.set("useCreateIndex", true);

const db = mongoose.connection;

db.once("open", () => {
  console.log("Successfully connected to MongoDB using Mongoose!");
});

app.set("port", process.env.PORT || 3000);
app.set("view engine", "ejs");

router.use(express.static("public"));
router.use(layouts);
router.use(
  express.urlencoded({
    extended: false,
  })
);

// router.use(
//   methodOverride("_method", {
//     methods: ["POST", "GET"],
//   })
// );

router.use(express.json());
router.use(cookieParser("secret_passcode"));
router.use(
  expressSession({
    secret: "secret_passcode",
    cookie: {
      maxAge: 4000000,
    },
    resave: false,
    saveUninitialized: false,
  })
);

router.use(passport.initialize());
router.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
router.use(connectFlash());

router.use((req, res, next) => {
  res.locals.flashMessages = req.flash();
  next();
});
router.use(expressValidator());
// router.use(homeController.logRequestPaths);

router.get("/", homeController.sendHome);
router.get("/register", usersController.new); 
router.post("/user/create", usersController.validate, usersController.create, usersController.redirectView); 
router.get("/login", usersController.login); 
router.post("/login", usersController.authenticate, usersController.redirectView); // app.get("/:name", homeController.sendProfile); app.get("/user", usersController.index, usersController.indexView) //Middlewares
router.get("/user/:user", usersController.userFeed);
router.use(errorController.logErrors);
router.use(errorController.respondNoResourceFound);
router.use(errorController.respondInternalError);

app.use("/", router);

app.listen(app.get("port"), () => {
  console.log(`Server running at http://localhost:${app.get("port")}`);
});
