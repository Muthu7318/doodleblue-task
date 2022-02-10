const express = require("express");
const orderController = require("../controller/orderController");
const authController = require("../controller/authController");

const Router = express.Router();

Router.route("/createorder").post(
  authController.protect,
  orderController.createOrder
);
Router.route("/updateorder/:id").patch(
  authController.protect,
  orderController.updateOrder
);
Router.route("/cancelorder/:id").delete(
  authController.protect,
  orderController.cancelOrder
);
Router.route("/getcustomerorder").get(
  authController.protect,
  orderController.getCustomerOrder
);

Router.route("/productinfo").get(
  authController.protect,
  orderController.getProductInfoBasedCustomer
);

module.exports = Router;
