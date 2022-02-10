const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");
const User = require("./usermodel");

const orderSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "a product must have a name"],
  },
  productQuantity: {
    type: Number,
    required: [true, "Please mention quantity"],
  },
  orderDate: {
    type: Date,
    default: Date.now(),
  },
  orderAmount: {
    type: Number,
    required: [true, "Please mention the amount"],
  },
  customer: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "order must belong to a user"],
  },
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "order must have a product"],
  },
  status: {
    type: String,
    default: "active",
  },
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
