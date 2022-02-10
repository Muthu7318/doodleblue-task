const express = require("express");
const productController = require("../controller/productController");
const authController = require("../controller/authController");

const Router = express.Router();

Router.route("/").post(
  productController.uploadFile,
  productController.createProduct
);
Router.route("/:id").patch(productController.updateProduct);
module.exports = Router;
