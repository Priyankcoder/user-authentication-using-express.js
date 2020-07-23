const mongoose = require("mongoose"),
passportLocalMongoose = require("passport-local-mongoose"),
bcrypt = require("bcrypt"),
passport = require("passport"),
userSchema = mongoose.Schema(
  {
    name: {
      first: {
        type: String,
        required: true,
        trim: true,
      },
      last: {
        type: String,
        trim: true,
      },
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      unique: true,
    },
    isVerified: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
});
module.exports = mongoose.model("user", userSchema);