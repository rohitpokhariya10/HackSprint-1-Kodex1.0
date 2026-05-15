require("dotenv").config()
const app = require("./src/app");
const connectDB = require("./src/config/db");

let port = process.env.PORT || 4000

connectDB()

app.listen(port, ()=>{
  console.log(`Server is runnin on port ${port}`);
  
})