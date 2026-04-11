import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import api from "../api/client";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, otp } = location.state || {};

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validatePassword = (pwd) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[a-z]/.test(pwd)) return "Password must contain lowercase letters";
    if (!/[A-Z]/.test(pwd)) return "Password must contain uppercase letters";
    if (!/\d/.test(pwd)) return "Password must contain numbers";
    if (!/[^a-zA-Z0-9]/.test(pwd)) return "Password must contain special characters";
    return null;
  };

  const handlePasswordChange = (pwd) => {
    setPassword(pwd);
    const validation = validatePassword(pwd);
    setPasswordError(validation);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!password.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setLoading(true);
      await api.post("/auth/reset-password", { email, otp, newPassword: password });
      
      setTimeout(() => {
        navigate("/admin/login");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!email || !otp) {
    return (
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-[#020617]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="z-10 text-center"
        >
          <p className="text-slate-600 dark:text-slate-400">Invalid session. Redirecting...</p>
        </motion.div>
      </section>
    );
  }

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
        <header className="mb-8">
          <h2 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Set New Password
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
            Create a strong password for your account
          </p>
        </header>

        <div className="mb-6 rounded-xl bg-indigo-50/50 p-4 dark:bg-indigo-500/5">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">Password Requirements:</p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <li>✓ At least 8 characters</li>
            <li>✓ Uppercase letter (A-Z)</li>
            <li>✓ Lowercase letter (a-z)</li>
            <li>✓ Number (0-9)</li>
            <li>✓ Special character (!@#$%)</li>
          </ul>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6">
          {/* New Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-indigo-500 focus:bg-white disabled:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:border-indigo-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                {showPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
            {passwordError && (
              <p className="text-xs text-red-600 dark:text-red-400">{passwordError}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-indigo-500 focus:bg-white disabled:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white dark:focus:border-indigo-400"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-4 text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                {showConfirmPassword ? "👁" : "👁‍🗨"}
              </button>
            </div>
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

          <button
            type="submit"
            disabled={loading || !!passwordError}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-slate-900 py-4 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Resetting...
              </span>
            ) : (
              <>
                Reset Password
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 rounded-xl bg-indigo-50/50 p-4 dark:bg-indigo-500/5">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-2">🔒 Security Tips</p>
          <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <li>• Use a unique password</li>
            <li>• Don't share with anyone</li>
            <li>• Use a mix of character types</li>
            <li>• Consider using a password manager</li>
          </ul>
        </div>
      </motion.div>
    </section>
  );
};

export default ResetPasswordPage;
