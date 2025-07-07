import { io } from "socket.io-client";

export const socket = io("https://backend-panic.softkilla.es", {
  transports: ["websocket"], // o websocket si estás en HTTPS
});
