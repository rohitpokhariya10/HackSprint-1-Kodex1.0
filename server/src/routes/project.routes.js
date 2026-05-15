const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const { optionalAuthMiddleware } = require("../middleware/auth.middleware");
const {
  uploadFields,
  handleUploadError,
} = require("../middleware/upload.middleware");

const {
  createProjectController,
  getAllProjectsController,
  getMyProjectsController,
  getSingleProjectController,
  updateProjectController,
  deleteProjectController,
} = require("../controllers/project.controller");

const router = express.Router();

router.get("/", getAllProjectsController);
router.get("/my", authMiddleware, getMyProjectsController);
router.get("/:id", optionalAuthMiddleware, getSingleProjectController);

router.post(
  "/",
  authMiddleware,
  handleUploadError(
    uploadFields([
      { name: "coverImage", maxCount: 1 },
      { name: "images", maxCount: 5 },
    ])
  ),
  createProjectController
);
router.patch(
  "/:id",
  authMiddleware,
  handleUploadError(
    uploadFields([
      { name: "coverImage", maxCount: 1 },
      { name: "images", maxCount: 5 },
    ])
  ),
  updateProjectController
);
router.delete("/:id", authMiddleware, deleteProjectController);

module.exports = router;
