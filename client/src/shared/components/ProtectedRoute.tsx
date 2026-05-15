import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "../../app/hooks";
import { useMeQuery } from "../../services/api/baseApi";

export function ProtectedRoute() {
  const location = useLocation();
  const auth = useAppSelector((state) => state.auth);
  const { data, isLoading, isFetching } = useMeQuery(undefined, {
    skip: auth.status === "unauthenticated",
  });
  const user = auth.user || data?.data || data?.user;

  if (auth.status === "unknown" && (isLoading || isFetching)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-zinc-400">
        Checking your session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
