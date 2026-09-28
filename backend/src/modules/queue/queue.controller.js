import * as service from "./queue.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
export const snapshot = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getQueueSnapshot(req.params.businessId) }));
export const join = asyncHandler(async (req, res) => res.status(201).json({ success: true, data: await service.joinQueue(req.params.businessId, req.user.id) }));
export const myTicket = asyncHandler(async (req, res) => res.json({ success: true, data: await service.getMyTicket(req.params.businessId, req.user.id) }));
export const cancelMine = asyncHandler(async (req, res) => res.json({ success: true, data: await service.cancelMyTicket(req.params.businessId, req.user.id) }));
export const serveNext = asyncHandler(async (req, res) => res.json({ success: true, data: await service.serveNext(req.params.businessId, req.user.id) }));
export const updateEntry = asyncHandler(async (req, res) => res.json({ success: true, data: await service.ownerUpdateEntry(req.params.businessId, req.user.id, req.params.entryId, req.body.status) }));