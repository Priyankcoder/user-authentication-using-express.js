'use strict'

const User = require('../models/user')
const Token = require('../models/token')
const crypto = require('crypto')
const passport = require('passport')
const nodemailer = require('nodemailer')
// const fetch = require('node-fetch')

const getUserParams = (body) => {
  return {
    name: {
      first: body.first,
      last: body.last
    },
    email: body.email,
    password: body.password
  }
}

module.exports = {
  index: (req, res, next) => {
    User.find().then((users) => {
      res.locals.users = users
      next()
    })
  },
  indexView: (req, res) => {
    res.render('users/index', {
      flashMessages: {
        success: 'Loaded all users '
      }
    })
  },
  new: (req, res) => {
    res.render('user/create')
  },
  create: (req, res, next) => {
    if (req.skip) next()
    const newUser = new User(getUserParams(req.body))
    User.register(newUser, req.body.password, (error, user) => {
      if (user) {
        req.flash(
          'Success',
          `${user.name.first}'s account created successfully!`
        )
        console.log(user)
        // Create a verification token for this user
        const token = new Token({
          _userId: user._id,
          token: crypto.randomBytes(16).toString('hex')
        })

        // Save the verification token
        token.save(function (err) {
          if (err) {
            return res.status(500).send({ msg: err.message })
          }

          // Send the email
          const transporter = nodemailer.createTransport({
            service: 'SendGrid',
            auth: {
              user: 'apikey',
              pass:
                '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'
            }
          })
          const mailOptions = {
            from: 'priyankrastogi14@gmail.com',
            to: user.email,
            subject: 'Account Verification Token',
            // text:
            //   "Hello,\n\n" +
            //   "Please verify your account by clicking the link \n",
            html: `<p>Please verify your Smartier account by clicking the link below</p><a href=http://${req.headers.host}/confirmation/${token.token}>Link</a>`
          }
          transporter.sendMail(mailOptions, function (err) {
            if (err) {
              console.log(err.stack)
              res.locals.redirect = '/'
              next()
            }
            // res.status(200).send('A verification email has been sent to Your email address.');
          })
        })
        res.locals.redirect = '/feed'
        next()
      } else {
        req.flash(
          'error',
          `Failed to create user account because: ${error.message}.`
        )
        res.locals.redirect = '/'
        next()
      }
    })
  },

  userFeed: (req, res) => {
    console.log(req.session)
    // const url = 'https://hacker-news.firebaseio.com/v0/topstories.json?print=pretty'

    // const getData = async url => {
    //   try {
    //     const response = await fetch(url)
    //     const json = await response.json()
    //     console.log(json)
    //   } catch (error) {
    //     console.log(error)
    //   }

    // }

    // getData(url)
    // fetch(').then((response) => {
    //   console.log(response.json())
    // }).catch(err => console.log(err))
    return res.render('feed')
  },
  redirectView: (req, res, next) => {
    const redirectPath = res.locals.redirect
    if (redirectPath) res.redirect(redirectPath)
  },
  resendToken: function (req, res, next) {
    req
      .sanitizeBody('email')
      .normalizeEmail({
        all_lowercase: true
      })
      .trim()
    req.check('email', 'Email is invalid').isEmail()
    // Check for validation errors
    const errors = req.userValidationErrors()
    if (errors) return res.status(400).send(errors)

    User.findOne({ email: req.body.email }, function (err, user) {
      if (err) {
        return res.status(500).send({ msg: err.message })
      }

      if (!user) {
        return res
          .status(400)
          .send({ msg: 'We were unable to find a user with that email.' })
      }
      if (user.isVerified) {
        return res.status(400).send({
          msg: 'This account has already been verified. Please log in.'
        })
      }

      // Create a verification token, save it, and send email
      const token = new Token({
        _userId: user._id,
        token: crypto.randomBytes(16).toString('hex')
      })

      // Save the token
      token.save(function (err) {
        if (err) {
          return res.status(500).send({ msg: err.message })
        }

        // Send the email
        const transporter = nodemailer.createTransport({
          service: 'SendGrid',
          auth: {
            user: process.env.sendGridUser,
            pass: process.env.sendGridPassword

          }
        })
        const mailOptions = {
          from: 'priyankrastogi14@gmail.com',
          to: user.email,
          subject: 'Account Verification Token',
          // text:
          //   "Hello,\n\n" +
          //   "Please verify your account by clicking the link \n",
          html: `<p>Please verify your Smartier account by clicking the link below</p><a href=http://${req.headers.host}/confirmation/${token.token}>Link</a>`
          // html: `<p>Please verify your Smartier account by clicking the link below</p><a href=http:\/\/${req.headers.host}\/confirmation\/${token.token}>Link</a>`
        }
        transporter.sendMail(mailOptions, function (err) {
          if (err) {
            return res.status(500).send({ msg: err.message })
          }
          return res
            .status(200)
            .send('A verification email has been sent to ' + user.email + '.')
        })
      })
    })
  },
  login: (req, res) => {
    res.render('user/login')
  },
  authenticate: passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: 'Failed to login.',
    successFlash: 'Logged in!'
  }),
  validate: (req, res, next) => {
    req
      .sanitizeBody('email')
      .normalizeEmail({
        all_lowercase: true
      })
      .trim()
    req.check('email', 'Email is invalid').isEmail()
    req.check('password', 'Password cannot be empty').notEmpty()
    req.check('first', 'this cannot be empty').notEmpty()
    req.check('last', 'this cannot be empty').notEmpty()

    req.getValidationResult().then((error) => {
      if (!error.isEmpty()) {
        const messages = error.array().map((e) => e.msg)
        req.skip = true
        req.flash('error', messages.join(' and '))
        res.locals.redirect = '/'
        next()
      } else {
        next()
      }
    })
  },
  /**
   * POST /confirmation
   */
  confirmationPost: function (req, res, next) {
    // console.log(req.params.token)
    Token.findOne({ token: req.params.token }, function (err, token) {
      if (err) {
        return res.status(500).send({ msg: err.message })
      }

      if (!token) {
        return res.status(400).send({
          type: 'not-verified',
          msg:
            'We were unable to find a valid token. Your token may have expired.'
        })
      }

      // If we found a token, find a matching user
      User.findOne({ _id: token._userId }, function (err, user) {
        if (err) {
          return res.status(500).send({ msg: err.message })
        }

        if (!user) {
          return res
            .status(400)
            .send({ msg: 'We were unable to find a user for this token.' })
        }
        if (user.isVerified) {
          return res.status(400).send({
            type: 'already-verified',
            msg: 'This user has already been verified.'
          })
        }

        // Verify and save the user
        user.isVerified = true
        user.save(function (err) {
          if (err) {
            return res.status(500).send({ msg: err.message })
          }
          res.status(200).send('The account has been verified. Please log in.')
        })
      })
    })
  },

  restrict: (req, res, next) => {
    if (req.session.loggedIn) next()
    req.flash('error', 'unauthorised user! login to proceed')
    res.redirect('/login')
  }
}
