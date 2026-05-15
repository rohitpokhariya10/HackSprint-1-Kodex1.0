const mongoose = require("mongoose");
const projectModel = require("../models/project.model");

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

// POST /api/projects
const createProjectController = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

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
    } = req.body;

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
      images,
      category,
      status,
    });

    return sendSuccess(res, 201, "Project created successfully", project);
  } catch (error) {
    console.error("Error in createProjectController:", error);

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return sendError(res, 400, message);
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

    if (search) {
      query.$text = { $search: search };
    }

    if (tech) {
      query.techStack = tech.trim().toLowerCase();
    }

    let sortOption = {};

    if (search) {
      sortOption.score = { $meta: "textScore" };
    } else if (sort === "trending") {
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

    if (search) {
      projectsQuery.select({ score: { $meta: "textScore" } });
    }

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

    const project = await projectModel.findById(id);

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
      "isFeatured",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        project[field] = req.body[field];
      }
    });

    if (req.body.title) {
      project.slug = createSlug(req.body.title);
    }

    await project.save();

    return sendSuccess(res, 200, "Project updated successfully", project);
  } catch (error) {
    console.error("Error in updateProjectController:", error);

    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");

      return sendError(res, 400, message);
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

    const project = await projectModel.findById(id);

    if (!project) {
      return sendError(res, 404, "Project not found");
    }

    if (project.owner.toString() !== userId.toString()) {
      return sendError(res, 403, "You are not allowed to delete this project");
    }

    await project.deleteOne();

    return sendSuccess(res, 200, "Project deleted successfully");
  } catch (error) {
    console.error("Error in deleteProjectController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

module.exports = {
  createProjectController,
  getAllProjectsController,
  getSingleProjectController,
  updateProjectController,
  deleteProjectController,
};