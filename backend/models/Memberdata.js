const mongoose = require("mongoose");
const { ROLE,STATUS } = require("../libs/enum");

const MemberSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },

  age: {
    type: Number,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  role: {
    type: String,
    enum: Object.values(ROLE),
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  phoneNo: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
     enum: Object.values(STATUS),
    unique: true,
  },
  OTP: {
    type: String,
  },

  resetOTP: {
    type: String,
  },

  lastLogin: {
    type: Date,
  },
});

MemberSchema.index(
  { role: 1 },
  {
    unique: true,
    partialFilterExpression: {
      role: ROLE.ADMIN,
    },
  }
);

module.exports = mongoose.model("Memberdata", MemberSchema);