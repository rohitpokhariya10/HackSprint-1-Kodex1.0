const mongoose = require("mongoose");
const profileModel = require("../models/profile.model");

// Allowed fields for profile update
const allowedProfileFields = [
  "headline",
  "bio",
  "avatar",
  "banner",
  "skills",
  "githubUsername",
  "location",
  "portfolioShowcase",
  "isOpenToWork",
  "profileVisibility",
];

// Helper function: only allowed fields update honi chahiye
const buildProfileUpdateData = (body) => {
  const updateData = {};

  // Normal fields
  allowedProfileFields.forEach((field) => {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  });

  // Nested socialLinks fields
  if (body.socialLinks) {
    if (body.socialLinks.github !== undefined) {
      updateData["socialLinks.github"] = body.socialLinks.github;
    }

    if (body.socialLinks.linkedin !== undefined) {
      updateData["socialLinks.linkedin"] = body.socialLinks.linkedin;
    }

    if (body.socialLinks.twitter !== undefined) {
      updateData["socialLinks.twitter"] = body.socialLinks.twitter;
    }

    if (body.socialLinks.portfolio !== undefined) {
      updateData["socialLinks.portfolio"] = body.socialLinks.portfolio;
    }
  }

  return updateData;
};

// POST /api/profiles
// Logged-in user ka profile create karega
const createProfileController = async (req, res) => {
  try {
    const userId = req.user._id;

    // Check profile already exists or not
    const existingProfile = await profileModel.findOne({ user: userId });

    if (existingProfile) {
      return res.status(409).json({
        success: false,
        message: "Profile already exists. Please update your profile instead.",
      });
    }

    const profileData = buildProfileUpdateData(req.body);

    const profile = await profileModel.create({
      user: userId,
      ...profileData,
    });

    const populatedProfile = await profileModel
      .findById(profile._id)
      .populate("user", "name email role");

    return res.status(201).json({
      success: true,
      message: "Profile created successfully.",
      data: populatedProfile,
    });
  } catch (error) {
    console.error("Create profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while creating profile.",
      error: error.message,
    });
  }
};

// GET /api/profiles/me
// Logged-in user ka profile fetch karega
const getMyProfileController = async (req, res) => {
  try {
    const profile = await profileModel
      .findOne({ user: req.user._id })
      .populate("user", "name email role");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please create your profile first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Get my profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile.",
      error: error.message,
    });
  }
};

// PATCH /api/profiles/me
// Logged-in user ka profile update karega
const updateMyProfileController = async (req, res) => {
  try {
    const updateData = buildProfileUpdateData(req.body);

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid field to update.",
      });
    }

    const profile = await profileModel
      .findOneAndUpdate(
        { user: req.user._id },
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      )
      .populate("user", "name email role");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please create your profile first.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while updating profile.",
      error: error.message,
    });
  }
};

// GET /api/profiles
// Public developer profiles list, search/filter ke saath
const getAllProfilesController = async (req, res) => {
  try {
    const {
      search,
      skill,
      openToWork,
      page = 1,
      limit = 10,
    } = req.query;

    const filter = {
      profileVisibility: "public",
    };

    // Skill filter
    if (skill) {
      filter.skills = {
        $in: [skill.toLowerCase()],
      };
    }

    // Open to work filter
    if (openToWork !== undefined) {
      filter.isOpenToWork = openToWork === "true";
    }

    // Text search
    if (search) {
      filter.$text = {
        $search: search,
      };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const profiles = await profileModel
      .find(filter)
      .populate("user", "name email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalProfiles = await profileModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      message: "Profiles fetched successfully.",
      count: profiles.length,
      totalProfiles,
      currentPage: Number(page),
      totalPages: Math.ceil(totalProfiles / Number(limit)),
      data: profiles,
    });
  } catch (error) {
    console.error("Get all profiles error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching profiles.",
      error: error.message,
    });
  }
};

// GET /api/profiles/:userId
// Kisi bhi user ka public profile fetch karega
const getProfileByUserIdController = async (req, res) => {
  try {
    const { userId } = req.params;

    // Invalid MongoDB id check
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user id.",
      });
    }

    const profile = await profileModel
      .findOne({
        user: userId,
        profileVisibility: "public",
      })
      .populate("user", "name email role");

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Get profile by user id error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching profile.",
      error: error.message,
    });
  }
};

module.exports = {
  createProfileController,
  getMyProfileController,
  updateMyProfileController,
  getAllProfilesController,
  getProfileByUserIdController,
};