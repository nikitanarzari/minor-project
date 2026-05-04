import { Navigate, useLocation } from "react-router-dom";
import { getStoredToken } from "../lib/api.js";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = getStoredToken();
  if (!token) {
    return <Navigate to="/register" replace state={{ from: location.pathname }} />;
  }
  return children;
}
