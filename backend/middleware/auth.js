const jwt = require("jsonwebtoken");
const User = require("../models/User");
const errorResponse = require("../libs/responseMessage/error");
const { USER_STATUS } = require("../libs/enum");

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return errorResponse(res, "Authentication required", 401);

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.status === USER_STATUS.DISABLED) {
      return errorResponse(res, "Invalid or disabled account", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return errorResponse(res, "Invalid or expired token", 401);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return errorResponse(res, "Admin access required", 403);
  }
  next();
};

module.exports = { auth, requireAdmin };
