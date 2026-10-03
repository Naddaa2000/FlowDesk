const mongoose = require("mongoose");
const { GLOBAL_ROLE, USER_STATUS } = require("../libs/enum");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(GLOBAL_ROLE),
      default: GLOBAL_ROLE.USER,
    },
    status: {
      type: String,
      enum: Object.values(USER_STATUS),
      default: USER_STATUS.ACTIVE,
    },
    avatarColor: { type: String, default: "#0f766e" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
