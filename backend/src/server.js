import "dotenv/config";
import http from "http";
import app from "./app.js";
import { connectDatabase } from "./config/db.js";
import { configureSockets } from "./sockets/queue.socket.js";
const PORT = process.env.PORT || 5000;
async function startServer() {
  await connectDatabase();
  const httpServer = http.createServer(app);
  configureSockets(httpServer);
  httpServer.listen(PORT, () => {
    console.log(`QueueWise API running on port ${PORT}`);
  });
}
startServer();