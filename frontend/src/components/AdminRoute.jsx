import { Navigate, Outlet } from "react-router-dom";

const AdminRoute = ({ allowedRoles = ['admin'] }) => {
 
  const userRole = localStorage.getItem("userRole");

  if (userRole && allowedRoles.includes(userRole)) {
    return <Navigate to="/categories" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;