import path from "path";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import mainRoutes from "./routes/mainRoutes.js";
import requestIp from "request-ip";

dotenv.config();

const port = process.env.PORT || 5000;
const app = express();

// Middleware
app.use(cors({
  origin: true, 
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestIp.mw());
app.use(cookieParser());
app.set("trust proxy", true);

// Routes
app.use("/api/pcs", mainRoutes);

if (process.env.NODE_ENV === "production") {
  const __dirname = path.resolve();
  app.use(express.static(path.join(__dirname, "/frontend/dist")));

  app.get("*", (req, res) =>
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"))
  );
} else {
  app.get("/", (req, res) => {
    res.send("API is running....");
  });
}

// Error handling
app.use(notFound);
app.use(errorHandler);

app.listen(port, () => console.log(`Server started on port ${port}`));