"use client";

import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { IoHomeOutline } from "react-icons/io5";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export default function AuthForm() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");

  // Sign‐up fields + error
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suError, setSuError] = useState("");

  // Redirect home when already signed in
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  // Custom sign-up handler with domain check
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuError("");
    if (!suEmail.endsWith("@mavs.uta.edu")) {
      setSuError("You must use a @mavs.uta.edu email.");
      return;
    }
    if (suPassword.length < 6) {
      setSuError("Password must be at least 6 characters.");
      return;
    }
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPassword,
    });
    if (error) setSuError(error.message);
  };

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center px-4 lg:px-24 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0e6aac] from-0% via-[#000000] via-60% to-[#5d2c00] to-100% ${poppins.variable}`}
    >
      {/* Home icon */}
      <div className="w-full max-w-5xl flex justify-start py-6">
        <Link href="/" aria-label="Home">
          <IoHomeOutline className="text-2xl text-gray-300 hover:text-white transition-colors" />
        </Link>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-[#1e293b] rounded-lg p-8 shadow-lg text-gray-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-300">
          {mode === "sign_in" ? "Sign In" : "Sign Up"}
        </h2>

        {mode === "sign_in" ? (
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    inputText: "#FFFFFF",
                    inputLabelText: "#FFFFFF",
                    inputPlaceholder: "#BBBBBB",
                  },
                },
              },
            }}
            providers={[]}
            view="sign_in"
            redirectTo={window.location.origin}
            magicLink={false}
          />
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <input
              type="email"
              placeholder="you@mavs.uta.edu"
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400"
              required
            />
            <input
              type="password"
              placeholder="Password (min 6 chars)"
              value={suPassword}
              onChange={(e) => setSuPassword(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400"
              required
              minLength={6}
            />
            {suError && <p className="text-red-400 text-sm">{suError}</p>}
            <button
              type="submit"
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold"
            >
              Sign Up
            </button>
          </form>
        )}

        {/* Toggle link */}
        <button
          onClick={() => {
            setSuError("");
            setMode((m) => (m === "sign_in" ? "sign_up" : "sign_in"));
          }}
          className="mt-6 block mx-auto text-blue-400 hover:text-blue-500 text-sm underline"
        >
          {mode === "sign_in"
            ? "Don't have an account? Sign Up"
            : "Already have an account? Sign In"}
        </button>

        <p className="mt-4 text-xs text-gray-400 text-center">
          * A verification email will be sent on sign up.
        </p>
      </div>
    </div>
  );
}
