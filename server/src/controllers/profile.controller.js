const mongoose = require("mongoose");
const profileModel = require("../models/profile.model");
const parseArrayField = require("../utils/parseArrayField");
const escapeRegex = require("../utils/escapeRegex");
const {
  uploadBufferToImageKit,
  deleteManyFromImageKit,
} = require("../services/imagekit.service");

// Allowed fields for profile update
const allowedProfileFields = [
  "headline",
  "bio",
  "avatar",
  "banner",
  "skills",
  "githubUsername",
  "location",
  "socialLinks",
  "portfolioShowcase",
  "isOpenToWork",
  "profileVisibility",
];

// Helper function: only allowed fields update honi chahiye
const buildProfileUpdateData = (body) => {
  const updateData = {};
  const sourceBody = { ...body };

  if (sourceBody.skills !== undefined) {
    sourceBody.skills = parseArrayField(sourceBody.skills);
  }

  if (typeof sourceBody.socialLinks === "string") {
    try {
      sourceBody.socialLinks = JSON.parse(sourceBody.socialLinks);
    } catch (error) {
      sourceBody.socialLinks = null;
    }
  }

  if (typeof sourceBody.portfolioShowcase === "string") {
    try {
      sourceBody.portfolioShowcase = JSON.parse(sourceBody.portfolioShowcase);
    } catch (error) {
      sourceBody.portfolioShowcase = [];
    }
  }

  if (typeof sourceBody.isOpenToWork === "string") {
    sourceBody.isOpenToWork = sourceBody.isOpenToWork === "true";
  }

  // Normal fields
  allowedProfileFields.forEach((field) => {
    if (sourceBody[field] !== undefined) {
      updateData[field] = sourceBody[field];
    }
  });

  // Nested socialLinks fields
  if (sourceBody.socialLinks && typeof sourceBody.socialLinks === "object") {
    if (sourceBody.socialLinks.github !== undefined) {
      updateData["socialLinks.github"] = sourceBody.socialLinks.github;
    }

    if (sourceBody.socialLinks.linkedin !== undefined) {
      updateData["socialLinks.linkedin"] = sourceBody.socialLinks.linkedin;
    }

    if (sourceBody.socialLinks.twitter !== undefined) {
      updateData["socialLinks.twitter"] = sourceBody.socialLinks.twitter;
    }

    if (sourceBody.socialLinks.portfolio !== undefined) {
      updateData["socialLinks.portfolio"] = sourceBody.socialLinks.portfolio;
    }
  }

  return updateData;
};

const applyProfileImageUploads = async (
  req,
  updateData,
  existingProfile = null,
  fileIdsToDelete = []
) => {
  const avatarFile = req.files?.avatar?.[0];
  const bannerFile = req.files?.banner?.[0];

  if (avatarFile) {
    try {
      const uploadedAvatar = await uploadBufferToImageKit(
        avatarFile,
        "/devhub/profiles/avatars"
      );

      updateData.avatar = uploadedAvatar.url;
      updateData.avatarFileId = uploadedAvatar.fileId;

      if (existingProfile?.avatarFileId) {
        fileIdsToDelete.push(existingProfile.avatarFileId);
      }
    } catch (error) {
      console.warn("Avatar upload skipped:", error.message);
    }
  } else if (typeof req.body.avatar === "string") {
    updateData.avatarFileId = "";
    if (existingProfile?.avatarFileId) {
      fileIdsToDelete.push(existingProfile.avatarFileId);
    }
  }

  if (bannerFile) {
    try {
      const uploadedBanner = await uploadBufferToImageKit(
        bannerFile,
        "/devhub/profiles/banners"
      );

      updateData.banner = uploadedBanner.url;
      updateData.bannerFileId = uploadedBanner.fileId;

      if (existingProfile?.bannerFileId) {
        fileIdsToDelete.push(existingProfile.bannerFileId);
      }
    } catch (error) {
      console.warn("Banner upload skipped:", error.message);
    }
  } else if (typeof req.body.banner === "string") {
    updateData.bannerFileId = "";
    if (existingProfile?.bannerFileId) {
      fileIdsToDelete.push(existingProfile.bannerFileId);
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

    const profileData = await applyProfileImageUploads(
      req,
      buildProfileUpdateData(req.body)
    );

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

    if (error.publicMessage) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.publicMessage,
      });
    }

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
      return res.status(200).json({
        success: true,
        message: "Profile not created yet.",
        data: null,
        meta: {
          profileExists: false,
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile fetched successfully.",
      data: profile,
      meta: {
        profileExists: true,
      },
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
    const existingProfile = await profileModel
      .findOne({ user: req.user._id })
      .select("+avatarFileId +bannerFileId");

    if (!existingProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found. Please create your profile first.",
      });
    }

    const oldFileIdsToDelete = [];
    const updateData = await applyProfileImageUploads(
      req,
      buildProfileUpdateData(req.body),
      existingProfile,
      oldFileIdsToDelete
    );

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one valid field to update.",
      });
    }

    const profile = await profileModel
      .findByIdAndUpdate(
        existingProfile._id,
        { $set: updateData },
        {
          new: true,
          runValidators: true,
        }
      )
      .populate("user", "name email role");

    await deleteManyFromImageKit(oldFileIdsToDelete);

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      data: profile,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    if (error.publicMessage) {
      return res.status(error.statusCode || 500).json({
        success: false,
        message: error.publicMessage,
      });
    }

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
      const safeSkill = escapeRegex(String(skill).trim().toLowerCase());
      if (safeSkill) {
        filter.skills = { $regex: safeSkill, $options: "i" };
      }
    }

    // Open to work filter
    if (openToWork !== undefined) {
      filter.isOpenToWork = openToWork === "true";
    }

    const searchValue = search ? String(search).trim() : "";

    if (searchValue) {
      const safeSearch = escapeRegex(searchValue);
      filter.$or = [
        { headline: { $regex: safeSearch, $options: "i" } },
        { bio: { $regex: safeSearch, $options: "i" } },
        { skills: { $regex: safeSearch, $options: "i" } },
        { githubUsername: { $regex: safeSearch, $options: "i" } },
        { location: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (process.env.NODE_ENV !== "production" && process.env.DEBUG_API === "true") {
      console.log("PROFILE SEARCH:", { search, skill, openToWork, filter });
    }

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const sortOption = { createdAt: -1 };

    const profilesQuery = profileModel
      .find(filter)
      .populate("user", "name email role")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const profiles = await profilesQuery;

    const totalProfiles = await profileModel.countDocuments(filter);
    const totalPages = Math.ceil(totalProfiles / limitNumber);

    return res.status(200).json({
      success: true,
      message: "Profiles fetched successfully.",
      count: profiles.length,
      totalProfiles,
      currentPage: pageNumber,
      totalPages,
      meta: {
        totalProfiles,
        totalPages,
        currentPage: pageNumber,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      },
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
