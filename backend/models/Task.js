const mongoose = require("mongoose");
const { PRIORITY } = require("../libs/enum");

const checklistItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    resolved: { type: Boolean, default: false },
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { _id: true }
);

const checklistSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    items: { type: [checklistItemSchema], default: [] },
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    statusId: { type: mongoose.Schema.Types.ObjectId, required: true },
    priority: {
      type: String,
      enum: [...Object.values(PRIORITY), null],
      default: null,
    },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    tags: [{ type: String }],
    dueDate: { type: Date, default: null },
    startDate: { type: Date, default: null },
    timeEstimate: { type: Number, default: null }, // milliseconds
    timeSpent: { type: Number, default: 0 },
    timerStartedAt: { type: Date, default: null },
    points: { type: Number, default: null },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Task", default: null },
    orderindex: { type: Number, default: 0 },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    checklists: { type: [checklistSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);
