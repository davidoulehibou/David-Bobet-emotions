import express from "express";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { Server } from "socket.io";
import * as HumanJs from "@vladmandic/human";

const config = {
  backend: "webgl",
  modelBasePath: "file://models/",
};
const human = new HumanJs.Human(config);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});


const __dirname = dirname(fileURLToPath(import.meta.url));

io.on("connection", (socket) => {
  console.log("a user connected");


  socket.on("image", async (data) => {
    if (!data) {
        return;
    }
    const buffer = Buffer.from(data);
    const tensor = human.tf.node.decodeImage(buffer);

    console.log('tensor type', tensor);
    const result = await human.detect(tensor);
    
    socket.emit('result', result);
});
  
});



server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
