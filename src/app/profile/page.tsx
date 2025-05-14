"use client";

import { useEffect, useState } from "react";
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react";

export default function ProfilePage() {
  const user = useUser();
  const supabase = useSupabaseClient();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, nickname")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setNickname(data.nickname || "");
      }
      if (error) {
        setMessage("Failed to load profile.");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user, supabase]);

  const updateProfile = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user!.id,
      first_name: firstName,
      last_name: lastName,
      nickname,
    });
    if (error) setMessage("Error updating profile: " + error.message);
    else setMessage("Profile updated successfully!");
    setLoading(false);
  };

  const updatePassword = async () => {
    if (!user) return;
    setLoading(true);
    const newPassword = prompt("Enter your new password (min 6 chars)");
    if (!newPassword || newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) setMessage("Failed to update password: " + error.message);
    else setMessage("Password updated successfully!");
    setLoading(false);
  };

  if (!user) return <p>Please sign in to view your profile.</p>;
  if (loading) return <p>Loading...</p>;

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded shadow space-y-4">
      <h2 className="text-xl font-semibold">Edit Profile</h2>

      <label className="block">First Name</label>
      <input
        className="border p-2 rounded w-full"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
        placeholder="First Name"
      />

      <label className="block">Last Name</label>
      <input
        className="border p-2 rounded w-full"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
        placeholder="Last Name"
      />

      <label className="block">Nickname</label>
      <input
        className="border p-2 rounded w-full"
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        placeholder="Nickname"
      />

      <button
        onClick={updateProfile}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Save Profile
      </button>

      <h2 className="text-xl font-semibold mt-8">Change Password</h2>
      <button
        onClick={updatePassword}
        disabled={loading}
        className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
      >
        Change Password
      </button>

      {message && <p className="mt-2 text-sm text-red-600">{message}</p>}
    </div>
  );
}
