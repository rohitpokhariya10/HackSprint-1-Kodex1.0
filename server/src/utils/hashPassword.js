const bcrypt = require("bcrypt")

let hashPassword = async (password) => {
  return await bcrypt.hash(password, 10)
}

let comparePassword = async (password, comparePass) => {
  return await bcrypt.compare(password, comparePass)
}


module.exports = {
  hashPassword,
  comparePassword
}