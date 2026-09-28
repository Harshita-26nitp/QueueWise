import * as authService from "./auth.service.js";
import {asyncHandler} from "../../utils/asyncHandler.js";
export const register = asyncHandler(async (req, res) => 
    res.status(201).json({success: true, data: await authService.register(req.body)}));
export const login = asyncHandler(async (req,res) => res.json({success: true, data: await authService.login(req.body) }));
export const me = asyncHandler(async (req, res) => res.json({success: true, data: req.user }));