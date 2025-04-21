import Navbar from "./Navbar";
import { useLocation } from "react-router-dom";

const Layout = ({ children }) => {
	const location = useLocation();
	const isMessagesPage = location.pathname === "/messages";

	return (
		<div className='min-h-screen bg-base-100'>
			<Navbar />
			<main className={`${isMessagesPage ? 'h-[calc(100vh-64px)]' : 'max-w-7xl mx-auto px-4 py-6'}`}>
				{children}
			</main>
		</div>
	);
};
export default Layout;
