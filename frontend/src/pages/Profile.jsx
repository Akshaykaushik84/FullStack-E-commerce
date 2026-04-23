import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/NavbarComp";
import { getProfile, updateProfile, uploadProfileImage } from "../api/authApi.jsx";

const DEFAULT_PROFILE_IMAGE = "https://www.pngall.com/wp-content/uploads/5/Profile-Transparent.png";

const getStoredUser = () => {
  try {
    const rawUser = localStorage.getItem("user");

    if (!rawUser || rawUser === "undefined" || rawUser === "null") {
      return null;
    }

    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const Profile = () => {
  const navigate = useNavigate();
  const [storedUser] = useState(() => getStoredUser());
  const [profileForm, setProfileForm] = useState({
    name: storedUser?.name || "",
    dob: storedUser?.dob || "",
    phone: storedUser?.phone || "",
    profileImage: storedUser?.profileImage || DEFAULT_PROFILE_IMAGE,
    email: storedUser?.email || "",
    address: storedUser?.address || "",
    permanentAddress: storedUser?.permanentAddress || "",
  });
  const [loading, setLoading] = useState(!storedUser);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    getProfile()
      .then((res) => {
        const nextUser = {
          id: res.data._id,
          name: res.data.name || "",
          dob: res.data.dob || "",
          phone: res.data.phone || "",
          profileImage: res.data.profileImage || DEFAULT_PROFILE_IMAGE,
          email: res.data.email || "",
          address: res.data.address || "",
          permanentAddress: res.data.permanentAddress || "",
          role: res.data.role,
          createdAt: res.data.createdAt,
        };

        setProfileForm(nextUser);
        localStorage.setItem("user", JSON.stringify(nextUser));
      })
      .catch(() => {
        if (!storedUser) {
          navigate("/login");
        }
      })
      .finally(() => setLoading(false));
  }, [navigate, storedUser]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    setSavingProfile(true);

    updateProfile({
      name: profileForm.name,
      dob: profileForm.dob,
      phone: profileForm.phone,
      profileImage: profileForm.profileImage,
      address: profileForm.address,
      permanentAddress: profileForm.permanentAddress,
    })
      .then((res) => {
        const nextUser = res.data.user;
        setProfileForm((prev) => ({ ...prev, ...nextUser }));
        localStorage.setItem("user", JSON.stringify(nextUser));
        alert(res.data.message || "Profile updated successfully");
      })
      .catch((err) => alert(err.response?.data?.message || "Profile update failed"))
      .finally(() => setSavingProfile(false));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("profileImage", file);
    setUploadingImage(true);

    uploadProfileImage(formData)
      .then((res) => {
        setProfileForm((prev) => ({ ...prev, profileImage: res.data.imageUrl }));
        localStorage.setItem("user", JSON.stringify(res.data.user));
      })
      .catch((err) => alert(err.response?.data?.message || "Image upload failed"))
      .finally(() => setUploadingImage(false));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100">
        <Navbar />
        <div className="pt-28 text-center text-lg text-slate-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,var(--brand-50)_0%,#f8fbff_35%,#ffffff_100%)]">
      <Navbar />
      <div className="mx-auto max-w-6xl px-6 pb-14 pt-28">
        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.35fr]">
          <div className="sticky top-28 rounded-[2rem] bg-[var(--ink-900)] p-8 text-white shadow-2xl">
            <div className="h-28 w-28 overflow-hidden rounded-[2rem] border-4 border-white/10 bg-[var(--brand-500)]">
              <img
                src={profileForm.profileImage || DEFAULT_PROFILE_IMAGE}
                alt={profileForm.name || "Profile"}
                className="h-full w-full object-cover"
              />
            </div>

            <p className="mt-6 text-xs uppercase tracking-[0.35em] text-cyan-300">Profile Snapshot</p>
            <h2 className="mt-3 text-3xl font-bold">{profileForm.name || "Customer"}</h2>
            <p className="mt-1 text-slate-300">{profileForm.email}</p>
            <p className="mt-1 text-slate-300">{profileForm.phone || "Phone not added"}</p>

            <label className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-medium text-white">
              <Upload size={16} />
              {uploadingImage ? "Uploading image..." : "Upload profile image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>

            <div className="mt-8 space-y-4 text-sm">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-slate-300">Date of Birth</p>
                <p className="mt-1 font-semibold">{profileForm.dob || "Not added"}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-slate-300">Address</p>
                <p className="mt-1 font-semibold">{profileForm.address || "Not added"}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-slate-300">Permanent Address</p>
                <p className="mt-1 font-semibold">{profileForm.permanentAddress || "Not added"}</p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="rounded-[2rem] border border-white bg-white/95 p-8 shadow-xl backdrop-blur">
              <p className="text-sm uppercase tracking-[0.3em] text-[var(--brand-500)]">My Account</p>
              <h1 className="mt-3 text-4xl font-bold text-slate-900">Personal details</h1>
              <p className="mt-3 text-slate-600">
                Keep your account information up to date for smoother checkout and delivery.
              </p>

              <form className="mt-8 grid gap-5 md:grid-cols-2" onSubmit={handleProfileSubmit}>
                <input type="text" name="name" value={profileForm.name} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Full name" required />
                <input type="date" name="dob" value={profileForm.dob} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" />
                <input type="tel" name="phone" value={profileForm.phone} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)]" placeholder="Phone number" />
                <input type="email" value={profileForm.email} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-500 outline-none" readOnly />
                <textarea name="address" value={profileForm.address} onChange={handleProfileChange} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)] md:col-span-2" placeholder="Current address" />
                <textarea name="permanentAddress" value={profileForm.permanentAddress} onChange={handleProfileChange} className="min-h-28 rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)] md:col-span-2" placeholder="Permanent address" />
                <input type="url" name="profileImage" value={profileForm.profileImage} onChange={handleProfileChange} className="rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[var(--brand-500)] md:col-span-2" placeholder="Profile image URL" />
                <button type="submit" disabled={savingProfile} className="rounded-2xl bg-[var(--brand-600)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--brand-700)] disabled:opacity-60 md:col-span-2">
                  {savingProfile ? "Saving profile..." : "Save profile"}
                </button>
              </form>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-semibold text-slate-900">Security and recovery</h2>
              <p className="mt-3 text-slate-600">
                Password and recovery actions are handled from the login page using the forgot password flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
