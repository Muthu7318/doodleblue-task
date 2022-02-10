const mongoose = require("mongoose");
const dotenv = require("dotenv");
const app = require("./app");

process.on("uncaughtException", (err) => {
  // console.log(`${err.name} and ${err.message}`);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });

// console.log(process.env);
const db = process.env.db_url;

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB Connection is successful"));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running in ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(`${err.name} and ${err.message}`);
  server.close(() => {
    process.exit(1);
  });
});

//test
