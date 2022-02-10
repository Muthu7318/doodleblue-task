const express = require("express");
const productController = require("../controller/productController");
const authController = require("../controller/authController");

const Router = express.Router();

Router.route("/").post(
  authController.protect,
  productController.uploadFile,
  productController.createProduct
);
Router.route("/:id").patch(
  authController.protect,
  productController.updateProduct
);
module.exports = Router;
