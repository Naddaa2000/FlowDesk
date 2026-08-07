const User = require("../models/User");
const successResponse = require("../libs/responseMessage/success");
const errorResponse = require("../libs/responseMessage/error");
const { publicUser } = require("../controller/auth");
const { GLOBAL_ROLE } = require("../libs/enum");

/** List users for admin invite picker / assigning lead */
const listUsers = async (req, res) => {
  try {
    if (req.user.role !== GLOBAL_ROLE.ADMIN && req.user.role !== GLOBAL_ROLE.USER) {
      return errorResponse(res, "Forbidden", 403);
    }
    const users = await User.find({ status: { $ne: "disabled" } }).sort({ name: 1 });
    return successResponse(res, "Users", users.map(publicUser));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = { listUsers };
