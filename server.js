// MASTER BRANCH FOR NEW FEATURES/EDITS

// DEPENDENCIES
const express = require("express");
const mongoose = require("mongoose");
const methodOverride = require("method-override");
const morgan = require("morgan");
const session = require("express-session");

// CONFIGURATIONS
require("dotenv").config();
const PORT = process.env.PORT;
const mongodbURI = process.env.MONGODBURI;
const app = express();
mongoose.connection;

// DATABASE
mongoose.connect(
    mongodbURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false,
    },
    () => {
        console.log("the connection with mongod is established at", mongodbURI);
    }
);

// MIDDLEWARE
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.use(morgan(":method :url :status"));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(
    session({
        secret: process.env.SECRET, //a random string do not copy this value or your stuff will get hacked
        resave: false, // default more info: https://www.npmjs.com/package/express-session#resave
        saveUninitialized: false, // default  more info: https://www.npmjs.com/package/express-session#resave
    })
);

// CONTROLLERS
const habitsController = require("./controllers/habits_controller.js");
app.use("/habits", habitsController);

const usersController = require("./controllers/users_controller.js");
app.use("/users", usersController);

const sessionsController = require("./controllers/sessions_controller.js");
app.use("/sessions", sessionsController);

// ROUTES
// index
app.get("/", (req, res) => {
    res.redirect("/habits");
});

// LISTENER
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}...`);
});