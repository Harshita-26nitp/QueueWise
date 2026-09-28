import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "./auth.model.js";
import AppError from "../../utils/AppError.js";
const publicUser = (user) => ({ id: user._id, name: user.name, email: user.email, role: user.role });
const tokenFor = (user) => jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
export async function register({ name, email, password, role }) {
  if (!name || !email || !password) throw new AppError("Name, email and password are required");
  if (password.length < 6) throw new AppError("Password must be at least 6 characters");
  if (!['CUSTOMER', 'OWNER'].includes(role)) throw new AppError("Role must be CUSTOMER or OWNER");
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) throw new AppError("Email is already registered", 409);
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });
  return { user: publicUser(user), token: tokenFor(user) };
}
export async function login({ email,password }) {
  const user = await User.findOne({ email:email?.toLowerCase() }).select("+passwordHash");
  if (!user || !(await user.comparePassword(password ||""))) throw new AppError("Invalid email or password", 401);
  return {user:publicUser(user),token: tokenFor(user)};
}