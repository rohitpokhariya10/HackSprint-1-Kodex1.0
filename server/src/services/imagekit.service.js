const path = require("path");
const {
  imagekit,
  hasImageKitConfig,
  getMissingImageKitEnv,
} = require("../config/imagekit");

const createUploadName = (file) => {
  const extension = path.extname(file.originalname || "").toLowerCase();
  const safeBaseName = path
    .basename(file.originalname || "image", extension)
    .replace(/[^a-z0-9-_]/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${safeBaseName || "image"}-${Date.now()}${extension}`;
};

const ensureImageKitReady = () => {
  if (!hasImageKitConfig() || !imagekit) {
    const missingKeys = getMissingImageKitEnv().join(", ");
    const error = new Error(`ImageKit is not configured. Missing: ${missingKeys}`);
    error.statusCode = 500;
    error.publicMessage = "Image upload service is not configured.";
    throw error;
  }
};

const uploadBufferToImageKit = async (file, folder) => {
  ensureImageKitReady();

  if (!file?.buffer) {
    const error = new Error("Upload file buffer is missing");
    error.statusCode = 400;
    error.publicMessage = "Please provide a valid image file.";
    throw error;
  }

  try {
    const result = await imagekit.upload({
      file: file.buffer.toString("base64"),
      fileName: createUploadName(file),
      folder,
      useUniqueFileName: true,
    });

    return {
      url: result.url,
      fileId: result.fileId,
      name: result.name,
      thumbnailUrl: result.thumbnailUrl,
    };
  } catch (error) {
    error.statusCode = 502;
    error.publicMessage = "Image upload failed";
    throw error;
  }
};

const deleteFromImageKit = async (fileId) => {
  if (!fileId || !hasImageKitConfig() || !imagekit) {
    return;
  }

  try {
    await imagekit.deleteFile(fileId);
  } catch (error) {
    console.warn("ImageKit delete failed:", error.message);
  }
};

const deleteManyFromImageKit = async (fileIds = []) => {
  await Promise.all(fileIds.filter(Boolean).map((fileId) => deleteFromImageKit(fileId)));
};

module.exports = {
  uploadBufferToImageKit,
  deleteFromImageKit,
  deleteManyFromImageKit,
};
