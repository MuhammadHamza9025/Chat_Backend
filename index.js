// const express = require('express')
// const http = require('http')
// const { Server } = require('socket.io');
// const app = express()
// const server = http.createServer(app)
// const io = new Server(server, {
//     cors: {
//         origin: '*',
//         credentials: 'true'

//     }
// })


// io.on("connection", (socket) => {
//     console.log("connected", socket.id)
//     socket.broadcast.emit("message", `User conneted to socket ${socket.id}`)
//     socket.on('nnmessage', (data) => {
//         console.log(data)
//         io.emit('receive-message', data)
//     })
//     socket.emit('id', socket.id)
//     // socket.on('disconnect', (socket) => {
//     //     console.log(socket.id, 'discpnnectd')
//     // })

// })


// app.get('/', (req, res) => {
//     res.send('hi')
// })



// server.listen(9000,
//     () => {
//         console.log('listening on port : 9000')
//     }
// )


const mongoose = require('mongoose')
const express = require('express')
const User = require('./Model')
const Message = require('./Message_Model')
const Conversation = require('./Conversation_model.js')
const port = 1000;
const jwt = require('jsonwebtoken')
const cookie = require('cookie-parser')
const cookieParser = require('cookie-parser')
const bcrypt = require('bcryptjs')
const { io, app, server, getreceiverid } = require('./Socket')

app.use(cookieParser())
const cors = require('cors');
// const Conversation = require('./Conversation_Model')
// const allowedOrigins = [
//     'http://localhost:5173', // Development URL
//     'https://chat-frontend-5alw.vercel.app/' // Production URL
// ];

// app.use(cors({
//     origin: function (origin, callback) {
//         // allow requests with no origin - like mobile apps or curl requests
//         if (!origin) return callback(null, true);
//         if (allowedOrigins.indexOf(origin) === -1) {
//             const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
//             return callback(new Error(msg), false);
//         }
//         return callback(null, true);
//     },
//     credentials: true
// }));
app.use(cors({
    origin:
        "*",
    credentials: true
}))

app.use(express.json())

mongoose.connect('mongodb+srv://Hamza:2vFfwKwATPXWmJy8@social.0drhd5s.mongodb.net/ChatApp').then(() => { console.log('Database Connected') }).catch((err) => { console.log(err) })



app.post('/', async (req, res) => {

    const user = await User.create(req.body)
    await user.save()
    res.json({ status: 200, message: 'User Registered', success: true })
})
//////////



const middleware = (req, res, next) => {
    // Access the cookie using cookie-parser
    const token = req.cookies?.['Session-Cookie']; // Replace with your cookie name

    if (!token) {
        // Redirect to the login page or home if the token is not found
        console.log('Token not found. Redirecting...');
        res.redirect('/'); // Adjust the route as per your app
    }

    // Verify the token
    jwt.verify(token, 'thisisjesonwebtokenformyproject', (err, decoded) => {
        if (err) {
            console.log('Invalid or expired token. Redirecting...');
            return res.redirect('/'); // Redirect on invalid token
        }

        // Attach user ID to the request object
        req.userid = decoded.id;
        console.log('User ID:', req.userid);

        // Proceed to the next middleware/route handler
        next();
    });
};




/////////////////

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    const hashedpassword = bcrypt.compare(password, user.password)

    if (!user) {
        res.json({ status: 400, message: 'User not found', success: false })
    }

    else if (hashedpassword) {
        const token = jwt.sign({ id: user._id }, 'thisisjesonwebtokenformyproject')
        res.cookie('Session-Cookie', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'Lax',
            maxAge: 3 * 60 * 60 * 1000, // 3 hours
            path: '/'
        })
        res.json({ status: 200, message: 'User  found', success: true, token: token })

    }

})



///////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/getprofile', middleware, async (req, res) => {

    const username = await User.findOne({ _id: req.userid })
    res.json({ status: 200, message: 'User found', success: true, name: username.name, id: username._id })

})
//////////////////////////
app.get('/getallusers', middleware, async (req, res) => {

    const username = await User.findOne({ _id: req.userid })
    const alluser = await User.find()
    const updatedusers = alluser.filter((e) => e._id != req.userid)
    updatedusers.password = undefined;

    res.json({ status: 200, users: updatedusers })

})
//////////////////
app.get('/check-cookie', (req, res) => {
    const sessionCookie = req.cookies;
    console.log('cookie are', sessionCookie)

    if (sessionCookie) {
        res.json({ status: true })
    } else {
        res.redirect('/')
    }
});

// app.get('/check-cookie', (req, res) => {
//     console.log(req.cookies); // Log cookies for debugging

//     const sessionCookie = req.cookies['Session-cookie'];
//     if (sessionCookie) {
//         res.status(200).json({
//             success: true,
//             message: 'Session-cookie is present.',
//             cookieValue: sessionCookie,
//         });
//     } else {
//         res.redirect('/');
//     }
// });

//////////////////
app.post('/convo/:id', middleware, async (req, res) => {
    try {
        const { message } = req.body;
        const receiverId = req.params.id;
        const senderId = req.userid;

        if (!receiverId || !senderId || !message) {
            return res.status(400).json({ status: 400, message: "Invalid input data!" });
        }

        // Create a new message
        const newMessage = await Message.create({ message, receiverId, senderId });

        if (!newMessage) {
            return res.status(500).json({ status: 500, message: "Failed to create the message!" });
        }

        // Find existing conversation or create a new one
        let convo = await Conversation.findOne({
            participants: { $all: [receiverId, senderId] }
        });

        if (!convo) {
            // Create a new conversation
            convo = await Conversation.create({
                participants: [receiverId, senderId],
                message: [newMessage._id]
            });
        } else {
            // Push new message to the conversation
            convo.message.push(newMessage._id);
            const getreverid = getreceiverid(receiverId)

            console.log('iser id', getreverid, receiverId)
            if (getreverid) {
                io.to(getreverid).emit('newMessage', newMessage)
                console.log('sent')
            }
            await convo.save(); // Save the updated document

        }

        res.status(200).json({ status: 200, message: "Message sent successfully!", convo });
    } catch (err) {
        console.error("Error:", err);
        res.status(500).json({ status: 500, message: "Internal Server Error!", error: err.message });
    }
});

///////////////////////////////

app.get('/get/:id', middleware, async (req, res) => {
    try {
        const receiverId = req.params.id;
        const senderId = req.userid;

        // Find the conversation between the sender and receiver
        let convers = await Conversation.find({
            participants: { $all: [receiverId, senderId] }
        }).populate('message');

        if (convers && convers.length > 0) {
            res.json({ messages: convers[0].message, success: true });
        } else {
            res.status(404).json({ message: 'Conversation not found', success: false });
        }

    } catch (err) {
        res.status(500).json({ message: 'Server Error!', success: false });
    }
});



server.listen(port, () => {
    console.log(`Listning to port : ${port}`)
})