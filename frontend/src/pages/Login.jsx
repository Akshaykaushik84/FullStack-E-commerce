import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { forgotPassword, loginUser } from "../api/authApi.jsx";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotSuccess, setForgotSuccess] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [forgotForm, setForgotForm] = useState({
    name: "",
    email: "",
    dob: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleLogin = () => {
    setLoginNotice("");
    loginUser({ email, password })
      .then((res) => {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Login successful!");
        navigate("/");
      })
      .catch((err) => alert(err.response?.data?.message || "Login failed"));
  };

  const handleForgotChange = (e) => {
    const { name, value } = e.target;
    setForgotError("");
    setForgotSuccess("");
    setForgotForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleForgotPassword = () => {
    setForgotError("");
    setForgotSuccess("");

    if (forgotForm.newPassword !== forgotForm.confirmPassword) {
      setForgotError("Password reset failed: new password and confirm password must match.");
      return;
    }

    if (
      !forgotForm.name ||
      !forgotForm.email ||
      !forgotForm.dob ||
      !forgotForm.newPassword
    ) {
      setForgotError("Password reset failed: please fill in your name, registered email, date of birth, and new password.");
      return;
    }

    forgotPassword({
      name: forgotForm.name,
      email: forgotForm.email,
      dob: forgotForm.dob,
      newPassword: forgotForm.newPassword,
    })
      .then((res) => {
        setForgotSuccess(res.data.message || "Password reset successful.");
        setLoginNotice(res.data.message || "Password reset successful.");
        setShowForgot(false);
        setForgotForm({
          name: "",
          email: "",
          dob: "",
          newPassword: "",
          confirmPassword: "",
        });
      })
      .catch((err) => {
        const reason =
          err.response?.data?.message ||
          "We could not verify your details. Please check your name, email, and date of birth.";
        setForgotError(`Password reset failed: ${reason}`);
      });
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,var(--brand-50)_0%,#ffffff_45%,#e6fffb_100%)] px-4 py-12">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1fr_1.05fr] gap-8 items-stretch">
        <div className="rounded-[2rem] bg-[var(--ink-900)] text-white p-8 md:p-10 shadow-2xl">
          <p className="text-sm uppercase tracking-[0.35em] text-teal-300 mb-4">
            Welcome Back
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Login to manage your orders and profile
          </h1>
          <p className="text-slate-300 text-lg mb-8">
            Secure access, quick profile updates, and a smoother shopping flow.
          </p>

          <div className="space-y-4 text-sm">
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-slate-300 mb-1">Fast Access</p>
              <p className="font-medium">You will be redirected to the home page after login.</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-4">
              <p className="text-slate-300 mb-1">Account Control</p>
              <p className="font-medium">Profile details and recovery settings are managed separately.</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] bg-white/95 backdrop-blur p-8 md:p-10 shadow-xl border border-white">
          {!showForgot ? (
            <>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Login</h2>
              <p className="text-slate-600 mb-8">
                Sign in to access your account.
              </p>

              {loginNotice ? (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {loginNotice}
                </div>
              ) : null}

              <div className="space-y-5">
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
                    placeholder="Enter your password"
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button
                  className="w-full rounded-2xl bg-[var(--brand-600)] text-white py-3 font-semibold hover:bg-[var(--brand-700)] transition"
                  onClick={handleLogin}
                >
                  Login
                </button>
              </div>

              <div className="mt-5 flex items-center justify-between text-sm">
                <button
                  type="button"
                  className="text-[var(--brand-600)] font-medium"
                  onClick={() => {
                    setShowForgot(true);
                    setForgotError("");
                    setForgotSuccess("");
                  }}
                >
                  Forgot Password?
                </button>
                <Link to="/register" className="text-slate-600">
                  Create account
                </Link>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">
                Reset Password
              </h2>
              <p className="text-slate-600 mb-8">
                Enter your registered details below. If they match our records, you can set a new password.
              </p>

              {forgotError ? (
                <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {forgotError}
                </div>
              ) : null}

              {forgotSuccess ? (
                <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {forgotSuccess}
                </div>
              ) : null}

              <div className="grid gap-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={forgotForm.name}
                      onChange={handleForgotChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Registered Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={forgotForm.email}
                      onChange={handleForgotChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                      placeholder="Enter your registered email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dob"
                    value={forgotForm.dob}
                    onChange={handleForgotChange}
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      value={forgotForm.newPassword}
                      onChange={handleForgotChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                      placeholder="Create a new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={forgotForm.confirmPassword}
                      onChange={handleForgotChange}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]"
                      placeholder="Confirm your new password"
                    />
                  </div>
                </div>

                <button
                  className="w-full rounded-2xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition"
                  onClick={handleForgotPassword}
                >
                  Reset Password
                </button>
              </div>

              <button
                type="button"
                className="mt-5 text-sm text-[var(--brand-600)] font-medium"
                onClick={() => {
                  setShowForgot(false);
                  setForgotError("");
                }}
              >
                Back to login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
