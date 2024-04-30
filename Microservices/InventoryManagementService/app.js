import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
const app = express();
dotenv.config();
import router from "./src/routes/index.js";
const PORT = 7013;

app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  // console.log("user ip: ", req.ip);
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  next();
});

const addHeaders = (req, res, next) => {
  const data = JSON.parse(req.rawHeaders[req.rawHeaders.indexOf("data") + 1]);
  for (let [key, value] of Object.entries(data)) {
    req[key] = value;
  }
  next();
};

app.use("/", addHeaders, router);

app.get("/", (req, res) => {
  res.send("Welcome to Inventory Management Service!");
});

app.listen(PORT, (error) => {
  if (error) {
    console.log("Error occurred, server can't start", error);
    throw error;
  } else console.log(`Main Server is running on port ${PORT}`);
});
