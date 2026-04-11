import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";

const VerifyOTPPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!email) {
      navigate("/forgot-password");
    }
  }, [email, navigate]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp.trim()) {
      setError("Please enter the 6-digit OTP");
      return;
    }

    if (otp.length !== 6 || !/^\d+$/.test(otp)) {
      setError("OTP must be exactly 6 digits");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/verify-otp", { email, otp });
      setSuccess("OTP verified! Redirecting...");
      setTimeout(() => navigate("/reset-password", { state: { email, otp } }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError("");
    try {
      setResendLoading(true);
      await api.post("/auth/forgot-password", { email });
      setSuccess("New OTP sent to your email!");
      setOtp("");
      setTimeLeft(60);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-[#020617]">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-emerald-500/10 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 w-full max-w-md rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:p-12"
      >
        <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="mb-6 text-sm font-semibold text-slate-500 hover:text-slate-700 dark:text-slate-400 flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
          Back
        </button>

        <header className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Verify OTP
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            We've sent a 6-digit code to <span className="font-bold">{email}</span>
          </p>
        </header>

        <form onSubmit={handleVerifyOTP} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              One-Time Password
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              disabled={loading}
              className="w-full rounded-2xl border-2 border-indigo-500 bg-slate-50 px-5 py-6 text-center text-3xl font-black tracking-[8px] outline-none transition-all focus:bg-white disabled:bg-slate-100 dark:border-indigo-400 dark:bg-slate-800/50 dark:text-white dark:focus:bg-slate-800"
              placeholder="000000"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-xs font-bold text-red-600 dark:bg-red-500/10 dark:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 rounded-xl bg-emerald-50 p-4 text-xs font-bold text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {success}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Verifying...
              </span>
            ) : (
              <>
                Verify OTP
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          {timeLeft > 0 ? (
            <p className="text-xs font-semibold text-slate-500">Resend in {timeLeft}s</p>
          ) : (
            <button
              type="button"
              onClick={handleResendOTP}
              disabled={resendLoading}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 disabled:opacity-50"
            >
              {resendLoading ? "Sending..." : "Didn't receive the code? Resend OTP"}
            </button>
          )}
        </div>

        <div className="mt-8 rounded-xl bg-indigo-50/50 p-4 dark:bg-indigo-500/5">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            • OTP is valid for 15 minutes<br/>
            • Check spam folder if you don't see the email<br/>
            • Each OTP can only be used once
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default VerifyOTPPage;
