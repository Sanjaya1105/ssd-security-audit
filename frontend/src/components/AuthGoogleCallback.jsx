import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axiosInstance from "../config/axiosConfig";

const redirectByRole = (navigate, role) => {
  if (role === "admin" || role === "manager") {
    navigate("/admin/dashboard", { replace: true });
  } else if (role === "cashier") {
    navigate("/cashier/dashboard", { replace: true });
  } else {
    navigate("/homeafterlogging", { replace: true });
  }
};

const AuthGoogleCallback = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Finishing Google sign-in...");

  useEffect(() => {
    const finishLogin = async () => {
      try {
        const response = await axiosInstance.get("/users/me");
        if (!response.data?.user) {
          throw new Error("No user returned");
        }

        localStorage.setItem("user", JSON.stringify(response.data.user));
        toast.success("Signed in with Google");
        redirectByRole(navigate, response.data.user.role);
      } catch (err) {
        console.error("Google callback failed:", err);
        setMessage("Google sign-in failed. Redirecting to login...");
        toast.error("Google sign-in failed");
        navigate("/login?oauth=error", { replace: true });
      }
    };

    finishLogin();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1B2028] text-white">
      <p className="text-sm text-gray-300">{message}</p>
    </div>
  );
};

export default AuthGoogleCallback;
