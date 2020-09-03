const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    // required: true,
    default: "User",
  },
  email: {
    type: String,
  },
  mobile: {
    type: Number,
    // required: true,
  },
  location: {
    type: String,
  },
  language: {
    type: String,
  },
  imageUrl: {
    type: String,
    default: "images/unknown.png",
  },
  // interests: {
  //   items: [],
  // },
  password: {
    type: String,
  },
  feedback: {
    type: String,
  },
  oauth_id: {
    type: String,
  },
  resetToken: String,
  resetTokenExpiration: Date,
});

module.exports = mongoose.model("User", userSchema);
