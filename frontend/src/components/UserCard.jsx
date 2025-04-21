import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { UserCheck, UserPlus, Clock, X } from "lucide-react";
import toast from "react-hot-toast";

function UserCard({ user }) {
	const queryClient = useQueryClient();

	// Get connection status
	const { data: connectionStatus } = useQuery({
		queryKey: ["connectionStatus", user._id],
		queryFn: () => axiosInstance.get(`/connections/status/${user._id}`),
	});

	// Send connection request
	const { mutate: sendConnectionRequest } = useMutation({
		mutationFn: (userId) => axiosInstance.post(`/connections/request/${userId}`),
		onSuccess: () => {
			toast.success("Connection request sent successfully");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
			queryClient.invalidateQueries({ queryKey: ["registeredUsers"] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "Failed to send request");
		},
	});

	// Accept connection request
	const { mutate: acceptRequest } = useMutation({
		mutationFn: (requestId) => axiosInstance.put(`/connections/accept/${requestId}`),
		onSuccess: () => {
			toast.success("Connection request accepted");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
			queryClient.invalidateQueries({ queryKey: ["connectionRequests"] });
			queryClient.invalidateQueries({ queryKey: ["connections"] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "Failed to accept request");
		},
	});

	// Reject/Remove connection
	const { mutate: removeConnection } = useMutation({
		mutationFn: (userId) => axiosInstance.delete(`/connections/${userId}`),
		onSuccess: () => {
			toast.success("Connection removed");
			queryClient.invalidateQueries({ queryKey: ["connectionStatus", user._id] });
			queryClient.invalidateQueries({ queryKey: ["connections"] });
		},
		onError: (error) => {
			toast.error(error.response?.data?.message || "Failed to remove connection");
		},
	});

	const renderConnectionButton = () => {
		const status = connectionStatus?.data?.status;
		const requestId = connectionStatus?.data?.requestId;

		switch (status) {
			case "connected":
				return (
					<div className="flex gap-2 w-full">
						<button className="flex items-center justify-center gap-2 w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors">
							<UserCheck size={18} />
							Connected
						</button>
						<button 
							onClick={() => removeConnection(user._id)}
							className="flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
						>
							<X size={18} />
						</button>
					</div>
				);

			case "pending":
				return (
					<button className="flex items-center justify-center gap-2 w-full bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600 transition-colors">
						<Clock size={18} />
						Pending
					</button>
				);

			case "received":
				return (
					<div className="flex gap-2 w-full">
						<button
							onClick={() => acceptRequest(requestId)}
							className="flex-1 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition-colors"
						>
							Accept
						</button>
						<button
							onClick={() => removeConnection(user._id)}
							className="flex-1 bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
						>
							Reject
						</button>
					</div>
				);

			default:
				return (
					<button
						onClick={() => sendConnectionRequest(user._id)}
						className="flex items-center justify-center gap-2 w-full bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-dark transition-colors"
					>
						<UserPlus size={18} />
						Connect
					</button>
				);
		}
	};

	return (
		<div className='bg-white rounded-lg shadow p-4 flex flex-col items-center transition-all hover:shadow-md'>
			<Link to={`/profile/${user.username}`} className='flex flex-col items-center'>
				<img
					src={user.profilePicture || "/avatar.png"}
					alt={user.name}
					className='w-24 h-24 rounded-full object-cover mb-4 border-2 border-gray-200'
				/>
				<h3 className='font-semibold text-lg text-center'>{user.name}</h3>
			</Link>
			<p className='text-gray-600 text-center'>{user.headline}</p>
			<p className='text-sm text-gray-500 mt-2'>{user.connections?.length} connections</p>
			<div className='mt-4 w-full'>
				{renderConnectionButton()}
			</div>
		</div>
	);
}

export default UserCard;
