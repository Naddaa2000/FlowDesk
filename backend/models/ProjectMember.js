const mongoose = require("mongoose");
const { PROJECT_ROLE, MEMBER_STATUS } = require("../libs/enum");

const projectMemberSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: Object.values(PROJECT_ROLE),
      default: PROJECT_ROLE.DEVELOPER,
    },
    status: {
      type: String,
      enum: Object.values(MEMBER_STATUS),
      default: MEMBER_STATUS.ACTIVE,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    inviteToken: { type: String, default: null },
  },
  { timestamps: true }
);

projectMemberSchema.index({ project: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("ProjectMember", projectMemberSchema);
