import React from "react";
import { Navigate } from "react-router-dom";

const RequireRole = ({ roles, children }) => {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    user = null;
  }

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default RequireRole;
