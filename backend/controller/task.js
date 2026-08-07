const Task = require("../models/Task");
const Comment = require("../models/Comment");
const Attachment = require("../models/Attachment");
const Activity = require("../models/Activity");
const ProjectMember = require("../models/ProjectMember");
const User = require("../models/User");
const successResponse = require("../libs/responseMessage/success");
const errorResponse = require("../libs/responseMessage/error");
const { sendEmail } = require("../libs/utils/email");
const { MEMBER_STATUS } = require("../libs/enum");
const { publicUser } = require("./auth");

function serializeChecklist(cl) {
  return {
    id: String(cl._id),
    name: cl.name,
    items: (cl.items || []).map((item) => ({
      id: String(item._id),
      name: item.name,
      resolved: item.resolved,
      assigneeId: item.assignee ? String(item.assignee) : null,
    })),
  };
}

function serializeTask(task) {
  return {
    id: String(task._id),
    projectId: String(task.project?._id || task.project),
    name: task.name,
    description: task.description || "",
    statusId: String(task.statusId),
    priority: task.priority,
    assignees: (task.assignees || []).map((a) =>
      a?.email ? publicUser(a) : { id: String(a) }
    ),
    assigneeIds: (task.assignees || []).map((a) => String(a._id || a)),
    watchers: (task.watchers || []).map((a) => String(a._id || a)),
    tags: task.tags || [],
    dueDate: task.dueDate,
    startDate: task.startDate,
    timeEstimate: task.timeEstimate ?? null,
    timeSpent: task.timeSpent || 0,
    timerStartedAt: task.timerStartedAt,
    points: task.points ?? null,
    parentId: task.parent ? String(task.parent) : null,
    orderindex: task.orderindex,
    createdBy: String(task.createdBy?._id || task.createdBy),
    checklists: (task.checklists || []).map(serializeChecklist),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function logActivity(taskId, userId, action, detail = "") {
  try {
    await Activity.create({ task: taskId, user: userId, action, detail });
  } catch (err) {
    console.error("activity log failed", err.message);
  }
}

async function assertAssigneesAreMembers(projectId, assigneeIds = []) {
  if (!assigneeIds.length) return;
  const count = await ProjectMember.countDocuments({
    project: projectId,
    user: { $in: assigneeIds },
    status: MEMBER_STATUS.ACTIVE,
  });
  if (count !== assigneeIds.length) {
    throw new Error("Assignees must be active members of this project");
  }
}

async function notifyUsers(userIds, subject, text, { excludeUserId } = {}) {
  const unique = [
    ...new Set(
      userIds
        .map(String)
        .filter(Boolean)
        .filter((id) => !excludeUserId || id !== String(excludeUserId))
    ),
  ];
  if (!unique.length) return;
  const users = await User.find({ _id: { $in: unique } });
  await Promise.all(
    users.map((u) =>
      sendEmail({
        to: u.email,
        subject,
        text,
        html: `<p>${text.replace(/\n/g, "<br/>")}</p><p style="color:#64748b;font-size:12px">FlowDesk notification</p>`,
      })
    )
  );
}

const listTasks = async (req, res) => {
  try {
    const filter = { project: req.params.projectId, parent: null };
    if (req.query.statusId) filter.statusId = req.query.statusId;
    if (req.query.q) {
      filter.name = { $regex: req.query.q, $options: "i" };
    }

    const tasks = await Task.find(filter)
      .populate("assignees")
      .sort({ orderindex: 1, createdAt: -1 });

    return successResponse(res, "Tasks", tasks.map(serializeTask));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createTask = async (req, res) => {
  try {
    const {
      name,
      description,
      statusId,
      priority,
      assignees = [],
      tags = [],
      dueDate,
      startDate,
      parentId,
    } = req.body;

    if (!name?.trim()) return errorResponse(res, "Task name is required", 400);

    const project = req.project;
    const status =
      project.statuses.id(statusId) ||
      project.statuses.find((s) => String(s._id) === String(statusId)) ||
      project.statuses[0];

    if (!status) return errorResponse(res, "No statuses on project", 400);

    await assertAssigneesAreMembers(project._id, assignees);

    const count = await Task.countDocuments({ project: project._id });
    const task = await Task.create({
      project: project._id,
      name: name.trim(),
      description: description || "",
      statusId: status._id,
      priority: priority || "normal",
      assignees,
      watchers: [...new Set([String(req.user._id), ...assignees.map(String)])],
      tags,
      dueDate: dueDate || null,
      startDate: startDate || null,
      parent: parentId || null,
      orderindex: count + 1,
      createdBy: req.user._id,
    });

    await task.populate("assignees");

    await notifyUsers(
      assignees,
      `Assigned: ${task.name}`,
      `You were assigned to "${task.name}" in project "${project.name}".\n\nOpened by ${req.user.name}.`,
      { excludeUserId: req.user._id }
    );

    await logActivity(task._id, req.user._id, "created", "created this task");
    if (assignees.length) {
      await logActivity(
        task._id,
        req.user._id,
        "assigned",
        `assigned ${assignees.length} member(s)`
      );
    }

    // Also email project lead when someone else creates a task
    if (String(project.lead) !== String(req.user._id)) {
      await notifyUsers(
        [project.lead],
        `New task in ${project.name}`,
        `${req.user.name} created "${task.name}" in ${project.name}.`,
        { excludeUserId: req.user._id }
      );
    }

    return successResponse(res, "Task created", serializeTask(task), 201);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId).populate("assignees");
    if (!task) return errorResponse(res, "Task not found", 404);
    return successResponse(res, "Task", serializeTask(task));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const updateTask = async (req, res) => {
  try {
    const task = req.task;
    const allowed = [
      "name",
      "description",
      "priority",
      "tags",
      "dueDate",
      "startDate",
      "orderindex",
      "checklists",
      "timeEstimate",
      "points",
    ];

    const changes = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
        changes.push(key);
      }
    }

    if (req.body.statusId) {
      const status =
        req.project.statuses.id(req.body.statusId) ||
        req.project.statuses.find((s) => String(s._id) === String(req.body.statusId));
      if (!status) return errorResponse(res, "Invalid status", 400);
      if (String(task.statusId) !== String(status._id)) {
        changes.push("status");
        await logActivity(
          task._id,
          req.user._id,
          "status_changed",
          `changed status to ${status.name}`
        );
      }
      task.statusId = status._id;
    }

    if (req.body.assignees) {
      await assertAssigneesAreMembers(task.project, req.body.assignees);
      const prev = new Set(task.assignees.map(String));
      const next = req.body.assignees.map(String);
      task.assignees = req.body.assignees;
      task.watchers = [
        ...new Set([...(task.watchers || []).map(String), ...next]),
      ];

      const newly = next.filter((id) => !prev.has(id));
      await notifyUsers(
        newly,
        `Assigned: ${task.name}`,
        `You were assigned to "${task.name}" by ${req.user.name}.`,
        { excludeUserId: req.user._id }
      );
      if (newly.length) {
        await logActivity(
          task._id,
          req.user._id,
          "assigned",
          `assigned to ${newly.length} member(s)`
        );
      }
    }

    await task.save();
    await task.populate("assignees");
    if (changes.length && !changes.includes("status")) {
      await logActivity(
        task._id,
        req.user._id,
        "updated",
        `updated ${changes.join(", ")}`
      );
    }
    return successResponse(res, "Task updated", serializeTask(task));
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};

const deleteTask = async (req, res) => {
  try {
    await Comment.deleteMany({ task: req.task._id });
    await Attachment.deleteMany({ task: req.task._id });
    await Activity.deleteMany({ task: req.task._id });
    await Task.deleteMany({ parent: req.task._id });
    await Task.findByIdAndDelete(req.task._id);
    return successResponse(res, "Task deleted", null);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const assignTask = async (req, res) => {
  try {
    const { assigneeIds = [] } = req.body;
    await assertAssigneesAreMembers(req.task.project, assigneeIds);

    const prev = new Set(req.task.assignees.map(String));
    req.task.assignees = assigneeIds;
    req.task.watchers = [
      ...new Set([...(req.task.watchers || []).map(String), ...assigneeIds.map(String)]),
    ];
    await req.task.save();
    await req.task.populate("assignees");

    const newly = assigneeIds.map(String).filter((id) => !prev.has(id));
    await notifyUsers(
      newly,
      `Assigned: ${req.task.name}`,
      `You were assigned to "${req.task.name}" by ${req.user.name}.`,
      { excludeUserId: req.user._id }
    );
    if (newly.length) {
      await logActivity(
        req.task._id,
        req.user._id,
        "assigned",
        `assigned to ${newly.length} member(s)`
      );
    }

    return successResponse(res, "Assignees updated", serializeTask(req.task));
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
};

const moveTask = async (req, res) => {
  try {
    const { statusId, orderindex } = req.body;
    if (statusId) {
      const status =
        req.project.statuses.id(statusId) ||
        req.project.statuses.find((s) => String(s._id) === String(statusId));
      if (!status) return errorResponse(res, "Invalid status", 400);
      const prev = String(req.task.statusId);
      req.task.statusId = status._id;
      if (prev !== String(statusId)) {
        await notifyUsers(
          [...req.task.assignees, ...req.task.watchers, req.task.createdBy],
          `Status updated: ${req.task.name}`,
          `"${req.task.name}" was moved to "${status.name}" by ${req.user.name}.`,
          { excludeUserId: req.user._id }
        );
        await logActivity(
          req.task._id,
          req.user._id,
          "status_changed",
          `changed status to ${status.name}`
        );
      }
    }
    if (orderindex !== undefined) req.task.orderindex = orderindex;
    await req.task.save();
    await req.task.populate("assignees");
    return successResponse(res, "Task moved", serializeTask(req.task));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const listComments = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.taskId })
      .populate("user")
      .populate("mentions")
      .sort({ createdAt: 1 });
    return successResponse(
      res,
      "Comments",
      comments.map((c) => ({
        id: c._id,
        taskId: c.task,
        text: c.text,
        resolved: c.resolved,
        mentions: (c.mentions || []).map((m) =>
          m?.email ? publicUser(m) : { id: String(m) }
        ),
        mentionIds: (c.mentions || []).map((m) => String(m._id || m)),
        user: publicUser(c.user),
        createdAt: c.createdAt,
      }))
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createComment = async (req, res) => {
  try {
    const { text, mentionIds = [] } = req.body;
    if (!text?.trim()) return errorResponse(res, "Comment text required", 400);

    // Resolve @mentions from IDs and/or @Name tokens in text
    const members = await ProjectMember.find({
      project: req.task.project,
      status: MEMBER_STATUS.ACTIVE,
    }).populate("user");

    const byId = new Map(
      members.map((m) => [String(m.user._id), m.user])
    );
    const byName = new Map(
      members.map((m) => [m.user.name.toLowerCase(), m.user])
    );

    const resolvedMentions = new Set(
      (mentionIds || []).map(String).filter((id) => byId.has(id))
    );

    const atMatches = text.match(/@([A-Za-z0-9._ -]+)/g) || [];
    for (const raw of atMatches) {
      const name = raw.slice(1).trim().toLowerCase();
      // try full name, then first name
      const user =
        byName.get(name) ||
        [...byName.entries()].find(([n]) => n.startsWith(name) || n.split(" ")[0] === name)?.[1];
      if (user) resolvedMentions.add(String(user._id));
    }

    const mentionList = [...resolvedMentions];

    const comment = await Comment.create({
      task: req.task._id,
      user: req.user._id,
      text: text.trim(),
      mentions: mentionList,
    });
    await comment.populate("user");
    await comment.populate("mentions");

    // Watchers / assignees get comment email
    const recipients = [...req.task.assignees, ...req.task.watchers]
      .map(String)
      .filter((id) => id !== String(req.user._id));
    await notifyUsers(
      recipients,
      `Comment on ${req.task.name}`,
      `${req.user.name} commented on "${req.task.name}":\n\n${text.trim()}`,
      { excludeUserId: req.user._id }
    );

    // Mentioned people get a dedicated mention email
    if (mentionList.length) {
      await notifyUsers(
        mentionList,
        `You were mentioned on ${req.task.name}`,
        `${req.user.name} mentioned you on "${req.task.name}":\n\n${text.trim()}`,
        { excludeUserId: req.user._id }
      );
      // Add mentioned users as watchers
      req.task.watchers = [
        ...new Set([...(req.task.watchers || []).map(String), ...mentionList]),
      ];
      await req.task.save();
    }

    await logActivity(
      req.task._id,
      req.user._id,
      mentionList.length ? "mentioned" : "commented",
      text.trim().slice(0, 120)
    );

    return successResponse(
      res,
      "Comment created",
      {
        id: comment._id,
        taskId: comment.task,
        text: comment.text,
        resolved: comment.resolved,
        mentions: (comment.mentions || []).map(publicUser),
        mentionIds: mentionList,
        user: publicUser(comment.user),
        createdAt: comment.createdAt,
      },
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return errorResponse(res, "Comment not found", 404);
    if (
      String(comment.user) !== String(req.user._id) &&
      !req.isProjectLead &&
      req.user.role !== "admin"
    ) {
      return errorResponse(res, "Not allowed to delete this comment", 403);
    }
    await comment.deleteOne();
    return successResponse(res, "Comment deleted", null);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const listAttachments = async (req, res) => {
  try {
    const files = await Attachment.find({ task: req.params.taskId }).populate(
      "uploadedBy"
    );
    return successResponse(
      res,
      "Attachments",
      files.map((f) => ({
        id: f._id,
        taskId: f.task,
        originalName: f.originalName,
        url: f.url,
        mimeType: f.mimeType,
        size: f.size,
        uploadedBy: publicUser(f.uploadedBy),
        createdAt: f.createdAt,
      }))
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const uploadAttachment = async (req, res) => {
  try {
    if (!req.file) return errorResponse(res, "File required", 400);

    const url = `/uploads/${req.file.filename}`;
    const attachment = await Attachment.create({
      task: req.task._id,
      uploadedBy: req.user._id,
      originalName: req.file.originalname,
      filename: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url,
    });
    await attachment.populate("uploadedBy");

    return successResponse(
      res,
      "Attachment uploaded",
      {
        id: attachment._id,
        taskId: attachment.task,
        originalName: attachment.originalName,
        url: attachment.url,
        mimeType: attachment.mimeType,
        size: attachment.size,
        uploadedBy: publicUser(attachment.uploadedBy),
        createdAt: attachment.createdAt,
      },
      201
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const file = await Attachment.findById(req.params.attachmentId);
    if (!file) return errorResponse(res, "Attachment not found", 404);

    const task = await Task.findById(file.task);
    if (!task) return errorResponse(res, "Task not found", 404);

    await file.deleteOne();
    return successResponse(res, "Attachment deleted", null);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const listActivity = async (req, res) => {
  try {
    const rows = await Activity.find({ task: req.params.taskId })
      .populate("user")
      .sort({ createdAt: -1 })
      .limit(100);
    return successResponse(
      res,
      "Activity",
      rows.map((a) => ({
        id: String(a._id),
        action: a.action,
        detail: a.detail,
        user: publicUser(a.user),
        createdAt: a.createdAt,
      }))
    );
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const listSubtasks = async (req, res) => {
  try {
    const subtasks = await Task.find({ parent: req.params.taskId })
      .populate("assignees")
      .sort({ orderindex: 1 });
    return successResponse(res, "Subtasks", subtasks.map(serializeTask));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const createSubtask = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return errorResponse(res, "Subtask name required", 400);

    const parent = req.task;
    const status = req.project.statuses.id(parent.statusId) || req.project.statuses[0];
    const count = await Task.countDocuments({ parent: parent._id });

    const subtask = await Task.create({
      project: parent.project,
      name: name.trim(),
      description: "",
      statusId: status._id,
      priority: null,
      assignees: [],
      watchers: [req.user._id],
      parent: parent._id,
      orderindex: count + 1,
      createdBy: req.user._id,
    });

    await logActivity(parent._id, req.user._id, "subtask_added", `added subtask "${name.trim()}"`);
    return successResponse(res, "Subtask created", serializeTask(subtask), 201);
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const startTimer = async (req, res) => {
  try {
    if (req.task.timerStartedAt) {
      return errorResponse(res, "Timer already running", 400);
    }
    req.task.timerStartedAt = new Date();
    await req.task.save();
    await logActivity(req.task._id, req.user._id, "timer_started", "started tracking time");
    return successResponse(res, "Timer started", serializeTask(req.task));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const stopTimer = async (req, res) => {
  try {
    if (!req.task.timerStartedAt) {
      return errorResponse(res, "No timer running", 400);
    }
    const elapsed = Date.now() - new Date(req.task.timerStartedAt).getTime();
    req.task.timeSpent = (req.task.timeSpent || 0) + elapsed;
    req.task.timerStartedAt = null;
    await req.task.save();
    await logActivity(
      req.task._id,
      req.user._id,
      "timer_stopped",
      `tracked ${Math.round(elapsed / 60000)} min`
    );
    return successResponse(res, "Timer stopped", serializeTask(req.task));
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  assignTask,
  moveTask,
  listComments,
  createComment,
  deleteComment,
  listAttachments,
  uploadAttachment,
  deleteAttachment,
  listActivity,
  listSubtasks,
  createSubtask,
  startTimer,
  stopTimer,
  serializeTask,
};
