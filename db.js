// backend/db.js
const mongoose = require('mongoose');
require('dotenv').config();
try{
    mongoose.connect(process.env.MONGO_URI)
    console.log("Successfully connected to DB")
}catch(error){
    console.log(error)
}
// Create a Schema for Users
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minLength: 3,
        maxLength: 30
    },
    password: {
        type: String,
        required: false,
        minLength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxLength: 50
    }
});

const accountSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model
        ref: 'User',
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
});

const transactionSchema = new mongoose.Schema({
    from: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model for sender
        ref: 'User',
        required: true
    },
    to: {
        type: mongoose.Schema.Types.ObjectId, // Reference to User model for recipient
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        default: Date.now // Automatically set the current date
    },
    type: {
        type: String,
        enum: ['incoming', 'outgoing'], // Define the type of transaction
        required: true
    }
})




const Account = mongoose.model('Account', accountSchema);
const User = mongoose.model('User', userSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = {
	User,
    Account,
    Transaction
};