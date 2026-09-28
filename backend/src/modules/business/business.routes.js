import { Router } from "express";
import * as controller from "./business.controller.js";
import { protect, allowRoles } from "../../middleware/auth.middleware.js";
const router = Router();
router.get("/", controller.list);
router.get("/mine",protect,allowRoles("OWNER"),controller.mine);
router.post("/",protect,allowRoles("OWNER"),controller.create);
router.get("/:businessId", controller.getOne);
router.patch(
  "/:businessId",
  protect,
  allowRoles("OWNER"),
  controller.update
);
export default router;