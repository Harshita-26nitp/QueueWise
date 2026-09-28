import * as service from "./business.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
export const create = asyncHandler(async (req, res) => {
  const business = await service.createBusiness(req.user.id, req.body);
  res.status(201).json({
    success: true,
    data: business
  });
});
export const list = asyncHandler(async (req, res) => {
  const businesses = await service.listBusinesses(req.query);
  res.json({
    success: true,
    data: businesses
  });
});
export const getOne = asyncHandler(async (req, res) => {
  const business = await service.getBusiness(req.params.businessId);
  res.json({
    success: true,
    data: business
  });
});
export const mine = asyncHandler(async (req, res) => {
  const businesses = await service.myBusinesses(req.user.id);
  res.json({
    success: true,
    data: businesses
  });
});
export const update = asyncHandler(async (req, res) => {
  const business = await service.updateBusiness(
    req.user.id,
    req.params.businessId,
    req.body
  );
  res.json({
    success: true,
    data: business
  });
});