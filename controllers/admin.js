// const { validationResult } = require("express-validator/check");
// const fileHelper = require("../util/file");

const User = require("../models/user");
const Posts = require("../models/posts");
const Answers = require("../models/answers");
const Suggestion = require("../models/suggestions");
const Tags = require("../models/tags");

exports.getHomePage = (req, res, next) => {
  res.render("admin/home", {
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    isSeller: true,
    path: {
      admin: true,
    },
  });
};

exports.getProfile = (req, res, next) => {
  let message = req.flash("success");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  User.findOne({ email: req.session.user.email })
    // to get json instead of mongoose one
    .lean()
    .then((user) => {
      if (!user) {
        console.log("User not found");
      } else {
        console.log("user found" + user);
        console.log(req.session.user);

        res.render("admin/profile", {
          user: user,
          errorMessage: null,
          validationErrors: [],
          active: { profile: true },
          successMessage: message,
          path: {
            admin: true,
          },
        });
      }
    })
    .catch((err) => {
      const error = new Error("Database Error Please try Again");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getFeedback = (req, res, next) => {
  let message = req.flash("success");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("admin/feedback", {
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    active: { feedback: true },
    successMessage: message,
    path: {
      admin: true,
    },
  });
};

exports.getSuggest = (req, res, next) => {
  let message = req.flash("success");
  if (message.length > 0) {
    message = message[0];
  } else {
    message = null;
  }
  res.render("admin/suggest", {
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    active: { suggest: true },
    successMessage: message,
    path: {
      admin: true,
    },
  });
};

exports.getBookmarks = (req, res, next) => {
  res.render("admin/bookmark", {
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    isSeller: true,
    active: { bookmark: true },
    path: {
      admin: true,
    },
  });
};

exports.getAddPost = (req, res, next) => {
  res.render("admin/addPost", {
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    active: { add: true },
    path: {
      admin: true,
    },
  });
};

exports.getEditPost = async (req, res, next) => {
  const postId = req.params.id;
  const post = await Posts.findById({ _id: postId }).lean();
  res.render("admin/editPost", {
    post: post,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    active: { add: true },
    path: {
      admin: true,
    },
  });
};

exports.getAddAnswer = (req, res, next) => {
  res.render("admin/addAnswer", {
    postId: req.params.id,
    editing: false,
    hasError: false,
    errorMessage: null,
    validationErrors: [],
    path: {
      admin: true,
    },
  });
};

exports.getPosts = (req, res, next) => {
  Posts.find({ user: req.session.user._id })
    .lean()
    .then((result) => {
      // console.log(result);
      res.render("admin/Posts", {
        posts: result,
        errorMessage: null,
        validationErrors: [],
        active: { myposts: true },
        path: {
          admin: true,
        },
      });
    });
};

exports.postAddPost = async (req, res, next) => {
  const title = req.body.title;
  const category = req.body.category;
  let tags = req.body.tags;
  if (tags === "") {
    var post = new Posts({
      author: req.session.user.name,
      title: title,
      category: category,
      content: req.body.hiddenMarkup,
      contentWithoutMarkup: req.body.hiddenMarkup2,
      user: req.session.user,
      userImage: req.session.user.imageUrl,
    });
  } else {
    let resi = tags.split(",");

    resi = resi.map((el) => {
      return el.toLowerCase();
    });

    for (let i = 0; i < resi.length; i++) {
      const element = new Tags({
        tagName: resi[i].toLowerCase(),
      });
      await element.save();
    }

    var post = new Posts({
      author: req.session.user.name,
      title: title,
      category: category,
      content: req.body.hiddenMarkup,
      contentWithoutMarkup: req.body.hiddenMarkup2,
      user: req.session.user,
      userImage: req.session.user.imageUrl,
      tags: resi,
    });
  }

  post
    .save()
    .then((user) => {
      req.flash("success", "Saved Succesfully");
      res.redirect("/admin/posts");
    })
    .catch((err) => {
      const error = new Error("Database Error Please try Again");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditPost = async (req, res, next) => {
  const title = req.body.title;
  const category = req.body.category;
  const postId = req.body.postId;

  Posts.findOneAndUpdate(
    { _id: postId },
    {
      $set: {
        title: title,
        category: category,
        content: req.body.hiddenMarkup,
        contentWithoutMarkup: req.body.hiddenMarkup2,
      },
    },
    { new: true }
  ).then((post) => {
    return res.redirect(`/fullpost/${postId}`);
  });
};

exports.postAddAnswer = (req, res, next) => {
  const answer = new Answers({
    postId: req.body.postId,
    author: req.session.user.name,
    content: req.body.hiddenMarkup,
    user: req.session.user,
    userImage: req.session.user.imageUrl,
    path: {
      admin: true,
    },
  });

  answer
    .save()
    .then((user) => {
      req.flash("success", "Saved Succesfully");
      res.redirect(`/fullpost/${req.body.postId}`);
    })
    .catch((err) => {
      const error = new Error("Database Error Please try Again");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postProfile = (req, res, next) => {
  const name = req.body.name;
  const mobile = req.body.mobile;
  const location = req.body.location;
  const language = req.body.language;
  const interests = req.body.interests;

  User.findOneAndUpdate(
    { email: req.session.user.email },
    {
      $set: {
        name: name,
        mobile: mobile,
        location: location,
        language: language,
      },
    },
    { new: true }
  )
    .then((user) => {
      req.session.user = user;
      req.flash("success", "Saved Succesfully");
      res.redirect("/admin/profile");
    })
    .catch((err) => {
      const error = new Error("Database Error Please try Again");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postProfileAddPhoto = (req, res, next) => {
  const image = req.file;
  const imageUrl = image.path;

  User.findOneAndUpdate(
    { email: req.session.user.email },
    {
      $set: {
        imageUrl: imageUrl,
      },
    },
    { new: true }
  )
    .then(async (result) => {
      req.session.user.imageUrl = imageUrl;
      req.flash("success", "Saved Succesfully");
      res.redirect("/admin/profile");
    })
    .catch((err) => {
      const error = new Error("Database Error Please try Again");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postFeedback = (req, res, next) => {
  const feedback = req.body.feedback;
  User.findOneAndUpdate(
    { email: req.session.user.email },
    {
      $set: {
        feedback: feedback,
      },
      new: true,
    }
  )
    .then((user) => {
      req.flash("success", "Saved Succesfully");
      res.redirect("/admin/feedback");
    })
    .catch((err) => {
      const error = new Error("Database Error Please try Again");
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postSuggest = (req, res, next) => {
  const category = req.body.category;
  const subcategory = req.body.subcategory;
  const video1 = req.body.url1;
  const video2 = req.body.url2;
  const video3 = req.body.url3;
  const v1t1 = req.body.v1t1;
  const v1t2 = req.body.v1t2;
  const v2t1 = req.body.v2t1;
  const v2t2 = req.body.v2t2;
  const v3t1 = req.body.v3t1;
  const v3t2 = req.body.v3t2;

  const videos = {};
  const items = [
    { videoId: video1, tags: [v1t1, v1t2] },
    { videoId: video2, tags: [v2t1, v2t2] },
    { videoId: video3, tags: [v3t1, v3t2] },
  ];
  videos.items = items;
  console.log(videos);

  const suggest = new Suggestion({
    category: category,
    subcategory: subcategory,
    user: req.session.user._id,
    videos: videos,
  });

  suggest
    .save()
    .then((result) => {
      req.flash("success", "Saved Succesfully");
      res.redirect("/admin/suggest");
    })
    .catch((err) => {
      const error = new Error("Database Error Please try Again");
      error.httpStatusCode = 500;
      return next(error);
    });
};
