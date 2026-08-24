import { Navigate } from "react-router-dom";
import HomePage from "../pages/client/HomePage";

const HomeRedirect = () => {
  const userRole = localStorage.getItem("userRole");

 
  if (userRole === "admin") {
    return <Navigate to="/categories" replace />;
  }

 
  return <HomePage />;
};

export default HomeRedirect;