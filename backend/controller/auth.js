const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const successResponse = require("../libs/responseMessage/success");
const errorResponse = require("../libs/responseMessage/error");
const { GLOBAL_ROLE, USER_STATUS } = require("../libs/enum");

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    avatarColor: user.avatarColor,
  };
}

function signToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.TOKEN_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
  );
}

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return errorResponse(res, "name, email and password are required", 400);
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return errorResponse(res, "Email already registered", 409);

    const adminCount = await User.countDocuments({ role: GLOBAL_ROLE.ADMIN });
    const assignedRole =
      role === GLOBAL_ROLE.ADMIN && adminCount === 0
        ? GLOBAL_ROLE.ADMIN
        : GLOBAL_ROLE.USER;

    const hashed = await bcrypt.hash(password, 10);
    const colors = ["#0f766e", "#0369a1", "#b45309", "#be123c", "#6d28d9"];
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashed,
      role: assignedRole,
      status: USER_STATUS.ACTIVE,
      avatarColor: colors[Math.floor(Math.random() * colors.length)],
    });

    const token = signToken(user);
    return successResponse(
      res,
      "Registered",
      { user: publicUser(user), token },
      201,
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return errorResponse(res, "email and password are required", 400);
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) return errorResponse(res, "Invalid credentials", 401);

    if (user.status === USER_STATUS.DISABLED) {
      return errorResponse(res, "Account disabled", 403);
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return errorResponse(res, "Invalid credentials", 401);

    if (user.status === USER_STATUS.INVITED) {
      user.status = USER_STATUS.ACTIVE;
      await user.save();
    }

    const token = signToken(user);
    return successResponse(res, "Logged in", { user: publicUser(user), token });
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const me = async (req, res) => {
  return successResponse(res, "OK", { user: publicUser(req.user) });
};

const logout = async (_req, res) => {
  return successResponse(res, "Logged out", null);
};

module.exports = { register, login, me, logout, publicUser };
