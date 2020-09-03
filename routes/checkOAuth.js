const express = require("express");
const User = require("../models/user");
const router = express.Router();

require("dotenv").config();

router.get("/oauth/check", async (req, res, next) => {
  console.log(req.user);
  const userId = req.user.id;
  User.findOne({ oauth_id: userId }).then((user) => {
    console.log("User -----------------------------------------------------");
    console.log(user);
    console.log("User -----------------------------------------------------");
    if (
      user == [] ||
      user == null ||
      user == undefined ||
      user == {} ||
      user == "[]"
    ) {
      res.redirect("/oauth/email");
    } else {
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save((err) => {
        res.redirect("/");
      });
    }
  });
});

router.get("/oauth/email", async (req, res, next) => {
  res.render("Oauth_email.hbs");
});

router.post("/oauth/email", async (req, res, next) => {
  const email = req.body.email;
  const user = new User({
    email: email,
    name: req.user.name.givenName,
    oauth_id: req.user.id,
  });
  await user.save();
  req.session.isLoggedIn = true;
  req.session.user = user;
  return req.session.save((err) => {
    res.redirect("/");
  });
});

router.get("/oauth/check/facebook", async (req, res, next) => {
  if (req.user === undefined) {
    console.log("udefined");
    return res.redirect("/login");
  }

  const userId = req.user.oauth_id;
  User.findOne({ oauth_id: userId }).then((user) => {
    if (!user.email) {
      res.redirect("/oauth/email/facebook");
    } else {
      req.session.isLoggedIn = true;
      req.session.user = user;
      return req.session.save((err) => {
        res.redirect("/");
      });
    }
  });
});

router.get("/oauth/email/facebook", async (req, res, next) => {
  res.render("oauth_email_facebook.hbs");
});

router.post("/oauth/email/facebook", async (req, res, next) => {
  const email = req.body.email;
  User.findOneAndUpdate(
    { oauth_id: req.user.oauth_id },
    {
      $set: {
        email: email,
      },
    },
    { new: true }
  ).then((user) => {
    req.session.isLoggedIn = true;
    req.session.user = user;
    return req.session.save((err) => {
      res.redirect("/");
    });
  });
});

module.exports = router;
