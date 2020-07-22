const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");
const userSchema = mongoose.Schema(
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
  },
  {
    timestamps: true,
  }
);
userSchema.plugin(passportLocalMongoose, {
  usernameField: "email",
});
module.exports = mongoose.model("user", userSchema);