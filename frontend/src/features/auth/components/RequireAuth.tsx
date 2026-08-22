import { Navigate, Outlet, useLocation } from "react-router-dom";
import { LoadingState } from "../../../components/LoadingState";
import { useCurrentCustomer } from "../api/authApi";

export function RequireAuth() {
  const location = useLocation();
  const customerQuery = useCurrentCustomer();

  if (customerQuery.isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <LoadingState label="Checking your account" />
      </div>
    );
  }

  if (customerQuery.isError || !customerQuery.data) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
