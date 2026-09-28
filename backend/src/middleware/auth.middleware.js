import jwt from "jsonwebtoken";
import User from "../modules/auth/auth.model.js";
import AppError from "../utils/AppError.js";
import {asyncHandler} from "../utils/asyncHandler.js";
export const protect = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.startsWith("Bearer ")? req.headers.authorization.slice(7): null;
if (!token){
    throw new AppError("Please log in to continue", 401);
  }
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(payload.userId).select("-passwordHash");
  if (!user) {
    throw new AppError("User no longer exists", 401);
  }
req.user = user;
  next();
});
export const allowRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return next(
      new AppError("You do not have permission for this action", 403)
    );
  }

  next();
};