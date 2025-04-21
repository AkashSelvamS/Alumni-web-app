// When handling private messages
socket.on("private_message", async ({ to, message, from, sender }) => {
  // Emit the message with sender information
  io.to(to).emit("receive_message", {
    message,
    from,
    sender // Include sender information for notifications
  });
}); 