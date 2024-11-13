// backend/routes/user.js
const express = require('express');

const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../db");
const jwt = require("jsonwebtoken");
require('dotenv').config();
const  { authMiddleware } = require("../middleware");

const signupBody = zod.object({
    username: zod.string().email(),
	firstName: zod.string(),
	lastName: zod.string(),
	password: zod.string()
})

router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const existingUser = await User.findOne({
        username: req.body.username
    })

    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/Incorrect inputs"
        })
    }

    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
    })
    const userId = user._id;

    await Account.create({
        userId,
        balance: 10000
    })

    const token = jwt.sign({
        userId
    }, process.env.JWT_SECRET);

    res.json({
        message: "User created successfully",
        token: token
    })
})


const signinBody = zod.object({
    username: zod.string().email(),
	password: zod.string()
})

router.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }

    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password
    });

    if (user) {
        const token = jwt.sign({
            userId: user._id
        }, process.env.JWT_SECRET);
  
        res.json({
            token: token
        })
        return;
    }

    
    res.status(411).json({
        message: "Error while logging in"
    })
})

const updateBody = zod.object({
	password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})

router.put("/", authMiddleware, async (req, res) => {
    
    const { success } = updateBody.safeParse(req.body)
    
    if (!success) {
        return res.status(411).json({
            message: "Unsuccessfull zod parse"
        })
    }


    await User.updateOne(
        {_id: req.userId},
        req.body
    )
    
    res.json({ 
        msg: "Updated successfully"
    })
})

router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })

    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            _id: user._id
        }))
    })
})

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client("9055900255-nhhulkicr3ivpjog38f85d2n18lgfums.apps.googleusercontent.com"); // Replace with your Google OAuth client ID

// Existing imports and other routes...

router.post("/google-signin", async (req, res) => {
    const { tokenId } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: "9055900255-nhhulkicr3ivpjog38f85d2n18lgfums.apps.googleusercontent.com", // Your app's CLIENT_ID
        });
        const payload = ticket.getPayload();
        const { email, given_name: firstName, family_name: lastName } = payload;

        // Check if the user exists
        let user = await User.findOne({ username: email });
        
        if (!user) {
            // Create a new user if they don't exist
            user = await User.create({ username: email, firstName, lastName });
            const userId = user._id;
            
            // Create an associated account
            await Account.create({
                userId,
                balance: 10000
            })
        
        }
        // Generate your own JWT
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
        res.json({ token });
    } catch (error) {
        console.error("Error verifying Google token", error);
        res.status(401).json({ message: "Google authentication failed" });
    }
});

module.exports = router;