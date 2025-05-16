"use client";

import { useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import Link from "next/link";

export default function AuthForm() {
  const supabaseClient = useSupabaseClient();
  const [authView, setAuthView] = useState<"sign_in" | "sign_up">("sign_in");

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 lg:px-24 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[#0e6aac] from-0% via-[#000000] via-60% to-[#5d2c00] to-100%"
      style={{ fontFamily: "var(--font-poppins)" }}
    >
      {/* Home button */}
      <div className="w-full max-w-5xl flex justify-start mb-8">
        <Link href="/" aria-label="Home">
          <button className="px-4 py-2 bg-blue-700 hover:bg-blue-800 rounded text-white text-sm">
            Home
          </button>
        </Link>
      </div>

      {/* Auth card */}
      <div className="w-full max-w-md bg-[#1e293b] rounded-lg p-8 shadow-lg text-gray-200">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-300">
          {authView === "sign_in" ? "Sign In" : "Sign Up"}
        </h2>

        <Auth
          supabaseClient={supabaseClient}
          appearance={{ theme: ThemeSupa }}
          providers={[]} // add OAuth if needed
          view={authView}
          // Removed onViewChange as it is not a valid prop
          redirectTo={window.location.origin}
          magicLink={false} // disable magic link, use password auth
        />

        <button
          onClick={() =>
            setAuthView(authView === "sign_in" ? "sign_up" : "sign_in")
          }
          className="mt-6 block mx-auto text-blue-400 hover:text-blue-500 text-sm underline"
        >
          {authView === "sign_in"
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
