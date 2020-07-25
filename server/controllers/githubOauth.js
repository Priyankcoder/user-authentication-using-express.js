const GitHubStrategy = require('passport-github2').Strategy
// const passport = require('passport')
const User = require('../models/user')
module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    done(null, user)
  })
  passport.deserializeUser((user, done) => {
    done(null, user)
  })
  passport.use(
    new GitHubStrategy(
      {
        clientID: '48a8ad86336f3b88ecde',
        clientSecret: 'be43bc2e0ce0bd1e843b0dccaceafcc3f9a97e20',
        callbackURL: 'http://localhost:3000/auth/github/callback'
      },
      function (accessToken, refreshToken, profile, done) {
        console.log(JSON.stringify(profile))
        User.find({ email: profile.emails[0].value }, function (err, user) {
          if (err) {
            console.log(err)
          }
          if (!user.length) {
            User.create({
              name: {
                first: profile.displayName,
                last: ''
              },
              email: profile.emails[0].value,
              isVerified: true
            })
          }
          console.log(profile.emails[0].value)

          return done(err, user)
        })
      }
    )
  )
}
