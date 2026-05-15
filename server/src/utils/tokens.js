const jwt = require('jsonwebtoken')

let generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_TOKEN, { expiresIn: "1h" })
}

let generateRefreshToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_TOKEN, { expiresIn: "7d" })
}

module.exports = {
  generateAccessToken,
  generateRefreshToken
}
