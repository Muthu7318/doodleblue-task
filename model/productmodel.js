const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: [true, "A product must have a name"],
  },
  price: {
    type: String,
    required: [true, "A product must have a price"],
  },
  type: {
    type: String,
    required: [true, "A product must have a type"],
  },
  vendor: {
    type: String,
    required: [true, "A product must have a vendor"],
  },
});

const Product = mongoose.model("Product", productSchema);
module.exports = Product;
