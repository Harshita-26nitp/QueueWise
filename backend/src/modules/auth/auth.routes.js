import {Router} from "express";
import * as controller from "./auth.controller.js";
import {protect} from "../../middleware/auth.middleware.js";
const router = Router();
router.post("/register",controller.register);
router.post("/login",controller.login);
router.get("/me",protect,controller.me);
export default router;