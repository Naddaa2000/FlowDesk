/**
 * Seed admin + project team (lead / developer / QA)
 * Usage: npm run seed
 */
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Activity = require("../models/Activity");
const Attachment = require("../models/Attachment");
const {
  GLOBAL_ROLE,
  PROJECT_ROLE,
  MEMBER_STATUS,
  USER_STATUS,
} = require("../libs/enum");

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log("Connected");

  await Promise.all([
    Attachment.deleteMany({}),
    Activity.deleteMany({}),
    Comment.deleteMany({}),
    Task.deleteMany({}),
    ProjectMember.deleteMany({}),
    Project.deleteMany({}),
    User.deleteMany({}),
  ]);

  const password = await bcrypt.hash("password123", 10);

  const admin = await User.create({
    name: "Admin User",
    email: "admin@flowdesk.app",
    password,
    role: GLOBAL_ROLE.ADMIN,
    status: USER_STATUS.ACTIVE,
    avatarColor: "#0f766e",
  });

  const lead = await User.create({
    name: "Sam Rivera",
    email: "lead@flowdesk.app",
    password,
    role: GLOBAL_ROLE.USER,
    status: USER_STATUS.ACTIVE,
    avatarColor: "#0369a1",
  });

  const developer = await User.create({
    name: "Jordan Lee",
    email: "dev@flowdesk.app",
    password,
    role: GLOBAL_ROLE.USER,
    status: USER_STATUS.ACTIVE,
    avatarColor: "#b45309",
  });

  const qa = await User.create({
    name: "Casey Kim",
    email: "qa@flowdesk.app",
    password,
    role: GLOBAL_ROLE.USER,
    status: USER_STATUS.ACTIVE,
    avatarColor: "#be123c",
  });

  const project = await Project.create({
    name: "Engineering",
    description: "Core product delivery",
    color: "#0f766e",
    lead: lead._id,
    createdBy: admin._id,
  });

  await ProjectMember.insertMany([
    {
      project: project._id,
      user: lead._id,
      role: PROJECT_ROLE.LEAD,
      status: MEMBER_STATUS.ACTIVE,
      invitedBy: admin._id,
    },
    {
      project: project._id,
      user: developer._id,
      role: PROJECT_ROLE.DEVELOPER,
      status: MEMBER_STATUS.ACTIVE,
      invitedBy: lead._id,
    },
    {
      project: project._id,
      user: qa._id,
      role: PROJECT_ROLE.QA,
      status: MEMBER_STATUS.ACTIVE,
      invitedBy: lead._id,
    },
    {
      project: project._id,
      user: admin._id,
      role: PROJECT_ROLE.DEVELOPER,
      status: MEMBER_STATUS.ACTIVE,
      invitedBy: admin._id,
    },
  ]);

  const todo = project.statuses[0];
  const doing = project.statuses[1];

  await Task.create({
    project: project._id,
    name: "Design project APIs",
    description: "Auth, projects, members, tasks",
    statusId: doing._id,
    priority: "high",
    assignees: [lead._id],
    watchers: [lead._id, admin._id],
    tags: ["api"],
    createdBy: admin._id,
    orderindex: 1,
  });

  await Task.create({
    project: project._id,
    name: "Invite flow + email",
    description: "Lead invites developers and QA",
    statusId: todo._id,
    priority: "urgent",
    assignees: [developer._id],
    watchers: [developer._id, lead._id],
    tags: ["email"],
    createdBy: lead._id,
    orderindex: 2,
  });

  console.log("\nSeeded users (password: password123):");
  console.log("  admin@flowdesk.app  → global admin");
  console.log("  lead@flowdesk.app   → project lead");
  console.log("  dev@flowdesk.app    → developer");
  console.log("  qa@flowdesk.app     → QA");
  console.log("Project:", project.name, project._id.toString());

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
