"use client";

import { useEffect, useState } from "react";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";
import { Poppins } from "next/font/google";
import { IoHomeOutline } from "react-icons/io5";
import Link from "next/link";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export default function ProfilePage() {
  const user = useUser();
  const supabase = useSupabaseClient();

  // Profile fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");

  // UI state
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChanging] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirm] = useState("");

  // 1) Fetch profile once on mount
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("first_name, last_name, nickname")
      .eq("user_id", user.id)
      .single()
      .then(({ data, error }) => {
        if (data) {
          setFirstName(data.first_name || "");
          setLastName(data.last_name || "");
          setNickname(data.nickname || "");
        } else if (error) {
          console.error(error);
          setMessage("Failed to load profile.");
        }
      })
      .then(
        () => {},
        () => {}
      )
      .then(() => setLoading(false));
  }, [user, supabase]);

  // 2) If there's no name yet, auto-enter edit mode
  useEffect(() => {
    if (!loading && !firstName && !lastName) {
      setIsEditing(true);
    }
  }, [loading, firstName, lastName]);

  // 3) Save profile
  const saveProfile = async () => {
    if (!user) return;
    setLoading(true);
    setMessage("");
    const { error } = await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        email: user.email, // keep your NOT NULL email happy
        first_name: firstName,
        last_name: lastName,
        nickname,
      })
      .single();
    if (error) setMessage("Error saving profile: " + error.message);
    else {
      setMessage("Profile updated!");
      setIsEditing(false);
    }
    setLoading(false);
  };

  // 4) Change password
  const savePassword = async () => {
    if (!user) return;
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage("Failed to update password: " + error.message);
    else {
      setMessage("Password changed!");
      setIsChanging(false);
      setNewPassword("");
      setConfirm("");
    }
    setLoading(false);
  };

  if (!user)
    return (
      <p className="text-white mt-20 text-center">
        Please sign in to view your profile.
      </p>
    );
  if (loading) return <p className="text-white mt-20 text-center">Loading…</p>;

  return (
    <div
      className={`min-h-screen flex flex-col items-center px-4 lg:px-24 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0e6aac] from-0% via-[#000000] via-60% to-[#5d2c00] to-100% ${poppins.variable}`}
    >
      {/* Home Icon */}
      <div className="w-full max-w-5xl flex justify-start py-6">
        <Link href="/">
          <IoHomeOutline className="text-2xl text-gray-300 hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#1e293b] rounded-lg p-8 shadow-lg text-gray-200">
        <h2 className="text-2xl font-bold mb-6 text-center">My Profile</h2>

        {/* VIEW MODE */}
        {!isEditing ? (
          <>
            <div className="space-y-3">
              <p>
                <span className="font-semibold">First Name:</span>{" "}
                {firstName || "—"}
              </p>
              <p>
                <span className="font-semibold">Last Name:</span>{" "}
                {lastName || "—"}
              </p>
              <p>
                <span className="font-semibold">Nickname:</span>{" "}
                {nickname || "—"}
              </p>
            </div>
            <button
              onClick={() => {
                setMessage("");
                setIsEditing(true);
              }}
              className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-white font-semibold transition-colors"
            >
              Edit Profile
            </button>
          </>
        ) : (
          /* EDIT MODE */
          <>
            <label className="block mb-1">First Name</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-4 text-white"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />

            <label className="block mb-1">Last Name</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-4 text-white"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />

            <label className="block mb-1">Nickname</label>
            <input
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-6 text-white"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />

            <div className="flex gap-4">
              <button
                onClick={saveProfile}
                disabled={loading}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setMessage("");
                }}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-semibold"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {/* Divider */}
        <div className="border-b border-gray-700 my-6" />

        {/* PASSWORD SECTION */}
        {!isChangingPassword ? (
          <button
            onClick={() => {
              setMessage("");
              setIsChanging(true);
            }}
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-white font-semibold"
          >
            Change Password
          </button>
        ) : (
          <>
            <label className="block mb-1">New Password</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-4 text-white"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
            />

            <label className="block mb-1">Confirm Password</label>
            <input
              type="password"
              className="w-full p-2 rounded bg-gray-800 border border-gray-700 mb-6 text-white"
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Retype new password"
            />

            <div className="flex gap-4">
              <button
                onClick={savePassword}
                disabled={loading}
                className="flex-1 py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsChanging(false);
                  setMessage("");
                }}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded text-white font-semibold"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {message && (
          <p className="mt-4 text-center text-sm text-red-400">{message}</p>
        )}
      </div>
    </div>
  );
}
