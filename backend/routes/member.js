const express = require("express");
const router = express.Router();
const Member = require("../controller/student");
router.get("/", Member.getMember);
router.get("/:id", Member.getSingleMember);
router.post("/", Member.createMember);
router.delete("/:id", Member.deleteMember);

module.exports = router;
