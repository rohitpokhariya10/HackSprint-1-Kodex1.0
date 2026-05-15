const mongoose = require("mongoose");
const blogModel = require("../models/blog.model");
const slugify = require("../utils/slugify");
const parseArrayField = require("../utils/parseArrayField");
const escapeRegex = require("../utils/escapeRegex");
const {
  uploadBufferToImageKit,
  deleteFromImageKit,
} = require("../services/imagekit.service");

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

const isDuplicateKeyError = (error) => error?.code === 11000;

const getDuplicateKeyMessage = (error) => {
  const duplicateFields = Object.keys(error?.keyPattern || error?.keyValue || {});

  if (duplicateFields.includes("slug")) {
    return "A blog with this title already exists. Please change the title slightly.";
  }

  return "Duplicate blog data found. Please change the details and try again.";
};

const normalizeQueryValue = (value) => {
  if (!value) return "";
  return String(value).trim().toLowerCase();
};

const buildBlogPayload = (body) => {
  const payload = { ...body };
  delete payload.coverImageFileId;

  if (payload.tags !== undefined) {
    payload.tags = parseArrayField(payload.tags);
  }

  return payload;
};

const applyBlogCoverUpload = async (
  req,
  payload,
  existingBlog = null,
  fileIdsToDelete = []
) => {
  if (req.file) {
    try {
      const uploadedCover = await uploadBufferToImageKit(
        req.file,
        "/devhub/blogs/covers"
      );

      payload.coverImage = uploadedCover.url;
      payload.coverImageFileId = uploadedCover.fileId;

      if (existingBlog?.coverImageFileId) {
        fileIdsToDelete.push(existingBlog.coverImageFileId);
      }
    } catch (error) {
      console.warn("Blog cover upload skipped:", error.message);
    }
  } else if (typeof req.body.coverImage === "string" && req.body.coverImage === "") {
    payload.coverImage = "";
    payload.coverImageFileId = "";
    if (existingBlog?.coverImageFileId) {
      fileIdsToDelete.push(existingBlog.coverImageFileId);
    }
  }

  return payload;
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

    const payload = await applyBlogCoverUpload(req, buildBlogPayload(req.body));

    const {
      title,
      excerpt,
      content,
      contentFormat,
      coverImage,
      coverImageFileId,
      tags,
      category,
      status = "published",
    } = payload;

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
      coverImageFileId,
      tags,
      category,
      status,
    });

    await blog.populate("author", "name email role");

    return sendSuccess(res, 201, "Blog created successfully", blog);
  } catch (error) {
    console.error("Error in createBlogController:", error);

    if (error.publicMessage) {
      return sendError(res, error.statusCode || 500, error.publicMessage);
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, getValidationErrorMessage(error));
    }

    if (isDuplicateKeyError(error)) {
      return sendError(res, 409, getDuplicateKeyMessage(error));
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
      const safeSearch = escapeRegex(searchValue);
      query.$or = [
        { title: { $regex: safeSearch, $options: "i" } },
        { excerpt: { $regex: safeSearch, $options: "i" } },
        { content: { $regex: safeSearch, $options: "i" } },
        { tags: { $regex: safeSearch, $options: "i" } },
        { category: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (tagValue) {
      query.tags = { $regex: escapeRegex(tagValue), $options: "i" };
    }

    if (categoryValue) {
      query.category = { $regex: escapeRegex(categoryValue), $options: "i" };
    }

    if (featured === "true") {
      query.isFeatured = true;
    }

    if (process.env.NODE_ENV !== "production" && process.env.DEBUG_API === "true") {
      console.log("BLOG SEARCH:", { search, tag, category, sort, query });
    }

    let sortOption;

    if (sort === "trending") {
      sortOption = { views: -1, likesCount: -1, createdAt: -1 };
    } else if (sort === "oldest") {
      sortOption = { createdAt: 1 };
    } else {
      sortOption = { createdAt: -1 };
    }

    const projection = { content: 0 };

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
        .find(query)
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

    const blog = await blogModel.findById(id).select("+coverImageFileId");

    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    if (blog.author.toString() !== userId.toString()) {
      return sendError(res, 403, "You are not allowed to update this blog");
    }

    const oldFileIdsToDelete = [];
    const payload = await applyBlogCoverUpload(
      req,
      buildBlogPayload(req.body),
      blog,
      oldFileIdsToDelete
    );

    if (payload.tags !== undefined && !Array.isArray(payload.tags)) {
      return sendError(res, 400, "Tags must be an array");
    }

    if (
      payload.status !== undefined &&
      !["draft", "published"].includes(payload.status)
    ) {
      return sendError(res, 400, "Status must be either draft or published");
    }

    const allowedFields = [
      "excerpt",
      "content",
      "contentFormat",
      "coverImage",
      "coverImageFileId",
      "tags",
      "category",
      "status",
    ];

    if (payload.title !== undefined) {
      if (!String(payload.title).trim()) {
        return sendError(res, 400, "Blog title cannot be empty");
      }

      blog.title = payload.title;
      blog.slug = await generateUniqueSlug(payload.title, blog._id);
    }

    allowedFields.forEach((field) => {
      if (payload[field] !== undefined) {
        blog[field] = payload[field];
      }
    });

    if (payload.isFeatured !== undefined) {
      if (req.user?.role !== "admin") {
        return sendError(res, 403, "Only admin can mark blog as featured");
      }

      blog.isFeatured = payload.isFeatured;
    }

    await blog.save();
    await Promise.all(oldFileIdsToDelete.map((fileId) => deleteFromImageKit(fileId)));

    await blog.populate("author", "name email role");

    return sendSuccess(res, 200, "Blog updated successfully", blog);
  } catch (error) {
    console.error("Error in updateBlogController:", error);

    if (error.publicMessage) {
      return sendError(res, error.statusCode || 500, error.publicMessage);
    }

    if (error.name === "ValidationError") {
      return sendError(res, 400, getValidationErrorMessage(error));
    }

    if (isDuplicateKeyError(error)) {
      return sendError(res, 409, getDuplicateKeyMessage(error));
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

    const blog = await blogModel.findById(id).select("+coverImageFileId");

    if (!blog) {
      return sendError(res, 404, "Blog not found");
    }

    if (blog.author.toString() !== userId.toString()) {
      return sendError(res, 403, "You are not allowed to delete this blog");
    }

    await blog.deleteOne();
    await deleteFromImageKit(blog.coverImageFileId);

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
