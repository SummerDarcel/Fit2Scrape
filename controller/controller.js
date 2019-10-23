const express = require("express");
const router = express.Router();
const path = require("path");
const mongoose = require("mongoose");

const request = require("request");
const cheerio = require("cheerio");

const Comment = require("../models/Comment.js");
const Article = require("../models/Article.js");

router.get("/", function(req, res) {
  res.redirect("/articles");
  
});

router.get("/scrape", function(req, res) {
  request("https://news.ycombinator.com/", function(error, response, html) {
    const $ = cheerio.load(html);
    const titlesArray = [];

    $(".title").each(function(i, element) {
      const result = {};

      result.title = $(this)
         .children(".storylink")
         .text();
        
      result.link = $(this)
          .children(".storylink")
          .attr("href");

      if (result.title !== "" && result.link !== "") {
        if (titlesArray.indexOf(result.title) == -1) {
          titlesArray.push(result.title);

          Article.count({ title: result.title }, function(err, test) {
            if (test === 0) {
              const entry = new Article(result);

              entry.save(function(err, doc) {
                if (err) {
                  console.log(err);
                } else {
                  console.log(doc);
                }
              });
            }
          });
        } else {
          console.log("Article exists.");
        }
      } else {
        console.log("Not saved in Database, missing data");
      }
    });
    res.redirect("/");
  });
});
router.get("/articles", function(req, res) {
  Article.find()
    .sort({ _id: -1 })
    .exec(function(err, doc) {
      if (err) {
        console.log(err);
      } else {
        const artcl = { article: doc };
        res.render("index", artcl);
      }
    });
});

router.get("/articles-json", function(req, res) {
  Article.find({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      res.json(doc);
    }
  });
});

router.get("/clearAll", function(req, res) {
  Article.remove({}, function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log("removed all articles");
    }
  });
  res.redirect("/articles-json");
});

router.get("/readArticle/:id", function(req, res) {
  const articleId = new mongoose.Types.ObjectId(req.params.id);
  const hbsObj = {
    article: [],
    body: []
  };

  Article.findOne({ _id: articleId })
    .populate("comment")
    .exec(function(err, doc) {
      if (err) {
        console.log("Error: " + err);
        res.sendStatus(500);
      } else {
        res.redirect(doc.link);
      }
    });
});
router.post("/comment/:id", function(req, res) {
  const user = req.body.name;
  const content = req.body.comment;
  const articleId = req.params.id;

  const commentObj = {
    name: user,
    body: content
  };

  const newComment = new Comment(commentObj);

  newComment.save(function(err, doc) {
    if (err) {
      console.log(err);
    } else {
      console.log(doc._id);
      console.log(articleId);

      Article.findOneAndUpdate(
        { _id: req.params.id },
        { $push: { comment: doc._id } },
        { new: true }
      ).exec(function(err, doc) {
        if (err) {
          console.log(err);
        } else {
          res.redirect("/readArticle/" + articleId);
        }
      });
    }
  });
});

module.exports = router;