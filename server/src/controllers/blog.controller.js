const mongoose = require("mongoose");
const blogModel = require("../models/blog.model");
const slugify = require("../utils/slugify");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getLoggedInUserId = (req) => {
  return req.user?._id || req.user?.id || req.user?.userId;
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

const normalizeQueryValue = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const generateUniqueSlug = async (title, excludeBlogId = null) => {
  const baseSlug = slugify(title) || "blog";
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const query = excludeBlogId
      ? { slug, _id: { $ne: excludeBlogId } }
      : { slug };

    const existingBlog = await blogModel.findOne(query).select("_id");

    if (!existingBlog) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
};

// POST /api/blogs
const createBlogController = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    const {
      title,
      excerpt,
      content,
      contentFormat,
      coverImage,
      tags,
      category,
      status = "published",
    } = req.body;

    if (!title || !String(title).trim()) {
      return sendError(res, 400, "Blog title is required");
    }

    if (!content || !String(content).trim()) {
      return sendError(res, 400, "Blog content is required");
    }

    if (!category || !String(category).trim()) {
      return sendError(res, 400, "Blog category is required");
    }

    if (tags !== undefined && !Array.isArray(tags)) {
      return sendError(res, 400, "Tags must be an array");
    }

    if (!["draft", "published"].includes(status)) {
      return sendError(res, 400, "Status must be either draft or published");
    }

    const slug = await generateUniqueSlug(title);

    const blog = await blogModel.create({
      author: userId,
      title,
      slug,
      excerpt,
      content,
      contentFormat,
      coverImage,
      tags,
      category,
      status,
    });

    await blog.populate("author", "name email role");

    return sendSuccess(res, 201, "Blog created successfully", blog);
  } catch (error) {
    console.error("Error in createBlogController:", error);

    if (error.name === "ValidationError") {
      return sendError(res, 400, getValidationErrorMessage(error));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// GET /api/blogs
const getAllBlogsController = async (req, res) => {
  try {
    const {
      search,
      tag,
      category,
      sort = "latest",
      featured,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {
      status: "published",
    };

    const searchValue = search ? String(search).trim() : "";
    const tagValue = normalizeQueryValue(tag);
    const categoryValue = normalizeQueryValue(category);

    if (searchValue) {
      query.$text = { $search: searchValue };
    }

    if (tagValue) {
      query.tags = tagValue;
    }

    if (categoryValue) {
      query.category = categoryValue;
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    let sortOption;

    if (searchValue) {
      sortOption = { score: { $meta: "textScore" } };
    } else if (sort === "trending") {
      sortOption = { views: -1, likesCount: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const projection = searchValue
      ? { score: { $meta: "textScore" }, content: 0 }
      : { content: 0 };

    const blogsQuery = blogModel
      .find(query, projection)
      .populate("author", "name email role")
      .sort(sortOption)
      .skip(skip)
      .limit(limitNumber)
      .lean();

    const [blogs, totalBlogs] = await Promise.all([
      blogsQuery,
      blogModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogs / limitNumber);

    return sendSuccess(res, 200, "Blogs fetched successfully", blogs, {
      totalBlogs,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    });
  } catch (error) {
    console.error("Error in getAllBlogsController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /api/blogs/my
const getMyBlogsController = async (req, res) => {
  try {
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    const { status, page = 1, limit = 10 } = req.query;

    const pageNumber = Math.max(Number(page) || 1, 1);
    const limitNumber = Math.min(Math.max(Number(limit) || 10, 1), 50);
    const skip = (pageNumber - 1) * limitNumber;

    const query = {
      author: userId,
    };

    if (status && ["draft", "published"].includes(status)) {
      query.status = status;
    }

    const [blogs, totalBlogs] = await Promise.all([
      blogModel
        .find(query, { content: 0 })
        .populate("author", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      blogModel.countDocuments(query),
    ]);

    const totalPages = Math.ceil(totalBlogs / limitNumber);

    return sendSuccess(res, 200, "Your blogs fetched successfully", blogs, {
      totalBlogs,
      totalPages,
      currentPage: pageNumber,
      limit: limitNumber,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    });
  } catch (error) {
    console.error("Error in getMyBlogsController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /api/blogs/:idOrSlug
const getSingleBlogController = async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    if (!idOrSlug) {
      return sendError(res, 400, "Blog id or slug is required");
    }

    const identifierQuery = isValidObjectId(idOrSlug)
      ? { _id: idOrSlug }
      : { slug: String(idOrSlug).trim().toLowerCase() };

    const blog = await blogModel
      .findOneAndUpdate(
        {
          ...identifierQuery,
          status: "published",
        },
        {
          $inc: { views: 1 },
        },
        {
          returnDocument: "after",
        }
      )
      .populate("author", "name email role");

    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    return sendSuccess(res, 200, "Blog fetched successfully", blog);
  } catch (error) {
    console.error("Error in getSingleBlogController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// PATCH /api/blogs/:id
const updateBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid blog id");
    }

    const blog = await blogModel.findById(id);

    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    if (blog.author.toString() !== userId.toString()) {
      return sendError(res, 403, "You are not allowed to update this blog");
    }

    if (req.body.tags !== undefined && !Array.isArray(req.body.tags)) {
      return sendError(res, 400, "Tags must be an array");
    }

    if (
      req.body.status !== undefined &&
      !["draft", "published"].includes(req.body.status)
    ) {
      return sendError(res, 400, "Status must be either draft or published");
    }

    const allowedFields = [
      "excerpt",
      "content",
      "contentFormat",
      "coverImage",
      "tags",
      "category",
      "status",
    ];

    if (req.body.title !== undefined) {
      if (!String(req.body.title).trim()) {
        return sendError(res, 400, "Blog title cannot be empty");
      }

      blog.title = req.body.title;
      blog.slug = await generateUniqueSlug(req.body.title, blog._id);
    }

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        blog[field] = req.body[field];
      }
    });

    if (req.body.isFeatured !== undefined) {
      if (req.user?.role !== "admin") {
        return sendError(res, 403, "Only admin can mark blog as featured");
      }

      blog.isFeatured = req.body.isFeatured;
    }

    await blog.save();

    await blog.populate("author", "name email role");

    return sendSuccess(res, 200, "Blog updated successfully", blog);
  } catch (error) {
    console.error("Error in updateBlogController:", error);

    if (error.name === "ValidationError") {
      return sendError(res, 400, getValidationErrorMessage(error));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// DELETE /api/blogs/:id
const deleteBlogController = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getLoggedInUserId(req);

    if (!userId) {
      return sendError(res, 401, "Unauthorized access");
    }

    if (!isValidObjectId(id)) {
      return sendError(res, 400, "Invalid blog id");
    }

    const blog = await blogModel.findById(id);

    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    if (blog.author.toString() !== userId.toString()) {
      return sendError(res, 403, "You are not allowed to delete this blog");
    }

    await blog.deleteOne();

    return sendSuccess(res, 200, "Blog deleted successfully");
  } catch (error) {
    console.error("Error in deleteBlogController:", error);
    return sendError(res, 500, "Internal server error");
  }
};

module.exports = {
  createBlogController,
  getAllBlogsController,
  getMyBlogsController,
  getSingleBlogController,
  updateBlogController,
  deleteBlogController,
};