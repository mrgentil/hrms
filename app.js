var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var withAuth = require("./withAuth");

const db = require("./models");
const NotificationService = require("./services/notificationService");
require("dotenv").config();

var api = require("./routes/api");
var login = require("./routes/login/login.routes");
var register = require("./routes/register/register.routes");

var app = express();

// global.__basedir = __dirname;

// view engine setup
// app.set("views", path.join(__dirname, "views"));
// app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
// app.use(express.static(path.join(__dirname, "public")));

// var corsOptions = {
//   origin: 'http://localhost:3000',
//   optionsSuccessStatus: 200
// }

db.sequelize.sync({ alter: true }).then(() => {
  console.log("Database synchronized successfully.");
}).catch(err => {
  console.error("Error synchronizing database:", err);
});

// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });

// Initialize notification service when socket.io is available
app.use((req, res, next) => {
  if (req.app.get('io') && !req.app.get('notificationService')) {
    const notificationService = new NotificationService(req.app.get('io'));
    req.app.set('notificationService', notificationService);
    console.log('🔔 Notification service initialized');
  }
  next();
});

app.use("/api", api);
app.use("/login", login);
app.use("/register", register);

app.get("/checkToken", withAuth.checkToken);

// Serve static assets if in production
if (process.env.NODE_ENV === "production") {
  // Set static folder
  app.use(express.static("client/build"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
  });
}

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const status = err.status || 500;
  const isDev = req.app.get("env") === "development";

  res.status(status);

  if (req.accepts("json")) {
    return res.json({
      message: err.message,
      ...(isDev ? { stack: err.stack } : {})
    });
  }

  res.type("text").send(isDev ? `${err.message}\n${err.stack}` : err.message);
});

module.exports = app;
