import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios";
import { Link, useLocation } from "react-router-dom";
import { Bell, Home, LogOut, User, Users, MessageSquare } from "lucide-react";

const Navbar = () => {
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();
  const location = useLocation();

  const { data: notifications } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => axiosInstance.get("/notifications"),
    enabled: !!authUser,
  });

  const { data: connectionRequests } = useQuery({
    queryKey: ["connectionRequests"],
    queryFn: async () => axiosInstance.get("/connections/requests"),
    enabled: !!authUser,
  });

  const { mutate: logout } = useMutation({
    mutationFn: () => axiosInstance.post("/auth/logout"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
  });

  const unreadNotificationCount = notifications?.data?.filter((notif) => !notif.read)?.length ?? 0;
  const unreadConnectionRequestsCount = connectionRequests?.data?.length ?? 0;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Paavai Alumni</h1>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-1 md:gap-4">
            {authUser ? (
              <>
                <Link to="/" className="nav-link flex flex-col items-center justify-center p-2">
                  <Home size={20} />
                  <span className="text-xs hidden md:block mt-1">Home</span>
                </Link>

                <Link to="/network" className="nav-link flex flex-col items-center justify-center p-2 relative">
                  <Users size={20} />
                  <span className="text-xs hidden md:block mt-1">My Network</span>
                  {unreadConnectionRequestsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadConnectionRequestsCount}
                    </span>
                  )}
                </Link>

                <Link to="/messages" className="nav-link flex flex-col items-center justify-center p-2">
                  <MessageSquare size={20} />
                  <span className="text-xs hidden md:block mt-1">Messages</span>
                </Link>

                <Link to="/notifications" className="nav-link flex flex-col items-center justify-center p-2 relative">
                  <Bell size={20} />
                  <span className="text-xs hidden md:block mt-1">Notifications</span>
                  {unreadNotificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadNotificationCount}
                    </span>
                  )}
                </Link>

                <Link to={`/profile/${authUser.username}`} className="nav-link flex flex-col items-center justify-center p-2">
                  <User size={20} />
                  <span className="text-xs hidden md:block mt-1">Me</span>
                </Link>

                <button
                  onClick={() => logout()}
                  className="nav-link flex flex-col items-center justify-center p-2 text-gray-600 hover:text-red-500"
                >
                  <LogOut size={20} />
                  <span className="text-xs hidden md:block mt-1">Logout</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Join now
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;