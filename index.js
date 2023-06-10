const express = require("express");
const app = express();
const cors = require("cors");
const port = process.env.PORT || 5000;

//middleware
app.use(cors());

//testing
app.get("/", (req, res) => {
  res.send("all the datas are on the way");
});

//connect
app.listen(port);
