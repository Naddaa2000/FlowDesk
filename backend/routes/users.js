const express = require("express");
const { auth } = require("../middleware/auth");
const { listUsers } = require("../controller/users");

const router = express.Router();
router.get("/", auth, listUsers);

module.exports = router;
