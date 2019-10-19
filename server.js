let express = require("express");
let logger = require("morgan");
let mongoose = require("mongoose");
let exphbs = require("express-handlebars");
let dotenv = require("dotenv");
dotenv.config();


let PORT = process.env.PORT || 8000;


// Initialize Express
let app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

let apiRoutes = require("./routes/api-routes");
apiRoutes(app);


// Connect to the Mongo DB 

let MONGODB_URI =  process.env.MONGODB_URI || "mongodb://localhost/huffpo_politics_db";
// console.log(MONGODB_URI)
// mongoose.set('debug', true);
mongoose.connect(MONGODB_URI, { useNewUrlParser: true})
.then(() => {
  console.log("Mongoose is successfully connected")
})
.catch((err) => console.log(' Problem with mongodb! ' + err));
mongoose.Promise = global.Promise;

// Start the server
app.listen(PORT, function() {
    console.log("App running on port " + PORT + "!");
  });