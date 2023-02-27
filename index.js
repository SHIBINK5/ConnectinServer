import express from "express";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";

import postRoutes from "./routes/posts.js"
import chatRoutes from "./routes/chat.js"
import MessageRoute from './routes/message.js'

import{register} from "./controllers/auth.js";
import {createPost} from "./controllers/posts.js";
import {verifyToken} from "./middleware/auth.js";

import User from "./models/User.js";
import Post from "./models/Post.js";
import {users,posts} from "./data/index.js";



/* CONFIGURATIONS */

 const __filename = fileURLToPath(import.meta.url);
 const __dirname = path.dirname(__filename);
 dotenv.config();
 const app=express();

 app.use(express.json());
 app.use(helmet());
 app.use(helmet.crossOriginResourcePolicy({policy:"cross-origin"}))
app.use(morgan("common"));
app.use(bodyParser.json({limit:"30mb",extended:true}));
app.use(bodyParser.urlencoded({limit:"30mb",extended:true}));
// app.use(cors({
//   origin:["https://connectins.netlify.app","http://localhost:3000"],
//   credentials:true
// }));
app.options('*',cors());
app.use(cors());

app.use("/assets",express.static(path.join(__dirname,'public/assets')));
import { editProfilePic } from './controllers/users.js';
/*FILE STORAGE*/
const storage = multer.diskStorage({

    destination:function(req,file,cb){
      cb(null,"public/assets");
    },
    filename:function(req,file,cb){
        cb(null,file.originalname);
    },

});
const upload =multer ({storage});  
/* ROUTES WITH FILES */
app.post("/auth/register",upload.single("picture"),register);
app.post("/posts",verifyToken,upload.single("picture"),createPost);
app.post("/users/profilepic-user/:id", upload.single("picture"), editProfilePic)
/*ROUTES */ 
app.use("/auth",authRoutes);
app.use("/users",userRoutes);
app.use("/posts",postRoutes);
app.use("/chat", chatRoutes)
app.use("/message", MessageRoute)


const httpServer=createServer(app);
import {createServer} from 'http';
import {Server} from 'socket.io';


const io=new Server(httpServer,{
  cors:{
    origin:["https://connectins.netlify.app","http://localhost:3000"]
  }
})



let activeUsers = [];


io.on("connection", (socket) => {
    console.log("ddddd",socket.id);   
    // add new User
    socket.on("new-user-add", (newUserId) => {
        // if user is not added previously
        console.log('wwww');
        if (!activeUsers.some((user) => user.userId === newUserId)) {
            activeUsers.push({ userId: newUserId, socketId: socket.id });
            console.log(activeUsers);
        }
        console.log("New User Connected", activeUsers);
        // send all active users to new user
        io.emit("get-users", activeUsers);
    });

    socket.on("disconnect", () => {
        // remove user from active users
        activeUsers = activeUsers.filter((user) => user.socketId !== socket.id);
        console.log("User Disconnected", activeUsers);
        // send all active users to all users
        io.emit("get-users", activeUsers);
    });

    // send message to a specific user
    socket.on("send-message", (data) => {
        const { receiverId } = data;
        const user = activeUsers.find((user) => user.userId === receiverId);
        console.log("Sending from socket to :", receiverId)
        console.log("Data: ", data)
        if (user) {
            io.to(user.socketId).emit("recieve-message", data);
        }
    });
})



/* MONGOOSE SETUP*/
const PORT=process.env.PORT || 6001;
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser:true,
    useUnifiedTopology:true,

  })
.then(() =>{
  httpServer.listen(PORT,() => console.log(`Server Port:${PORT}`));
 
  /* ADD DATA ONE TIME */
  // User.insertMany(users);
  // Post.insertMany(posts);
})
.catch ((error)=>console.log(`${error} did not connect`));
