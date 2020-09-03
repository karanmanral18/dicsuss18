const path = require("path");
const express = require("express");
const bodyParser = require("body-parser");
const expressHbs = require("express-handlebars");
const helmet = require("helmet");
const compression = require("compression");
const flash = require("connect-flash");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
var LinkedInStrategy = require("passport-linkedin-oauth2").Strategy;
const passport = require("passport");
var cookieParser = require("cookie-parser");
var GoogleStrategy = require("passport-google-oauth2").Strategy;
var FacebookStrategy = require("passport-facebook").Strategy;
var TwitterStrategy = require("passport-twitter").Strategy;

var multer = require("multer");

const User = require("./models/user");

require("dotenv").config();

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0-nrcnx.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}`;
const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().getTime() + "-" + file.originalname);
  },
});

// filter invalid files
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/webp"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.engine(
  "hbs",
  expressHbs({
    layoutsDir: "views/layouts/",
    defaultLayout: "main-layout",
    extname: "hbs",
  })
);
app.set("view engine", "hbs");
app.set("views", "views");

const homeRoutes = require("./routes/home");
const fullPosts = require("./routes/fullpost");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const guestRoutes = require("./routes/guest");
const commentRoutes = require("./routes/comment");
const checkOauth = require("./routes/checkOAuth");
const publicRoutes = require("./routes/public");
const tagRoutes = require("./routes/tags");
const followRoutes = require("./routes/follow");

app.use(helmet());
app.use(compression());

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: store,
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  next();
});

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public"))); // user should be able to acess 'public' path
app.use(
  multer({ storage: fileStorage, fileFilter: fileFilter }).single("image")
);
app.use("/admin/images", express.static(path.join(__dirname, "images")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use("/fullpost/images", express.static(path.join(__dirname, "images")));
app.use("/tags/images", express.static(path.join(__dirname, "images")));
app.use(
  "/public/profile/images",
  express.static(path.join(__dirname, "images"))
);

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      next(new Error(err));
      // throw new Error(err) doesn't work for asynch code
    });
});

app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
});

passport.use(
  new LinkedInStrategy(
    {
      clientID: `${process.env.LINKEDIN_CLIENT_ID}`,
      clientSecret: `${process.env.LINKEDIN_CLIENT_SECRET}`,
      callbackURL: `${process.env.CALLBACK_URL}`,
      scope: ["r_liteprofile"],
    },
    function (accessToken, refreshToken, profile, done) {
      // asynchronous verification, for effect...
      process.nextTick(function () {
        // To keep the example simple, the user's LinkedIn profile is returned to
        // represent the logged-in user. In a typical application, you would want
        // to associate the LinkedIn account with a user record in your database,
        // and return that user instead.
        return done(null, profile);
      });
    }
  )
);

app.get(
  "/auth/linkedin",
  passport.authenticate("linkedin", { state: "987654321" }),
  function (req, res) {
    // The request will be redirected to LinkedIn for authentication, so this
    // function will not be called.
  }
);

app.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", {
    successRedirect: "/oauth/check",
    failureRedirect: "/",
  })
);

passport.use(
  new GoogleStrategy(
    {
      clientID: `${process.env.GOOGLE_CLIENT_ID}`,
      clientSecret: `${process.env.GOOGLE_CLIENT_SECRET}`,
      callbackURL: `${process.env.GOOGLE_CALLBACK_URL}`,
      passReqToCallback: true,
    },
    function (request, accessToken, refreshToken, profile, done) {
      User.findOrCreate({ googleId: profile.id }, function (err, user) {
        return done(err, user);
      });
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: [
      "https://www.googleapis.com/auth/plus.login",
      ,
      "https://www.googleapis.com/auth/plus.profile.emails.read",
    ],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    successRedirect: "/auth/google/success",
    failureRedirect: "/auth/google/failure",
  })
);

passport.use(
  new FacebookStrategy(
    {
      clientID: `${process.env.FACEBOOK_APP_ID}`,
      clientSecret: `${process.env.FACEBOOK_APP_SECRET}`,
      callbackURL: `${process.env.FACEBOOK_CALLBACK_URL}`,
      profileFields: ["id", "displayName", "photos", "email"],
    },
    function (accessToken, refreshToken, profile, cb) {
      User.findOne({ oauth_id: profile.id }, function (err, user) {
        if (err) {
          return done(err);
        }
        if (!user) {
          console.log(profile);
          user = new User({
            // email: profile.emails[0].value,
            name: profile.displayName,
            oauth_id: profile.id,
            // facebook: profile._json,
          });
          user.save(function (err) {
            if (err) console.log(err);
            // req.session.isLoggedIn = true;
            // req.session.user = user;
            return cb(err, user);
          });
        } else {
          return cb(err, user);
        }
      });
    }
  )
);
app.get("/auth/facebook", passport.authenticate("facebook"));

app.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  function (req, res) {
    res.redirect("/oauth/check/facebook");
  }
);

// passport.use(
//   new TwitterStrategy(
//     {
//       consumerKey: TWITTER_CONSUMER_KEY,
//       consumerSecret: TWITTER_CONSUMER_SECRET,
//       callbackURL: "http://127.0.0.1:3000/auth/twitter/callback",
//     },
//     function (token, tokenSecret, profile, cb) {
//       User.findOrCreate({ twitterId: profile.id }, function (err, user) {
//         return cb(err, user);
//       });
//     }
//   )
// );

// app.get("/auth/twitter", passport.authenticate("twitter"));

// app.get(
//   "/auth/twitter/callback",
//   passport.authenticate("twitter", { failureRedirect: "/login" }),
//   function (req, res) {
//     // Successful authentication, redirect home.
//     res.redirect("/");
//   }
// );

app.use("/", homeRoutes);
// app.use(guestRoutes);
app.use(authRoutes);
// app.use(commentRoutes);
app.use("/fullpost", fullPosts);
app.use(publicRoutes);
app.use(tagRoutes);
app.use("/admin", adminRoutes);
app.use(checkOauth);
app.use(followRoutes);

app.use((req, res, next) => {
  res.status(404).render("404", { pageTitle: " Page not Found" });
});

app.use((error, req, res, next) => {
  res.status(500).render("500", {
    pageTitle: "Error",
    path: "/500",
    error: error,
  });
});

mongoose
  .connect(MONGODB_URI, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useFindAndModify: false,
  })
  .then((result) => {
    console.log("Database connected");
    app.listen(process.env.PORT || 4000);
    // app.listen(4000);
  })
  .catch((err) => {
    console.log(err);
    const error = new Error("Database Connnection Error");
    error.httpStatusCode = 500;
    return next(error);
  });
