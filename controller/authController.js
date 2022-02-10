const crypto = require("crypto");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const User = require("../model/usermodel");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_secret, {
    expiresIn: process.env.JWT_expiresIn,
  });

const createAndSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    cookieOption.secure = true;
  }
  res.cookie("jwt", token, cookieOption);
  //remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: "success",
    token: token,
    data: {
      user: user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });
  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  // console.log(email, password);
  // 1) check if the email password exists
  if (!email || !password) {
    return next(new AppError("Please provide email and password", 400));
  }
  // 2) check if user exists
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) if everything ok, sent jwt to client
  createAndSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.cookie("jwt", "logged out", {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({
    status: "success",
  });
};

exports.protect = catchAsync(async (req, res, next) => {
  //1) we need to get the token & check whether it really exists
  let token;
  console.log("cookies");
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    console.log(req.cookies);
    console.log(req.cookies.jwt);
    token = req.cookies.jwt;
  }

  // console.log(token);
  if (!token) {
    return next(
      new AppError("you are not logged in. please log in to get access", 401)
    );
  }
  //2) validate the token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_secret);
  // console.log(decoded);

  //3) need to check whether the user exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token does not exist", 401)
    );
  }
  //4) check if user changed password after the jwt was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("user recently changed password... please log in again", 401)
    );
  }

  //grant access to protected route
  res.locals.user = currentUser;
  req.user = currentUser;

  next();
});

exports.isLoggedIn = async (req, res, next) => {
  if (req.cookies.jwt) {
    try {
      // verfiy the token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_secret
      );
      // console.log(decoded);

      //2) need to check whether the user exists
      const currentUser = await User.findById(decoded.id);
      if (!currentUser) {
        return next();
      }
      //3) check if user changed password after the jwt was issued
      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //user is logged in
      res.locals.user = currentUser;
      return next();
    } catch (err) {
      return next();
    }
  }

  next();
};

exports.restrictTo =
  (...roles) =>
  (req, res, next) => {
    // roles is an array
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("you do not have permisson to perform this action", 403)
      );
    }
    next();
  };

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) get user based on email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address", 404));
  }
  //2) generate random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    res.status(200).json({
      status: "success",
      message: "token sent to email",
      token: resetToken,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        "There was an error sending email. please try again later",
        500
      )
    );
  }
  next();
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) get user based on the token
  // console.log('token is ' + req.params.token);
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  //2) if the token not expired, and there is a user, set the new password
  if (!user) {
    return next(new AppError("Token is invalid or expired", 400));
  }
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();
  //3) upadte changedPasswordAt property for the user

  //4) log the user in,send jwt to client
  createAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) get user from collection
  const user = await User.findById(req.user.id).select("+password");

  //2) if the entered password is correct
  // console.log('current password is ' + req.body.passwordCurrent);
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError("ur current password is wrong", 401));
  }
  //3) if so, then update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();
  //4) log user in, send JWT
  createAndSendToken(user, 200, res);
});
