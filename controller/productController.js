const Product = require("../model/productmodel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const factory = require("./handlerFactory");
const multer = require("multer");
const csv = require("csvtojson");

var storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/uploads");
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

var uploads = multer({ storage: storage });

exports.uploadFile = uploads.single("products");
exports.createProduct = catchAsync(async (req, res) => {
  csv()
    .fromFile(req.file.path)
    .then((jsonObj) => {
      // console.log(jsonObj);
      Product.insertMany(jsonObj, (err, data) => {
        if (err) {
          res.status(401).json({
            status: "failed",
            error: err,
          });
        } else {
          res.status(200).json({
            status: "success",
            result: data.length,
            data,
          });
        }
      });
    });
});

exports.updateProduct = catchAsync(async (req, res) => {
  console.log(req.params.id);
  if (!req.params.id) {
    return next(new AppError("please select the product to update"), 401);
  }
  const product = await Product.findById(req.params.id);

  if (product) {
    const updateProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({
      status: "updated",
      result: updateProduct,
    });
  } else {
    const createProduct = await Product.create(req.body);
    res.status(200).json({
      status: "success",
      result: createProduct,
    });
  }
});
