const jwt = require("jsonwebtoken");

const FALLBACK_ACCESS_TOKEN_SECRET = "urieroeoeoppe";
const FALLBACK_REFRESH_TOKEN_SECRET = "dkdlfofofog";

const getAccessTokenSecret = () =>
  process.env.JWT_ACCESS_TOKEN ||
  process.env.JWT_ACCESS_SECRET ||
  process.env.ACCESS_TOKEN_SECRET ||
  FALLBACK_ACCESS_TOKEN_SECRET;

const getRefreshTokenSecret = () =>
  process.env.JWT_REFRESH_TOKEN ||
  process.env.JWT_REFRESH_SECRET ||
  process.env.REFRESH_TOKEN_SECRET ||
  FALLBACK_REFRESH_TOKEN_SECRET;

const assertJwtSecret = (secret, name) => {
  if (!secret) {
    throw new Error(`${name} is missing`);
  }

  return secret;
};

let generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    assertJwtSecret(getAccessTokenSecret(), "JWT access token secret"),
    { expiresIn: "1h" }
  );
};

let generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    assertJwtSecret(getRefreshTokenSecret(), "JWT refresh token secret"),
    { expiresIn: "7d" }
  );
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenSecret,
  getRefreshTokenSecret,
};
