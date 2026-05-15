const fs = require("fs/promises");
const path = require("path");

const uploadsRoot = path.join(__dirname, "..", "..", "uploads");
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

const createSafeFileName = (file) => {
  const originalExtension = path.extname(file.originalname || "").toLowerCase();
  const extension = allowedExtensions.has(originalExtension) ? originalExtension : ".jpg";
  const baseName = path
    .basename(file.originalname || "image", originalExtension)
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${baseName || "image"}-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
};

const getRequestBaseUrl = (req) => {
  if (process.env.API_PUBLIC_URL) {
    return process.env.API_PUBLIC_URL.replace(/\/+$/, "");
  }

  const forwardedProto = req.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const protocol = forwardedProto || req.protocol || "http";
  return `${protocol}://${req.get("host")}`;
};

const uploadBufferToLocal = async (file, folder, req) => {
  if (!file?.buffer) {
    const error = new Error("Upload file buffer is missing");
    error.statusCode = 400;
    error.publicMessage = "Please provide a valid image file.";
    throw error;
  }

  const safeFolder = String(folder || "images").replace(/[^a-z0-9-_]/gi, "-");
  const fileName = createSafeFileName(file);
  const uploadDir = path.join(uploadsRoot, safeFolder);
  const filePath = path.join(uploadDir, fileName);

  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(filePath, file.buffer);

  return {
    url: `${getRequestBaseUrl(req)}/uploads/${safeFolder}/${fileName}`,
    fileId: "",
    name: fileName,
  };
};

module.exports = {
  uploadsRoot,
  uploadBufferToLocal,
};
