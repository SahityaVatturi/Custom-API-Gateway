import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import bodyParser from "body-parser";
import axios from "axios";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", true);
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept,content-type,application/json");
  next();
});

// change port from env file
const proxyOptions = {
  "/authentication": "http://localhost:7011",
  "/cart": "http://localhost:7012",
  "/inventory-management": "http://localhost:7013",
  "/user-profile": "http://localhost:7014",
  "/order-management": "http://localhost:7015",
  "/product-catalog": "http://localhost:7016",
  // Add more mappings as needed for additional sub-servers
};

// Create proxy middleware for each mapping
Object.entries(proxyOptions).forEach(([path, target]) => {
  const proxyMiddleware = createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: { [`^/custom-api-gateway/v1${path}`]: "" }, // Rewrite the path to remove the '/api/v1' prefix
    proxyTimeout: 5000, // Set a timeout of 5 seconds for proxy requests
    timeout: 60000, // Set a global timeout of 60 seconds for the entire request
    onProxyReq: (proxyReq, req, res) => {
      // Add custom headers to the proxy request
      const additionalHeaders = JSON.stringify({
        role: req.user.role,
        userId: req.user.userId,
      });
      proxyReq.setHeader("data", additionalHeaders);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.url}:`, err);
      // Retry the request after a delay
      setTimeout(() => {
        axios
          .get(req.url)
          .then((response) => {
            res.send(response.data);
          })
          .catch((error) => {
            // Provide a fallback response if retry fails
            res.status(500).send("Fallback response: Sub-server is unavailable", error);
          });
      }, 2000); // Retry after 2 seconds
    },
  });
  // app.use(`/ecommerce/v1${path}`, validateAuth, proxyMiddleware);
  app.use(`/ecommerce/v1${path}`, proxyMiddleware);
});

app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Welcome to root url!");
});

app.listen(process.env.PORT, (error) => {
  if (error) {
    console.log("Error occurred, server can't start", error);
    throw error;
  } else console.log(`Main Server is running on port ${process.env.PORT}`);
});
