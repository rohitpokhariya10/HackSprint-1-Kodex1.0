const ImageKit = require("imagekit");

const requiredEnvKeys = [
  "IMAGEKIT_PUBLIC_KEY",
  "IMAGEKIT_PRIVATE_KEY",
  "IMAGEKIT_URL_ENDPOINT",
];

const getMissingImageKitEnv = () => {
  return requiredEnvKeys.filter((key) => !String(process.env[key] || "").trim());
};

const hasImageKitConfig = () => getMissingImageKitEnv().length === 0;

let imagekit = null;

if (hasImageKitConfig()) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY.trim(),
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY.trim(),
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT.trim(),
  });
} else {
  console.warn(
    `ImageKit is not configured. Missing env: ${getMissingImageKitEnv().join(", ")}`
  );
}

module.exports = {
  imagekit,
  hasImageKitConfig,
  getMissingImageKitEnv,
};
