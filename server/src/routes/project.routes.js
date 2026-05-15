const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");

const {
  createProjectController,
  getAllProjectsController,
  getSingleProjectController,
  updateProjectController,
  deleteProjectController,
} = require("../controllers/project.controller");

const router = express.Router();

router.get("/", getAllProjectsController);
router.get("/:id", getSingleProjectController);

router.post("/", authMiddleware, createProjectController);
router.patch("/:id", authMiddleware, updateProjectController);
router.delete("/:id", authMiddleware, deleteProjectController);

module.exports = router;