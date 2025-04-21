import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { io } from "socket.io-client";
import { axiosInstance } from "../lib/axios";
import { MessageSquare, Send } from "lucide-react";
import toast from "react-hot-toast";

const MessagesPage = () => {
  const [socket, setSocket] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [typing, setTyping] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState({});
  const messageEndRef = useRef(null);

  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const { data: connections } = useQuery({
    queryKey: ["connections"],
    queryFn: async () => {
      const res = await axiosInstance.get("/connections");
      return res.data;
    },
    enabled: !!authUser,
  });

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000");
    setSocket(newSocket);

    return () => newSocket.close();
  }, []);

  useEffect(() => {
    if (!socket || !authUser) return;

    socket.emit("user_connected", authUser._id);

    socket.on("receive_message", ({ message, from, sender }) => {
      if (from !== selectedUser?._id) {
        toast.custom((t) => (
          <div className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <img
                    className="h-10 w-10 rounded-full"
                    src={sender.profilePicture || "/avatar.png"}
                    alt={sender.name}
                  />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {sender.name}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {message}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => {
                  setSelectedUser(sender);
                  toast.dismiss(t.id);
                }}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary-dark focus:outline-none"
              >
                View
              </button>
            </div>
          </div>
        ), {
          duration: 5000,
          position: 'top-right',
        });

        setUnreadMessages(prev => ({
          ...prev,
          [from]: (prev[from] || 0) + 1
        }));
      }

      if (from === selectedUser?._id) {
        setMessages((prev) => [...prev, {
          content: message,
          sender: from,
          createdAt: new Date().toISOString()
        }]);
      }
    });

    socket.on("user_typing", ({ from }) => {
      if (from === selectedUser?._id) {
        setTyping(true);
        setTimeout(() => setTyping(false), 1000);
      }
    });

    return () => {
      socket.off("receive_message");
      socket.off("user_typing");
    };
  }, [socket, authUser, selectedUser]);

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await axiosInstance.get(`/messages/${selectedUser._id}`);
        const sortedMessages = res.data.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        setMessages(sortedMessages);
        setUnreadMessages(prev => ({
          ...prev,
          [selectedUser._id]: 0
        }));
      } catch (error) {
        console.error("Error fetching messages:", error);
        toast.error("Failed to load messages");
      }
    };

    fetchMessages();
  }, [selectedUser]);

  const handleSendMessage = async () => {
    if (!message.trim() || !selectedUser) return;

    try {
      const res = await axiosInstance.post("/messages", {
        receiverId: selectedUser._id,
        content: message.trim()
      });

      setMessages((prev) => [...prev, {
        ...res.data,
        sender: authUser._id
      }]);

      socket.emit("private_message", {
        to: selectedUser._id,
        message: message.trim(),
        from: authUser._id,
        sender: authUser
      });
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  const handleTyping = () => {
    if (!selectedUser) return;
    socket.emit("typing", {
      to: selectedUser._id,
      from: authUser._id,
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex h-[calc(100vh-120px)] gap-4 bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Connections list */}
        <div className="w-1/3 lg:w-1/4 border-r border-gray-200">
          <div className="p-4 border-b border-gray-200 bg-white">
            <h2 className="text-2xl font-bold text-gray-800">Messages</h2>
          </div>
          
          <div className="overflow-y-auto h-[calc(100vh-180px)] p-2">
            {connections?.map((connection) => (
              <button
                key={connection._id}
                className={`w-full p-4 rounded-xl flex items-center gap-3 transition-all duration-200 mb-2 
                  ${selectedUser?._id === connection._id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-gray-50 border-transparent"
                  } border-2`}
                onClick={() => {
                  setSelectedUser(connection);
                  setUnreadMessages(prev => ({
                    ...prev,
                    [connection._id]: 0
                  }));
                }}
              >
                <div className="relative">
                  <img
                    src={connection.profilePicture || "/avatar.png"}
                    alt={connection.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                  />
                  {unreadMessages[connection._id] > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                      {unreadMessages[connection._id]}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold block text-gray-900">{connection.name}</span>
                  <span className="text-sm text-gray-500">Click to start chatting</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {selectedUser ? (
            <div className="h-full flex flex-col">
              {/* Chat header */}
              <div className="p-4 border-b bg-white shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={selectedUser.profilePicture || "/avatar.png"}
                      alt={selectedUser.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{selectedUser.name}</h3>
                    <p className="text-sm text-gray-500">Online</p>
                  </div>
                </div>
              </div>

              {/* Messages area */}
              <div className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-gray-50 to-gray-100">
                <div className="space-y-4">
                  {messages.map((msg, idx) => {
                    const isMyMessage = msg.sender === authUser._id || msg.sender._id === authUser._id;
                    
                    return (
                      <div
                        key={idx}
                        className={`flex items-end gap-2 ${
                          isMyMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        {!isMyMessage && (
                          <img
                            src={selectedUser.profilePicture || "/avatar.png"}
                            alt={selectedUser.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        )}

                        <div
                          className={`max-w-[70%] p-3 shadow-sm ${
                            isMyMessage
                              ? "bg-primary text-white rounded-t-xl rounded-l-xl rounded-br-sm"
                              : "bg-white text-gray-800 rounded-t-xl rounded-r-xl rounded-bl-sm"
                          }`}
                        >
                          <p>{msg.content}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(msg.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>

                        {isMyMessage && (
                          <img
                            src={authUser.profilePicture || "/avatar.png"}
                            alt={authUser.name}
                            className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                          />
                        )}
                      </div>
                    );
                  })}

                  {typing && (
                    <div className="flex items-center gap-2">
                      <img
                        src={selectedUser.profilePicture || "/avatar.png"}
                        alt={selectedUser.name}
                        className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm"
                      />
                      <div className="bg-white rounded-full px-4 py-2 shadow-sm">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messageEndRef} />
              </div>

              {/* Message input */}
              <div className="p-4 bg-white border-t">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyUp={handleTyping}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Type your message here..."
                    className="flex-1 p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors shadow-lg hover:shadow-xl active:scale-95 transform"
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 bg-gradient-to-b from-gray-50 to-gray-100">
              <div className="bg-white p-6 rounded-full mb-4 shadow-md">
                <MessageSquare size={48} />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Your Messages</h3>
              <p className="text-sm">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage; 