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
  path = require("path"),
  expressValidator = require("express-validator"),
  passport = require("passport"),
  errorController = require("./controllers/errorController"),
  homeController = require("./controllers/homeController"),
  // subscribersController = require("./controllers/subscribersController"),
  usersController = require("./controllers/usersController"),
  // coursesController = require("./controllers/coursesController"),
  User = require("./models/user"),
  Token = require("./models/token"),
  auth = require("./controllers/googleOauth"),
  GoogleStrategy = require("passport-google-oauth2").Strategy;
  // auth = require("./controllers/googleOauth")
mongoose.Promise = global.Promise;

mongoose.connect("mongodb://localhost:27017/recipe_db", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.set("useCreateIndex", true);

const db = mongoose.connection;

db.once("open", () => {
  console.log("Successfully connected to MongoDB using Mongoose!");
});

app.set("port", process.env.PORT || 3000);
app.set("view engine", "ejs");

router.use(express.static(path.join(__dirname, "public")));
router.use(layouts);
router.use(expressValidator());
router.use(
  express.urlencoded({
    extended: false,
  })
);
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
auth(passport);
router.use(connectFlash());
router.use(passport.initialize());
router.use(passport.session());
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

router.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.flashMessages = req.flash();
  next();
});
// router.use(homeController.logRequestPaths);

router.get("/", homeController.sendHome);
router.get("/register", usersController.new); 
router.post("/user/create", usersController.validate, usersController.create, usersController.redirectView); 
router.get("/login", usersController.login); 
router.post("/login", usersController.authenticate); // app.get("/:name", homeController.sendProfile); app.get("/user", usersController.index, usersController.indexView) //Middlewares
router.get("/feed", usersController.userFeed);
// router.get("/user/verification", (req, res)=>{
//   res
//     .status(200)
//     .send("A verification email has been sent to " + user.email + ".");
// })

router.get("/confirmation/:token", usersController.confirmationPost);
// app.post("/resend", usersController.resendTokenPost);
router.post("/resendToken", usersController.resendToken);
router.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ],
  })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/feed",
    failureRedirect: "/",
  })
);



router.use(errorController.logErrors);
router.use(errorController.respondNoResourceFound);
router.use(errorController.respondInternalError);

app.use("/", router);

app.listen(app.get("port"), () => {
  console.log(`Server running at http://localhost:${app.get("port")}`);
});
