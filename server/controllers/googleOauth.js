const GoogleStrategy = require('passport-google-oauth2').Strategy
const User = require('../models/user')
// const passport = require('passport')
module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user)
  })
  passport.deserializeUser((user, done) => {
    done(null, user)
  })
  passport.use(
    new GoogleStrategy(
      {
        clientID:
          '656012922237-2ohd9ncpu96ogdm69rbdl9b4k2bqgdru.apps.googleusercontent.com',
        clientSecret: 'UA6uU_-u7_QtxmWPVNhLnCE_',
        callbackURL: 'http://localhost:3000/auth/google/callback',
        passReqToCallback: true
      },
      function (request, accessToken, refreshToken, profile, done) {
        console.log(JSON.stringify(profile))
        User.find({ email: profile.emails[0].value }, function (err, user) {
          if (err) {
            console.log(err)
          }
          // console.log(user)
          if (!user.length) {
            User.create({
              name: {
                first: profile.name.givenName,
                last: profile.name.familyName
              },
              email: profile.emails[0].value,
              isVerified: true
            })
            console.log('done')
          }
          console.log(profile.emails[0].value)
          return done(err, user)
        })
      }
    )
  )
}
