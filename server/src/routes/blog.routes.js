const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");

const {
  createBlogController,
  getAllBlogsController,
  getMyBlogsController,
  getSingleBlogController,
  updateBlogController,
  deleteBlogController,
} = require("../controllers/blog.controller");

const router = express.Router();

// Public list
router.get("/", getAllBlogsController);

// Protected: logged-in user's blogs
router.get("/my", authMiddleware, getMyBlogsController);

// Public dynamic blog page
router.get("/:idOrSlug", getSingleBlogController);

// Protected CRUD
router.post("/", authMiddleware, createBlogController);
router.patch("/:id", authMiddleware, updateBlogController);
router.delete("/:id", authMiddleware, deleteBlogController);

module.exports = router;