"use strict";

const User = require("../models/user");
const getUserParams = body => {
    return {
        name: {
            first: body.first,
            last: body.last
        },
        email: body.email,
        password: body.password,
    }
}

module.exports = {
  index: (req, res, next) => {
    User.find().then((users) => {
      res.locals.users = users;
      next();
    });
  },
  indexView: (req, res) => {
    res.render("users/index", {
      flashMessages: {
        success: "Loaded all users ",
      },
    });
  },
  new: (req, res) => {
    res.render("user/create");
  },
  create: (req, res, next) => {
    if (req.skip) next();
    let newUser = new User(getUserParams(req.body));
    User.register(newUser, req.body.password, (error, user) => {
      if (user) {
        req.flash(
          "Success",
          `${user.name.first}'s account created successfully!`

        );
        console.log(user);
        res.locals.redirect = `/user/${user.name.first}`;
        next();
      } else {
        req.flash(
          "error",
          `Failed to create user account because: ${error.message}.`
        );
        res.locals.redirect = "/";
        next()
      }
    });
  },
  userFeed: (req, res) => {
    res.render("user", {userName:req.params.user});

  },
  redirectView: (req, res, next) => {
    let redirectPath = res.locals.redirect;
    if (redirectPath) res.redirect(redirectPath);
  },
  login: (req, res) => {
    res.render("users/login");
  },
  authenticate: (req, res, next) => {
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (user) {
          user.passwordComparison(req.body.password).then((passwordsMatch) => {
            if (passwordsMatch) {
              res.locals.redirect = `/user/${user._id}`;
              req.flash("success", `${user.first}'s logged in successfully!`);
              res.locals.user = user;
            } else {
              req.flash(
                "error",
                "Failed to log in user account: Incorrect Password."
              );
              res.locals.redirect = "/login";
            }
            next();
          });
        } else {
          req.flash(
            "error",
            "Failed to log in user account: User account not found."
          );
          res.locals.redirect = "/login";
          next();
        }
      })
      .catch((error) => {
        console.log(`Error logging in user: ${error.message}`);
        next(error);
      });
  },
  validate: (req, res, next) => {
    req
      .sanitizeBody("email")
      .normalizeEmail({
        all_lowercase: true,
      })
      .trim();
    req.check("email", "Email is invalid").isEmail();
    req.check("password", "Password cannot be empty").notEmpty();
    req.check("first", "this cannot be empty").notEmpty();
    req.check("last", "this cannot be empty").notEmpty();


    req.getValidationResult().then((error) => {
      if (!error.isEmpty()) {
        let messages = error.array().map((e) => e.msg);
        req.skip = true;
        req.flash("error", messages.join(" and "));
        res.locals.redirect = "/";
        next();
      } else {
        next();
      }
    });
  },
};