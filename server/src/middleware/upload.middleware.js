const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || "").toLowerCase();
  const isValidMime = allowedMimeTypes.has(file.mimetype);
  const isValidExt = allowedExtensions.has(ext);

  if (process.env.NODE_ENV !== "production" && process.env.DEBUG_API === "true") {
    console.log("UPLOAD FILE:", {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
      ext,
      isValidMime,
      isValidExt,
    });
  }

  if (isValidMime && isValidExt) {
    return cb(null, true);
  }

  return cb(new Error("Only image files are allowed"), false);
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
});

const createMulterUnexpectedFieldError = (fieldname) => {
  const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", fieldname);
  error.publicMessage = "File upload failed";
  return error;
};

const normalizeFilesByField = (files = [], fieldConfigs = []) => {
  const allowedFields = new Map(
    fieldConfigs.map((field) => [field.name, field.maxCount || Infinity])
  );
  const normalizedFiles = {};

  files.forEach((file) => {
    const fieldname = String(file.fieldname || "").trim();

    if (!allowedFields.has(fieldname)) {
      throw createMulterUnexpectedFieldError(file.fieldname);
    }

    normalizedFiles[fieldname] = normalizedFiles[fieldname] || [];

    if (normalizedFiles[fieldname].length >= allowedFields.get(fieldname)) {
      throw createMulterUnexpectedFieldError(file.fieldname);
    }

    file.fieldname = fieldname;
    normalizedFiles[fieldname].push(file);
  });

  return normalizedFiles;
};

const uploadFields = (fieldConfigs) => (req, res, next) => {
  upload.any()(req, res, (error) => {
    if (error) return next(error);

    try {
      req.files = normalizeFilesByField(req.files, fieldConfigs);
      return next();
    } catch (normalizeError) {
      return next(normalizeError);
    }
  });
};

const uploadSingle = (fieldName) => (req, res, next) => {
  uploadFields([{ name: fieldName, maxCount: 1 }])(req, res, (error) => {
    if (error) return next(error);

    req.file = req.files?.[fieldName]?.[0];
    return next();
  });
};

const handleUploadError = (uploadHandler) => (req, res, next) => {
  uploadHandler(req, res, (error) => {
    if (!error) return next();

    if (process.env.NODE_ENV !== "production" && process.env.DEBUG_API === "true") {
      console.log("UPLOAD ERROR:", {
        name: error.name,
        code: error.code,
        field: error.field,
        message: error.message,
      });
    }

    if (error instanceof multer.MulterError) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 5MB"
          : "File upload failed";

      return res.status(400).json({
        success: false,
        message,
      });
    }

    if (error.message === "Only image files are allowed") {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(400).json({
      success: false,
      message: "File upload failed",
    });
  });
};

module.exports = {
  upload,
  uploadFields,
  uploadSingle,
  handleUploadError,
};
