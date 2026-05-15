const mongoose = require("mongoose");
const projectModel = require("../models/project.model");
const parseArrayField = require("../utils/parseArrayField");
const escapeRegex = require("../utils/escapeRegex");
const {
  uploadBufferToImageKit,
  deleteFromImageKit,
  deleteManyFromImageKit,
} = require("../services/imagekit.service");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getLoggedInUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId;
};

const createSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
};

const sendSuccess = (res, statusCode, message, data = null, meta = null) => {
  const response = {
    success: true,
    message,
  };

  if (data !== null) response.data = data;
  if (meta !== null) response.meta = meta;

  return res.status(statusCode).json(response);
};

const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

const getValidationErrorMessage = (error) => {
  return Object.values(error.errors)
    .map((err) => err.message)
    .join(", ");
};

const buildProjectPayload = (body) => {
  const payload = { ...body };
  delete payload.coverImageFileId;
  delete payload.imageFileIds;

  if (payload.techStack !== undefined) {
    payload.techStack = parseArrayField(payload.techStack);
  }

  if (payload.images !== undefined) {
    payload.images = parseArrayField(payload.images);
  }

  return payload;
};

const applyProjectImageUploads = async (
  req,
  payload,
  existingProject = null,
  fileIdsToDelete = []
) => {
  const coverImageFile = req.files?.coverImage?.[0];
  const imageFiles = req.files?.images || [];

  if (coverImageFile) {
    try {
      const uploadedCover = await uploadBufferToImageKit(
        coverImageFile,
        "/devhub/projects/covers"
      );

      payload.coverImage = uploadedCover.url;
      payload.coverImageFileId = uploadedCover.fileId;

      if (existingProject?.coverImageFileId) {
        fileIdsToDelete.push(existingProject.coverImageFileId);
      }
    } catch (error) {
      console.warn("Project cover upload skipped:", error.message);
    }
  } else if (typeof req.body.coverImage === "string" && req.body.coverImage === "") {
    payload.coverImage = "";
    payload.coverImageFileId = "";
    if (existingProject?.coverImageFileId) {
      fileIdsToDelete.push(existingProject.coverImageFileId);
    }
  }

  if (imageFiles.length > 0) {
    const uploadResults = await Promise.allSettled(
      imageFiles.map((file) =>
        uploadBufferToImageKit(file, "/devhub/projects/gallery")
      )
    );
    const uploadedImages = uploadResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value);

    uploadResults
      .filter((result) => result.status === "rejected")
      .forEach((result) => {
        console.warn("Project gallery upload skipped:", result.reason?.message);
      });

    if (uploadedImages.length === 0) {
      return payload;
    }

    payload.images = uploadedImages.map((image) => image.url);
    payload.imageFileIds = uploadedImages.map((image) => image.fileId);

    if (existingProject?.imageFileIds?.length) {
      fileIdsToDelete.push(...existingProject.imageFileIds);
    }
  } else if (req.body.images !== undefined) {
    payload.imageFileIds = [];
    if (existingProject?.imageFileIds?.length) {
      fileIdsToDelete.push(...existingProject.imageFileIds);
    }
  }

  return payload;
};

// POST /api/projects
const createProjectController = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    const payload = await applyProjectImageUploads(req, buildProjectPayload(req.body));

    const {
      title,
      description,
      shortDescription,
      techStack,
      githubLink,
      liveLink,
      coverImage,
      images,
      category,
      status,
      coverImageFileId,
      imageFileIds,
    } = payload;

    if (!title || !description || !techStack) {
      return sendError(
        res,
        400,
        "Title, description and tech stack are required"
      );
    }

    if (!Array.isArray(techStack) || techStack.length === 0) {
      return sendError(res, 400, "Tech stack must be a non-empty array");
    }

    const project = await projectModel.create({
      owner: userId,
      title,
      description,
      shortDescription,
      techStack,
      githubLink,
      liveLink,
      coverImage,
      coverImageFileId,
      images,
      imageFileIds,
      category,
      status,
    });

    return sendSuccess(res, 201, "Project created successfully", project);
  } catch (error) {
    console.error("Error in createProjectController:", error);

    if (error.publicMessage) {
      return sendError(res, error.statusCode || 500, error.publicMessage);
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, getValidationErrorMessage(error));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// GET /api/projects
const getAllProjectsController = async (req, res) => {
  try {
    const {
      search,
      tech,
      sort = "latest",
      page = 1,
      limit = 10,
      status = "published",
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {};

    if (status) {
      query.status = status;
    }

    const searchValue = search ? String(search).trim() : "";

    if (searchValue) {
      const safeSearch = escapeRegex(searchValue);
      query.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { description: { $regex: safeSearch, $options: "i" } },
        { shortDescription: { $regex: safeSearch, $options: "i" } },
        { techStack: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (tech) {
      const safeTech = escapeRegex(String(tech).trim().toLowerCase());
      if (safeTech) {
        query.techStack = { $regex: safeTech, $options: "i" };
      }
    }

    if (process.env.NODE_ENV !== "production" && process.env.DEBUG_API === "true") {
      console.log("PROJECT SEARCH:", { search, tech, sort, query });
    }

    let sortOption = {};

    if (sort === "trending") {
      sortOption = { views: -1, likesCount: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const projectsQuery = projectModel
      .find(query)
      .populate("owner", "name email")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber);

    const [projects, totalProjects] = await Promise.all([
      projectsQuery,
      projectModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalProjects / limitNumber);

    return sendSuccess(res, 200, "Projects fetched successfully", projects, {
      totalProjects,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    });
  } catch (error) {
    console.error("Error in getAllProjectsController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /api/projects/my
const getMyProjectsController = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const query = { owner: userId };

    if (status && ["draft", "published"].includes(status)) {
      query.status = status;
    }

    const [projects, totalProjects] = await Promise.all([
      projectModel
        .find(query)
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber),
      projectModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalProjects / limitNumber);

    return sendSuccess(res, 200, "Your projects fetched successfully", projects, {
      totalProjects,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    });
  } catch (error) {
    console.error("Error in getMyProjectsController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /api/projects/:id
const getSingleProjectController = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid project id");
    }

    const project = await projectModel
      .findById(id)
      .populate("owner", "name email");

    if (!project) {
      return sendError(res, 404, "Project not found");
    }

    if (project.status !== "published") {
      const userId = getLoggedInUserId(req);

      if (!userId || project.owner._id.toString() !== userId.toString()) {
        return sendError(res, 404, "Project not found");
      }
    }

    project.views += 1;
    await project.save();

    return sendSuccess(res, 200, "Project fetched successfully", project);
  } catch (error) {
    console.error("Error in getSingleProjectController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// PATCH /api/projects/:id
const updateProjectController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid project id");
    }

    const project = await projectModel
      .findById(id)
      .select("+coverImageFileId +imageFileIds");

    if (!project) {
      return sendError(res, 404, "Project not found");
    }

    if (project.owner.toString() !== userId.toString()) {
      return sendError(res, 403, "You are not allowed to update this project");
    }

    const allowedFields = [
      "title",
      "description",
      "shortDescription",
      "techStack",
      "githubLink",
      "liveLink",
      "coverImage",
      "images",
      "category",
      "status",
    ];

    const oldFileIdsToDelete = [];
    const payload = await applyProjectImageUploads(
      req,
      buildProjectPayload(req.body),
      project,
      oldFileIdsToDelete
    );

    if (payload.isFeatured !== undefined) {
      if (req.user?.role !== "admin") {
        return sendError(res, 403, "Only admin can mark project as featured");
      }

      project.isFeatured = payload.isFeatured;
    }

    allowedFields.push("coverImageFileId", "imageFileIds");

    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        project[field] = payload[field];
      }
    });

    if (payload.title) {
      project.slug = createSlug(payload.title);
    }

    await project.save();
    await deleteManyFromImageKit(oldFileIdsToDelete);

    return sendSuccess(res, 200, "Project updated successfully", project);
  } catch (error) {
    console.error("Error in updateProjectController:", error);

    if (error.publicMessage) {
      return sendError(res, error.statusCode || 500, error.publicMessage);
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, getValidationErrorMessage(error));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// DELETE /api/projects/:id
const deleteProjectController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid project id");
    }

    const project = await projectModel
      .findById(id)
      .select("+coverImageFileId +imageFileIds");

    if (!project) {
      return sendError(res, 404, "Project not found");
    }

    if (project.owner.toString() !== userId.toString()) {
      return sendError(res, 403, "You are not allowed to delete this project");
    }

    await project.deleteOne();
    await deleteFromImageKit(project.coverImageFileId);
    await deleteManyFromImageKit(project.imageFileIds);

    return sendSuccess(res, 200, "Project deleted successfully");
  } catch (error) {
    console.error("Error in deleteProjectController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

module.exports = {
  createProjectController,
  getAllProjectsController,
  getMyProjectsController,
  getSingleProjectController,
  updateProjectController,
  deleteProjectController,
};
