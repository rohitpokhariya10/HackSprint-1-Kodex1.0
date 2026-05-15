const express = require("express");

const {
  createProfileController,
  getMyProfileController,
  updateMyProfileController,
  getAllProfilesController,
  getProfileByUserIdController,
} = require("../controllers/profile.controller");

const authMiddleware = require("../middleware/auth.middleware");
const {
  uploadFields,
  handleUploadError,
} = require("../middleware/upload.middleware");

const router = express.Router();

/*
  @route   POST /api/profiles
  @desc    Create logged-in user's profile
  @access  Private
*/
router.post(
  "/",
  authMiddleware,
  handleUploadError(
    uploadFields([
      { name: "avatar", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ])
  ),
  createProfileController
);

/*
  @route   GET /api/profiles/me
  @desc    Get logged-in user's own profile
  @access  Private
*/
router.get("/me", authMiddleware, getMyProfileController);

/*
  @route   PATCH /api/profiles/me
  @desc    Update logged-in user's own profile
  @access  Private
*/
router.patch(
  "/me",
  authMiddleware,
  handleUploadError(
    uploadFields([
      { name: "avatar", maxCount: 1 },
      { name: "banner", maxCount: 1 },
    ])
  ),
  updateMyProfileController
);

/*
  @route   GET /api/profiles
  @desc    Get all public developer profiles
  @access  Public
*/
router.get("/", getAllProfilesController);

/*
  @route   GET /api/profiles/:userId
  @desc    Get public profile by user id
  @access  Public
*/
router.get("/:userId", getProfileByUserIdController);

module.exports = router;
