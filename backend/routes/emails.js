const express = require("express");
const { auth } = require("../middleware/auth");
const { getRecentEmails } = require("../libs/utils/email");
const successResponse = require("../libs/responseMessage/success");

const router = express.Router();

/** Dev helper: list recent outbound emails + Ethereal preview links */
router.get("/", auth, (_req, res) => {
  return successResponse(res, "Recent emails", getRecentEmails());
});

module.exports = router;
