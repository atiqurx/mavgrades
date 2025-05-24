"use client";

import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { IoHomeOutline } from "react-icons/io5";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export default function AuthForm() {
  const supabase = useSupabaseClient();
  const user = useUser();
  const router = useRouter();

  // Modes: sign_in | sign_up_step1 | sign_up_step2
  const [mode, setMode] = useState<
    "sign_in" | "sign_up_step1" | "sign_up_step2"
  >("sign_in");

  // STEP 1 fields + errors
  const [suEmail, setSuEmail] = useState("");
  const [suPassword, setSuPassword] = useState("");
  const [suConfirm, setSuConfirm] = useState("");
  const [suError, setSuError] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // STEP 2 OTP + error
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect home if already signed in
  useEffect(() => {
    if (user) router.push("/");
  }, [user, router]);

  // STEP 1: request signup → send OTP
  async function handleSignUpStep1(e: React.FormEvent) {
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
    if (suPassword !== suConfirm) {
      setSuError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.signUp({
      email: suEmail,
      password: suPassword,
    });
    setIsLoading(false);

    if (error) {
      setSuError(error.message);
    } else {
      setMode("sign_up_step2");
    }
  }

  // STEP 2: verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setOtpError("");

    if (!otp.trim()) {
      setOtpError("Enter the 6-digit code.");
      return;
    }

    setIsLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      email: suEmail,
      token: otp.trim(),
      type: "signup",
    });
    setIsLoading(false);

    if (error) {
      setOtpError(error.message);
    } else {
      router.push("/");
    }
  }

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
        {/* Header */}
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-300">
          {mode === "sign_in"
            ? "Sign In"
            : mode === "sign_up_step1"
            ? "Sign Up"
            : "Enter Verification Code"}
        </h2>

        {/* SIGN IN (built-in) */}
        {mode === "sign_in" && (
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
            showLinks={false} // hide built-in footer
          />
        )}

        {/* SIGN UP STEP 1 */}
        {mode === "sign_up_step1" && (
          <form onSubmit={handleSignUpStep1} className="space-y-4">
            <input
              type="email"
              placeholder="you@mavs.uta.edu"
              value={suEmail}
              onChange={(e) => setSuEmail(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400"
              required
            />

            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                placeholder="Password"
                value={suPassword}
                onChange={(e) => setSuPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400"
              >
                {showPwd ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>

            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={suConfirm}
                onChange={(e) => setSuConfirm(e.target.value)}
                className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center text-gray-400"
              >
                {showConfirm ? <AiOutlineEyeInvisible /> : <AiOutlineEye />}
              </button>
            </div>

            {suError && <p className="text-red-400 text-sm">{suError}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50"
            >
              {isLoading ? "Sending code…" : "Send verification code"}
            </button>
          </form>
        )}

        {/* SIGN UP STEP 2: OTP */}
        {mode === "sign_up_step2" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-300">
              We’ve sent a 6-digit code to <strong>{suEmail}</strong>.
            </p>
            <input
              type="text"
              placeholder="Enter code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-2 rounded bg-gray-800 text-white placeholder-gray-400"
              required
            />
            {otpError && <p className="text-red-400 text-sm">{otpError}</p>}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 bg-green-600 hover:bg-green-700 rounded text-white font-semibold disabled:opacity-50"
            >
              {isLoading ? "Verifying…" : "Verify code"}
            </button>
          </form>
        )}

        {/* Toggle link */}
        {mode !== "sign_up_step2" && (
          <button
            onClick={() =>
              setMode((m) => (m === "sign_in" ? "sign_up_step1" : "sign_in"))
            }
            className="mt-6 block mx-auto text-blue-400 hover:text-blue-500 text-sm underline"
          >
            {mode === "sign_in"
              ? "Don't have an account? Sign Up"
              : "Already have an account? Sign In"}
          </button>
        )}

        {/* Footer note */}
        {mode !== "sign_up_step2" && (
          <p className="mt-4 text-xs text-gray-400 text-center">
            * A verification email with a 6-digit code will be sent on sign up.
          </p>
        )}
      </div>
    </div>
  );
}
