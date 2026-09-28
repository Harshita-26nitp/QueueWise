import mongoose from "mongoose";
const businessSchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 120 },
  category: { type: String, required: true, trim: true, index: true },
  address: { type: String, required: true, trim: true },
  isOpen: { type: Boolean, default: true },
  isQueuePaused: { type: Boolean, default: false },
  averageServiceTime: { type: Number, default: 5, min: 1, max: 240 },
  queuePrefix: { type: String, default: "A", uppercase: true, trim: true, maxlength: 5 },
  nextQueueNumber: { type: Number, default: 1 },
  queueOperationInProgress: { type: Boolean, default: false }
}, { timestamps: true });
businessSchema.index({ name: "text", category: "text" });
export default mongoose.model("Business", businessSchema);