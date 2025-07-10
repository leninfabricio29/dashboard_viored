import { io } from "socket.io-client";

export const socket = io("https://apipanic.viryx.net", {
  transports: ["websocket"], // o websocket si estás en HTTPS
});
