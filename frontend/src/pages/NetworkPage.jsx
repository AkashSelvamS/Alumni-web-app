import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import Sidebar from "../components/Sidebar";
import { UserPlus, Users as UsersIcon } from "lucide-react";
import UserCard from "../components/UserCard";

const NetworkPage = () => {
	const { data: user } = useQuery({ queryKey: ["authUser"] });

	const { data: connectionRequests } = useQuery({
		queryKey: ["connectionRequests"],
		queryFn: () => axiosInstance.get("/connections/requests"),
	});

	const { data: connections } = useQuery({
		queryKey: ["connections"],
		queryFn: () => axiosInstance.get("/connections"),
	});

	const { data: registeredUsers } = useQuery({
		queryKey: ["registeredUsers"],
		queryFn: () => axiosInstance.get("/users/suggestions"),
	});

	return (
		<div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
			<div className='col-span-1 lg:col-span-1'>
				<Sidebar user={user} />
			</div>
			<div className='col-span-1 lg:col-span-3'>
				<div className='bg-secondary rounded-lg shadow p-6 space-y-8'>
					<h1 className='text-2xl font-bold'>My Network</h1>

					{/* Connection Requests Section */}
					<div>
						<h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
							<UserPlus size={24} className='text-primary' />
							Connection Requests
							{connectionRequests?.data?.length > 0 && (
								<span className='bg-primary text-white text-sm px-2 py-1 rounded-full'>
									{connectionRequests.data.length}
								</span>
							)}
						</h2>
						
						{connectionRequests?.data?.length > 0 ? (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{connectionRequests.data.map((request) => (
									<UserCard key={request.sender._id} user={request.sender} />
								))}
							</div>
						) : (
							<div className='bg-white rounded-lg p-6 text-center'>
								<UserPlus size={48} className='mx-auto text-gray-400 mb-4' />
								<h3 className='text-lg font-semibold mb-2'>No Pending Requests</h3>
								<p className='text-gray-600'>You don&apos;t have any pending connection requests.</p>
							</div>
						)}
					</div>

					{/* Current Connections Section */}
					<div>
						<h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
							<UsersIcon size={24} className='text-primary' />
							My Connections
							{connections?.data?.length > 0 && (
								<span className='bg-primary text-white text-sm px-2 py-1 rounded-full'>
									{connections.data.length}
								</span>
							)}
						</h2>
						
						{connections?.data?.length > 0 ? (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{connections.data.map((connection) => (
									<UserCard key={connection._id} user={connection} />
								))}
							</div>
						) : (
							<div className='bg-white rounded-lg p-6 text-center'>
								<UsersIcon size={48} className='mx-auto text-gray-400 mb-4' />
								<h3 className='text-lg font-semibold mb-2'>No Connections Yet</h3>
								<p className='text-gray-600'>Start connecting with other users to grow your network!</p>
							</div>
						)}
					</div>

					{/* People You May Know Section */}
					<div>
						<h2 className='text-xl font-semibold mb-4 flex items-center gap-2'>
							<UsersIcon size={24} className='text-primary' />
							People You May Know
						</h2>
						
						{registeredUsers?.data?.length > 0 ? (
							<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
								{registeredUsers.data.map((user) => (
									<UserCard key={user._id} user={user} />
								))}
							</div>
						) : (
							<div className='bg-white rounded-lg p-6 text-center'>
								<UsersIcon size={48} className='mx-auto text-gray-400 mb-4' />
								<h3 className='text-lg font-semibold mb-2'>No Suggestions Available</h3>
								<p className='text-gray-600'>Check back later for new connection suggestions.</p>
							</div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default NetworkPage;
