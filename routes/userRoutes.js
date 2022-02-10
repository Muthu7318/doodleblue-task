const express = require("express");
const userController = require("../controller/usersController");
const authController = require("../controller/authController");

const Router = express.Router();

Router.route("/signup").post(authController.signup);
// Router.post('/signup', authController.signup);
Router.route("/login").post(authController.login);
Router.route("/logout").get(authController.logout);

Router.route("/forgotPassword").post(authController.forgotPassword);

Router.route("/resetPassword/:token").patch(authController.resetPassword);

Router.use(authController.protect);

Router.route("/updateMyPassword").patch(authController.updatePassword);

Router.get("/me", userController.getMe, userController.getUser);

Router.patch("/updateMe", userController.updateMe);

Router.delete("/deleteMe", userController.deleteMe);

Router.use(authController.restrictTo("admin"));
Router.route("/")
  .get(userController.getAllUsers)
  .post(userController.createUser);

Router.route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

Router.route("/test/:id").get(userController.test);
module.exports = Router;
