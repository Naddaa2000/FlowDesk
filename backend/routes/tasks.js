const express = require("express");
const { auth } = require("../middleware/auth");
const { requireTaskAccess } = require("../middleware/projectAccess");
const { upload } = require("../middleware/upload");
const {
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
} = require("../controller/task");

const router = express.Router();

router.use(auth);

router.get("/:taskId", requireTaskAccess, getTask);
router.patch("/:taskId", requireTaskAccess, updateTask);
router.delete("/:taskId", requireTaskAccess, deleteTask);
router.put("/:taskId/assignees", requireTaskAccess, assignTask);
router.post("/:taskId/move", requireTaskAccess, moveTask);

router.get("/:taskId/comments", requireTaskAccess, listComments);
router.post("/:taskId/comments", requireTaskAccess, createComment);
router.delete(
  "/:taskId/comments/:commentId",
  requireTaskAccess,
  deleteComment
);

router.get("/:taskId/attachments", requireTaskAccess, listAttachments);
router.post(
  "/:taskId/attachments",
  requireTaskAccess,
  upload.single("file"),
  uploadAttachment
);
router.delete(
  "/:taskId/attachments/:attachmentId",
  requireTaskAccess,
  deleteAttachment
);

router.get("/:taskId/activity", requireTaskAccess, listActivity);
router.get("/:taskId/subtasks", requireTaskAccess, listSubtasks);
router.post("/:taskId/subtasks", requireTaskAccess, createSubtask);
router.post("/:taskId/timer/start", requireTaskAccess, startTimer);
router.post("/:taskId/timer/stop", requireTaskAccess, stopTimer);

module.exports = router;
