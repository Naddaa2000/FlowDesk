const mongoose = require("mongoose");
const { ROLE,SEVERITY } = require("../libs/enum");

const MemberSchema = new mongoose.Schema({
  ProkectName: {
    type: String,
    required: true,
  },

  LeadName: {
    type: Number,
    required: true,
  },

  type: {
    type: String,
    enum: ["bug", "feature", "task"],
    default: "task",
  },
  severity: {
    type: String,
    enum: Object.values(SEVERITY),
    default: SEVERITY.MEDIUM,
    required: true,
  },
  createdAt: {
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