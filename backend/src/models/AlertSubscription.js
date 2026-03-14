import mongoose from "mongoose";

const alertSubscriptionSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true },
    locationName: { type: String, required: true, trim: true },
    preferredChannel: { type: String, enum: ["email", "push"], default: "email" }
  },
  { timestamps: true }
);

alertSubscriptionSchema.index({ email: 1, locationName: 1 }, { unique: true });

const AlertSubscription = mongoose.model("AlertSubscription", alertSubscriptionSchema);

export default AlertSubscription;
