const mongoose = require("mongoose");
const { STATUS_TYPE } = require("../libs/enum");

const statusSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    color: { type: String, default: "#64748b" },
    orderindex: { type: Number, default: 0 },
    type: {
      type: String,
      enum: Object.values(STATUS_TYPE),
      default: STATUS_TYPE.CUSTOM,
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: "#0f766e" },
    lead: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    statuses: {
      type: [statusSchema],
      default: () => [
        { name: "To Do", color: "#64748b", orderindex: 0, type: "open" },
        { name: "In Progress", color: "#0ea5e9", orderindex: 1, type: "custom" },
        { name: "Review", color: "#a855f7", orderindex: 2, type: "custom" },
        { name: "Done", color: "#10b981", orderindex: 3, type: "closed" },
      ],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Project", projectSchema);
