"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "./firebase";
import useAuth from "./hooks/useauth";

export default function Page() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false); // Local loading state for login action

  useEffect(() => {
    if (!loading && user) {
      router.push("/client");
    }
  }, [user, loading, router]);

  const handleLogin = async (e: any) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Set loading to true at the start of the login process
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Logged in successfully");
      console.log(auth.currentUser);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false); // Reset loading state after the login process
    }
  };

  if (loading) {
    return (
      <div className="z-20 w-full h-full flex justify-center items-center mt-56">
        <img src="loading.svg" className="size-20" alt="loading1...." />
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-5 shadow-lg rounded-lg w-full max-w-md mx-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">Hello! <span className="text-[#ff820d]">Businessman</span></h1>
        {error && (
          <div className="bg-red-100 text-red-600 p-3 rounded mb-4 text-center">
            {error}
          </div>
        )}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-600">
              Email / Username
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 px-2 block w-full py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-2 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`w-[15vh] xl:w-[20vh] py-2 px-4 font-semibold rounded-lg transition duration-300 ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {isLoading ? "Loading..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
