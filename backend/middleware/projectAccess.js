const Project = require("../models/Project");
const ProjectMember = require("../models/ProjectMember");
const Task = require("../models/Task");
const errorResponse = require("../libs/responseMessage/error");
const { GLOBAL_ROLE, PROJECT_ROLE, MEMBER_STATUS } = require("../libs/enum");

async function getMembership(projectId, userId) {
  return ProjectMember.findOne({
    project: projectId,
    user: userId,
    status: MEMBER_STATUS.ACTIVE,
  });
}

async function loadProjectAccess(req, projectId) {
  const project = await Project.findById(projectId);
  if (!project) return { error: "Project not found", code: 404 };

  if (req.user.role === GLOBAL_ROLE.ADMIN) {
    return {
      project,
      membership: { role: PROJECT_ROLE.LEAD, isAdmin: true },
      isLead: true,
    };
  }

  const membership = await getMembership(projectId, req.user._id);
  if (!membership) {
    return { error: "You are not a member of this project", code: 403 };
  }

  const isLead =
    membership.role === PROJECT_ROLE.LEAD ||
    String(project.lead) === String(req.user._id);

  return { project, membership, isLead };
}

const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return errorResponse(res, "projectId required", 400);

    const access = await loadProjectAccess(req, projectId);
    if (access.error) return errorResponse(res, access.error, access.code);

    req.project = access.project;
    req.membership = access.membership;
    req.isProjectLead = access.isLead;
    next();
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const requireProjectLead = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return errorResponse(res, "projectId required", 400);

    const access = await loadProjectAccess(req, projectId);
    if (access.error) return errorResponse(res, access.error, access.code);
    if (!access.isLead) {
      return errorResponse(res, "Only project lead or admin can do this", 403);
    }

    req.project = access.project;
    req.membership = access.membership;
    req.isProjectLead = true;
    next();
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

const requireTaskAccess = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return errorResponse(res, "Task not found", 404);

    const access = await loadProjectAccess(req, task.project);
    if (access.error) return errorResponse(res, access.error, access.code);

    req.task = task;
    req.project = access.project;
    req.membership = access.membership;
    req.isProjectLead = access.isLead;
    next();
  } catch (err) {
    return errorResponse(res, err.message, 500);
  }
};

module.exports = {
  getMembership,
  loadProjectAccess,
  requireProjectMember,
  requireProjectLead,
  requireTaskAccess,
};
