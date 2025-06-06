import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { registerPC } from "../controllers/authController.js";
import { getRooms } from "../controllers/roomsController.js";
import { getGuacamoleConnection } from "../controllers/guacamoleController.js";

const router = express.Router();


router.post("/register", registerPC);

router.get("/getRooms", getRooms);


router.get("/guacamole-connection", protect, getGuacamoleConnection);

export default router;