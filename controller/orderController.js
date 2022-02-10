const Order = require("../model/ordermodel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const User = require("../model/usermodel");

exports.createOrder = factory.createOne(Order);
exports.updateOrder = factory.updateOne(Order);
exports.cancelOrder = factory.deleteOne(Order);
exports.getCustomerOrder = catchAsync(async (req, res) => {
  console.log(req.query);
  const customerOrder = await Order.find(req.query).sort(req.query.sort);
  res.status(200).json({
    status: "success",
    results: customerOrder.length,
    data: {
      orders: customerOrder,
    },
  });
});
exports.getProductInfoBasedCustomer = catchAsync(async (req, res) => {
  const productInfo = await Order.find(req.query);

  const customerId = productInfo.map((item) => item.customer);
  console.log(customerId);

  const customerInfoPromises = customerId.map(async (id) => User.findById(id));
  const customerInfo = await Promise.all(customerInfoPromises);

  console.log(customerInfo);

  // console.log(customerInfo);
  res.status(200).json({
    status: "success",
    results: customerInfo.length,
    data: {
      orders: customerInfo,
    },
  });
});
