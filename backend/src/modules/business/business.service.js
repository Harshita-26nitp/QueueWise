import Business from "./business.model.js";
import QueueEntry from "../queue/queue.model.js";
import AppError from "../../utils/AppError.js";
export async function createBusiness(ownerId, payload) {
  const { name, category, address, averageServiceTime, queuePrefix } = payload;
  if (!name || !category || !address) throw new AppError("Name, category and address are required");
  return Business.create({ ownerId, name, category, address, averageServiceTime, queuePrefix });
}
export async function listBusinesses({ search, category, openOnly }) {
  const filter = {};
  if (category) filter.category = new RegExp(`^${escapeRegex(category)}$`, "i");
  if (openOnly === "true") filter.isOpen = true;
  if (search) filter.$text = { $search: search };
  return Business.find(filter).sort({ isOpen: -1, name: 1 }).select("-queueOperationInProgress -nextQueueNumber");
}

export async function getBusiness(id) {
  const business = await Business.findById(id).select("-queueOperationInProgress -nextQueueNumber");
  if (!business) throw new AppError("Business not found", 404);
  const [serving, waitingCount] = await Promise.all([
    QueueEntry.findOne({ businessId: id, status: "SERVING" }).select("queueNumber"),
    QueueEntry.countDocuments({ businessId: id, status: "WAITING" })
  ]);
  return { business, liveQueue: { currentlyServing: serving?.queueNumber || null, waitingCount, estimatedWaitMinutes: waitingCount * business.averageServiceTime } };
}
export async function myBusinesses(ownerId) { return Business.find({ ownerId }).sort({ createdAt: -1 });}
export async function updateBusiness(ownerId, businessId, payload) {
  const allowed = ["name", "category", "address", "isOpen", "isQueuePaused", "averageServiceTime", "queuePrefix"];
  const update = Object.fromEntries(Object.entries(payload).filter(([key]) => allowed.includes(key)));
  const business = await Business.findOneAndUpdate({ _id: businessId, ownerId }, update, { new: true, runValidators: true });
  if (!business) throw new AppError("Business not found or not owned by you", 404);
  return business;
}
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");