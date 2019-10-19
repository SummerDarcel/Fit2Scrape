// const scrapeSite = require("./scraper");
const axios = require("axios")
const db = require("../models/index.js");
const cheerio = require("cheerio");

module.exports = (app) => {
    // scraping website (working)
    app.get("/articles/scrape", (request, response) => {
        const url = "https://www.buzzfeed.com/tvandmovies"
        // Making a request via axios for reddit's "webdev" board. The page's HTML is passed as the callback's third argument
        axios.get(url).then(function (response) {
            var $ = cheerio.load(response.data);
            $("div.card").each(function (i, element) {
                let link = $(element).children("a").attr("href");
                let title = $(element).children(".card__text").children(".card__headlines").text()
                let author = $(element).children(".card__text").children(".card__byline").children(".author-list").children(".card__byline__author").text()
                let blurb = $(element).children(".card__text").children(".card__description").text()
                // console.log(element)

                if (link && title && author && blurb) {
                    let article = {
                        title: title,
                        link: link,
                        author: author,
                        description: blurb,
                        saved: false
                    }
                    // console.log(article);
                    db.Article.find({ link: article.link })
                        .then(foundArticle => {
                            if (!foundArticle.length) {
                                db.Article.create(article)
                                    .then()
                                    .catch(error => console.log(error));
                            }
                        })
                        .catch(error => console.log(error));
                }

            });
            console.log("Scrape complete.");
        }).then(() => {
            response.sendStatus(200)
        })
            .catch(error => console.log(error));
    })

    // home (working)
    app.get("/", (request, response) => {
        db.Article.find({})
            .sort({ '_id': -1 })
            .then(foundArticles => {
                const handlebarsObject = {
                    home: true,
                    indarticle: false,
                    articles: foundArticles
                }
                response.render("home", handlebarsObject);
            })
            .catch(err => {
                console.log(err);
                response.sendStatus(500);
            });
    })

    // going to saved article (working)
    app.get("/articles/saved", (request, response) => {
        db.Article.find({ saved: true })
            .sort({ '_id': -1 })
            .then(foundArticles => {
                const handlebarsObject = {
                    home: false,
                    indarticle: false,
                    articles: foundArticles
                }
                response.render("home", handlebarsObject);
            })
            .catch(err => {
                console.log(err);
                response.sendStatus(500);
            });
    })

    // going to single article to see notes and comments
    app.get("/articles/:articleId", (request, response) => {
        db.Article.findOne({ _id: request.params.articleId })
            .populate("note")
            .then(foundArticles => {
                const handlebarsObject = {
                    home: false,
                    indarticle: true,
                    article: foundArticles
                }
                // console.log(handlebarsObject)
                // response.render("article", handlebarsObject);
                response.status(200).render("article", handlebarsObject, (err, html)=>{
                    response.send(html);
               });
              
                // response.json(handlebarsObject)
                response.status(200);
                // console.log(foundArticles);
            })
            .catch(err => {
                console.log(err);
                response.status(500);
            })
    })

    // saving articles (working)
    app.put("/articles/save/:articleId", (request, response) => {
        db.Article.findOneAndUpdate({ _id: request.params.articleId }, { saved: request.body.saved }, { new: true })
            .then(updatedArticle => {
                response.send("Save status updated.");
                response.sendStatus(200);
                // console.log(updatedArticle)
            })
            .catch(err => {
                console.log(err);
                response.sendStatus(500);
            });
    })

    // saving note (working)
    app.post("/notes/submit", (request, response) => {
        db.Note.create({ body: request.body.note })
            .then(createdNote => {
                return db.Article.findOneAndUpdate({ _id: request.body.articleId }, { $push: { note: createdNote._id } }, { new: true })
                    .then(addedNote => {
                        console.log("Note added.");
                        response.sendStatus(200)
                        // console.log(addedNote)
                    })
                    .catch(err => {
                        console.log(err);
                        response.sendStatus(500);
                    });
            })
    })
    // deleting note (working)
    app.delete("/notes/delete/:noteId", (request, response) => {
        db.Note.deleteOne({ _id: request.params.noteId })
            .then(deletedNote => {
                response.send("Note deleted.");
                response.sendStatus(200);
            })
            .catch(err => {
                console.log(err);
                response.sendStatus(500);
            });
    })
}