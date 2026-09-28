import {Server} from "socket.io";
let io;
export function configureSockets(httpServer) {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || "http://localhost:5173", methods: ["GET", "POST"] } });
  io.on("connection", (socket) => {
    socket.on("join_business", (businessId) => socket.join(`business:${businessId}`));
    socket.on("leave_business", (businessId) => socket.leave(`business:${businessId}`));
  });
  return io;
}
export function emitQueueUpdated(businessId, queue) {
  io?.to(`business:${businessId}`).emit("queue_updated", queue);
}