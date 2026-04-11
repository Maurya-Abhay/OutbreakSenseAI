import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: true,
      minlength: 8,
      maxlength: 128,
      select: false,
      validate: {
        validator: (value) =>
          /[a-z]/.test(value) &&
          /[A-Z]/.test(value) &&
          /\d/.test(value) &&
          /[^a-zA-Z0-9]/.test(value),
        message:
          "Password must include uppercase, lowercase, numeric, and special characters."
      }
    },
    role: { type: String, enum: ["admin", "citizen"], default: "citizen" },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    isBanned: { type: Boolean, default: false },
    banReason: { type: String, default: null },
    bannedAt: { type: Date, default: null },
    bannedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    refreshTokens: [
      {
        token: { type: String, required: true },
        expiresAt: { type: Date, required: true }
      }
    ],
    passwordResetOTP: { type: String, select: false },
    passwordResetOTPExpiry: { type: Date, select: false }
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) {
    next();
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(inputPassword) {
  return bcrypt.compare(inputPassword, this.password);
};

userSchema.methods.addRefreshToken = function addRefreshToken(token, expiresAt) {
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter(rt => new Date(rt.expiresAt) > new Date());
  
  // Add new token
  this.refreshTokens.push({ token, expiresAt });
  
  // Keep only last 5 refresh tokens
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

userSchema.methods.isRefreshTokenValid = function isRefreshTokenValid(token) {
  return this.refreshTokens.some(
    rt => rt.token === token && new Date(rt.expiresAt) > new Date()
  );
};

userSchema.methods.removeRefreshToken = function removeRefreshToken(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

userSchema.methods.clearAllRefreshTokens = function clearAllRefreshTokens() {
  this.refreshTokens = [];
};

userSchema.methods.generatePasswordResetOTP = function generatePasswordResetOTP() {
  const otp = Math.random().toString().substring(2, 8).padStart(6, "0");
  this.passwordResetOTP = otp;
  this.passwordResetOTPExpiry = new Date(Date.now() + 15 * 60 * 1000);
  return otp;
};

userSchema.methods.verifyPasswordResetOTP = function verifyPasswordResetOTP(otp) {
  if (!this.passwordResetOTP || !this.passwordResetOTPExpiry) {
    return false;
  }
  if (new Date() > this.passwordResetOTPExpiry) {
    return false;
  }
  return this.passwordResetOTP === otp;
};

userSchema.methods.clearPasswordResetOTP = function clearPasswordResetOTP() {
  this.passwordResetOTP = undefined;
  this.passwordResetOTPExpiry = undefined;
};

userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isBanned: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ location: 1 });

const User = mongoose.model("User", userSchema);

export default User;
