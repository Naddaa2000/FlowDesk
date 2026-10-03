const express = require("express");
const { auth } = require("../middleware/auth");
const {
  requireProjectMember,
  requireProjectLead,
} = require("../middleware/projectAccess");
const {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  listMembers,
  addOrInviteMember,
  removeMember,
  addStatus,
  updateStatus,
  reorderStatuses,
  deleteStatus,
} = require("../controller/project");
const { listTasks, createTask } = require("../controller/task");

const router = express.Router();

router.use(auth);

// Any logged-in admin or member can create a project (creator becomes lead)
router.get("/", listProjects);
router.post("/", createProject);

router.get("/:projectId", requireProjectMember, getProject);
router.patch("/:projectId", requireProjectMember, updateProject);
router.delete("/:projectId", requireProjectLead, deleteProject);

router.get("/:projectId/members", requireProjectMember, listMembers);
router.post("/:projectId/members", requireProjectLead, addOrInviteMember);
router.delete("/:projectId/members/:userId", requireProjectLead, removeMember);

// Status groups: lead + admin only
router.post("/:projectId/statuses", requireProjectLead, addStatus);
router.put("/:projectId/statuses/reorder", requireProjectLead, reorderStatuses);
router.patch("/:projectId/statuses/:statusId", requireProjectLead, updateStatus);
router.delete("/:projectId/statuses/:statusId", requireProjectLead, deleteStatus);

router.get("/:projectId/tasks", requireProjectMember, listTasks);
router.post("/:projectId/tasks", requireProjectMember, createTask);

module.exports = router;
