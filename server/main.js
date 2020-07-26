'use strict'

const express = require('express')
const app = express()
const router = express.Router()
const layouts = require('express-ejs-layouts')
const mongoose = require('mongoose')
// methodOverride = require("method-override"),
const expressSession = require('express-session')
const cookieParser = require('cookie-parser')
const connectFlash = require('connect-flash')
const path = require('path')
const expressValidator = require('express-validator')
const passport = require('passport')
const errorController = require('./controllers/errorController')
const homeController = require('./controllers/homeController')
// subscribersController = require("./controllers/subscribersController"),
const usersController = require('./controllers/usersController')
// coursesController = require("./controllers/coursesController"),
const User = require('./models/user')
// const Token = require('./models/token')
const googleOauth = require('./controllers/googleOauth')
const githubOauth = require('./controllers/githubOauth')
const cors = require('cors')
require('dotenv').config()
// const GoogleStrategy = require('passport-google-oauth2').Strategy
// auth = require("./controllers/googleOauth")
mongoose.Promise = global.Promise

mongoose.connect('mongodb://localhost:27017/recipe_db', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
mongoose.set('useCreateIndex', true)

const db = mongoose.connection

db.once('open', () => {
  console.log('Successfully connected to MongoDB using Mongoose!')
})

app.set('port', process.env.PORT || 3000)
app.set('view engine', 'ejs')

router.use(cors({
  origin: 'http://localhost:3002'
}))
// router.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*')
//   next()
// })
router.use(express.static(path.join(__dirname, 'public')))
router.use(layouts)
router.use(expressValidator())
router.use(
  express.urlencoded({
    extended: false
  })
)
router.use(express.json())
router.use(cookieParser('secret_passcode'))
router.use(
  expressSession({
    secret: 'secret_passcode',
    // name: 'priyank',
    cookie: {
      maxAge: 4000000,
      sameSite: false,
      httpOnly: false
    },
    resave: false,
    saveUninitialized: false
  })
)
googleOauth(passport)
githubOauth(passport)

router.use(connectFlash())
router.use(passport.initialize())
router.use(passport.session())
passport.use(User.createStrategy())
passport.serializeUser(User.serializeUser())
passport.deserializeUser(User.deserializeUser())

router.use((req, res, next) => {
  res.locals.currentUser = req.user
  res.locals.flashMessages = req.flash()
  next()
})
// router.use(homeController.logRequestPaths);

router.get('/', homeController.sendHome)
router.get('/register', usersController.new)
router.post(
  '/user/create',
  usersController.validate,
  usersController.create,
  usersController.redirectView
)
router.get('/login', usersController.login)
router.post('/login', usersController.authenticate, (req, res) => {
  req.session.loggedIn = true
  res.redirect('/feed')
}) // app.get("/:name", homeController.sendProfile); app.get("/user", usersController.index, usersController.indexView) //Middlewares
router.get('/feed', usersController.restrict, usersController.userFeed)
// router.get("/user/verification", (req, res)=>{
//   res
//     .status(200)
//     .send("A verification email has been sent to " + user.email + ".");
// })

router.get('/confirmation/:token', usersController.confirmationPost)
// app.post("/resend", usersController.resendTokenPost);
router.post('/resendToken', usersController.resendToken)
router.get(
  '/auth/google',
  passport.authenticate('google', {
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ]
  })
)

router.get(
  '/auth/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/'
  }),
  (req, res) => {
    req.session.loggedIn = true
    res.redirect('/feed')
    // res.status(200).send(req.session)
  }
)

router.get(
  '/auth/github',
  passport.authenticate('github', { scope: ['user:email'] })
)

router.get(
  '/auth/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect home.
    req.session.loggedIn = true
    res.redirect('/feed')
    // res.status(200).send(req.session)
  }
)

router.use(errorController.logErrors)
router.use(errorController.respondNoResourceFound)
router.use(errorController.respondInternalError)
app.use('/', router)

app.listen(app.get('port'), () => {
  console.log(`Server running at http://localhost:${app.get('port')}`)
})
