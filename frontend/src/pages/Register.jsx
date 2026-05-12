import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerUser } from "../api/authApi.jsx";
import { useToast } from "../components/ToastProvider.jsx";
import { claimAuthTab, hasAnotherActiveAuthTab } from "../utils/authSession";
import { setStoredToken, setStoredUser } from "../utils/authStorage.js";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { showError, showSuccess } = useToast();

  const handleRegister = () => {
    if (hasAnotherActiveAuthTab(email)) {
      showError("An account is already active in another tab. Please use that tab or close it first.");
      return;
    }

    registerUser({ name, email, password })
      .then((res) => {
        claimAuthTab(res.data.user?.email || email);
        setStoredToken(res.data.token);
        setStoredUser(res.data.user);
        showSuccess("Registered successfully.");
        navigate("/");
      })
      .catch((err) => showError(err.response?.data?.message || "Registration failed"));
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,var(--brand-50)_0%,#ffffff_45%,#e6fffb_100%)] px-3 py-4 sm:px-4 sm:py-12">
      <div className="mx-auto grid max-w-5xl gap-4 items-stretch lg:grid-cols-[1fr_1.05fr] lg:gap-8">
        <div className="order-2 rounded-[2rem] bg-[var(--ink-900)] p-5 text-white shadow-2xl sm:p-8 md:p-10 lg:order-1">
          <p className="text-sm uppercase tracking-[0.35em] text-teal-300 mb-4">
            Create Account
          </p>
          <h1 className="text-2xl font-bold leading-tight mb-4 sm:text-4xl md:text-5xl">
            Join the store and personalize your shopping journey
          </h1>
          <p className="text-slate-200 text-base mb-6 sm:text-lg sm:mb-8">
            Set up your account once and manage your profile, orders, and saved details with ease.
          </p>

          <div className="space-y-4 text-sm">
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-teal-200 mb-1">Quick Setup</p>
              <p className="font-medium">Register once and continue directly to the home page.</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-teal-200 mb-1">Profile Ready</p>
              <p className="font-medium">Add your image, phone number, and addresses after signing up.</p>
            </div>
          </div>
        </div>

        <div className="order-1 rounded-[2rem] border border-white bg-white/95 p-4 shadow-xl backdrop-blur sm:p-8 md:p-10 lg:order-2">
          <h2 className="text-2xl font-bold text-slate-900 mb-2 sm:text-3xl">Register</h2>
          <p className="text-slate-600 mb-8">
            Create your account to get started.
          </p>

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your full name"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                placeholder="Create a password"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              className="w-full rounded-2xl bg-[var(--brand-600)] text-white py-3 font-semibold hover:bg-[var(--brand-700)] transition"
              onClick={handleRegister}
            >
              Create Account
            </button>
          </div>

          <div className="mt-5 text-sm">
            <Link to="/login" className="text-slate-600">
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
