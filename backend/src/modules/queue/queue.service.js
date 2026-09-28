import Business from "../business/business.model.js";
import QueueEntry from "./queue.model.js";
import AppError from "../../utils/AppError.js";
import { emitQueueUpdated } from "../../sockets/queue.socket.js";
async function assertOwner(businessId, ownerId) {
  const business = await Business.findOne({ _id: businessId, ownerId });
  if (!business) throw new AppError("Business not found or not owned by you", 404);
  return business;
}
export async function getQueueSnapshot(businessId) {
  const [business, entries] = await Promise.all([
    Business.findById(businessId).select("name isOpen isQueuePaused averageServiceTime"),
    QueueEntry.find({ businessId, status: { $in: ["WAITING", "SERVING"] } }).sort({ sequence: 1 }).populate("customerId", "name email")
  ]);
  if (!business) throw new AppError("Business not found", 404);
  const serving = entries.find((entry) => entry.status === "SERVING") || null;
  const waiting = entries.filter((entry) => entry.status === "WAITING");
  return { business, currentlyServing: serving, waiting, waitingCount: waiting.length };
}
export async function joinQueue(businessId, customerId) {
  const business = await Business.findById(businessId);
  if (!business) throw new AppError("Business not found", 404);
  if (!business.isOpen) throw new AppError("This business is currently closed", 409);
  if (business.isQueuePaused) throw new AppError("This queue is temporarily paused", 409);
  const active = await QueueEntry.findOne({ businessId, customerId, status: { $in: ["WAITING", "SERVING"] } });
  if (active) throw new AppError("You already have an active queue ticket for this business", 409);
  const sequenceBusiness = await Business.findOneAndUpdate(
    { _id: businessId }, { $inc: { nextQueueNumber: 1 } }, { new: false }
  );
  const sequence = sequenceBusiness.nextQueueNumber;
  const peopleAhead = await QueueEntry.countDocuments({ businessId, status: { $in: ["WAITING", "SERVING"] } });
  const entry = await QueueEntry.create({
    businessId, customerId, sequence,
    queueNumber: `${sequenceBusiness.queuePrefix}${String(sequence).padStart(3, "0")}`,
    estimatedWaitTime: peopleAhead * business.averageServiceTime
  });
  const ticket = await getMyTicket(businessId, customerId);
  emitQueueUpdated(businessId, await getQueueSnapshot(businessId));
  return ticket||entry;
}
export async function getMyTicket(businessId, customerId) {
  const entry = await QueueEntry.findOne({ businessId, customerId, status: { $in: ["WAITING", "SERVING"] } }).sort({ sequence: 1 });
  if (!entry) throw new AppError("You have no active ticket for this business", 404);
  const position = entry.status === "SERVING" ? 0 : await QueueEntry.countDocuments({ businessId, status: "WAITING", sequence: { $lt: entry.sequence } }) + 1;
  const business = await Business.findById(businessId).select("name averageServiceTime isOpen isQueuePaused");
  return { entry, position, peopleAhead: position === 0 ? 0 : position - 1, estimatedWaitMinutes: position * business.averageServiceTime, business };
}
export async function cancelMyTicket(businessId, customerId) {
  const entry = await QueueEntry.findOneAndUpdate({ businessId, customerId, status: "WAITING" }, { status: "CANCELLED" }, { new: true });
  if (!entry) throw new AppError("Only a waiting ticket can be cancelled", 409);
  emitQueueUpdated(businessId, await getQueueSnapshot(businessId));
  return entry;
}
export async function serveNext(businessId, ownerId) {
  await assertOwner(businessId, ownerId);
  const lock = await Business.findOneAndUpdate({ _id: businessId, ownerId, queueOperationInProgress: false }, { queueOperationInProgress: true }, { new: true });
  if (!lock) throw new AppError("Another queue action is in progress; try again", 409);
  try {
    await QueueEntry.updateMany({ businessId, status: "SERVING" }, { status: "COMPLETED", completedAt: new Date() });
    const next = await QueueEntry.findOneAndUpdate({ businessId, status: "WAITING" }, { status: "SERVING" }, { sort: { sequence: 1 }, new: true });
    const snapshot = await getQueueSnapshot(businessId);
    emitQueueUpdated(businessId, snapshot);
    return { next, snapshot };
  } finally {
    await Business.updateOne({ _id: businessId }, { queueOperationInProgress: false });
  }
}

export async function ownerUpdateEntry(businessId, ownerId, entryId, status) {
  await assertOwner(businessId, ownerId);
  if (!["COMPLETED", "CANCELLED", "NO_SHOW"].includes(status)) throw new AppError("Invalid queue status");
  const entry = await QueueEntry.findOneAndUpdate({ _id: entryId, businessId, status: { $in: ["WAITING", "SERVING"] } }, { status, completedAt: new Date() }, { new: true });
  if (!entry) throw new AppError("Active queue entry not found", 404);
  emitQueueUpdated(businessId, await getQueueSnapshot(businessId));
  return entry;
}