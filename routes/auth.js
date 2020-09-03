const express = require("express");
// check function
// const { check, body } = require("express-validator/check");

const authController = require("../controllers/auth");
const User = require("../models/user");

const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post("/login", authController.postLogin);

router.post("/signup", authController.postSignup);

router.get("/logout", authController.postLogout);

// router.get("/reset", authController.getReset);

// router.post("/reset", authController.postReset);

// router.get("/reset/:token", authController.getNewPassword);

// router.post("/new-password", authController.postNewPassword);

module.exports = router;
