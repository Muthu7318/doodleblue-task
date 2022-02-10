/* eslint-disable prettier/prettier */
const path = require("path");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xssClean = require("xss-clean");
const hpp = require("hpp");
const cookieParser = require("cookie-parser");
const compression = require("compression");
// it is a common practice to have all express code in app.js

const AppError = require("./utils/appError");
const globalErrorHandler = require("./controller/errorController");

const userRouter = require("./routes/userRoutes");
const orderRouter = require("./routes/orderRoute");
const products = require("./routes/productRoute");
const app = express();

// Global middlewares

//serving static files
// app.use(express.static(`${__dirname}/public/`));
app.use(express.static(path.join(__dirname, "public")));

// cors;
app.use(
  cors({
    origin: "http://localhost:3000", //(Whatever your frontend url is)
    credentials: true, // <= Accept credentials (cookies) sent by the client
  })
);
// set security http headers
app.use(helmet());

// limit request from same api
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, Please try again in an hour",
});
app.use("/api", limiter);

// body parser
app.use(
  express.json({
    limit: "10kb",
  })
); // app.use is used for defining the middleware..Express.json here is a middleware, it is basically a function that modify the incoming request data
app.use(
  express.urlencoded({
    extended: true,
    limit: "10kb",
  })
);
app.use(cookieParser());

// Data sanitization against nosql query injection
app.use(mongoSanitize());
// Data sanitization against XSS
app.use(xssClean());

// prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingQuantity",
      "ratingAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);

app.use(compression());

// ROUTES
app.use("/api/v1/users", userRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/products", products);
app.all("*", (req, res, next) => {
  next(new AppError(`cant find ${req.originalUrl} on the server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
