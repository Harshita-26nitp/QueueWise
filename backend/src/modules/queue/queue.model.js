import mongoose from "mongoose";
const queueEntrySchema = new mongoose.Schema({
  businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Business", required: true, index: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  queueNumber: { type: String, required: true },
  sequence: { type: Number, required: true },
  status: { type: String, enum: ["WAITING", "SERVING", "COMPLETED", "CANCELLED", "NO_SHOW"], default: "WAITING", index: true },
  estimatedWaitTime: { type: Number, default: 0 },
  completedAt: Date
}, { timestamps: true });
queueEntrySchema.index({ businessId: 1, sequence: 1 }, { unique: true });
queueEntrySchema.index({ businessId: 1, customerId: 1, status: 1 });
export default mongoose.model("QueueEntry", queueEntrySchema);