// backend/routes/account.js
const express = require('express');
const { authMiddleware } = require('../middleware');
const { Account, Transaction } = require('../db');
const { default: mongoose } = require('mongoose');

const router = express.Router();

router.get("/balance", authMiddleware, async (req, res) => {
    const account = await Account.findOne({
        userId: req.userId
    });

    res.json({
        balance: account.balance
    })
});

router.post("/transfer", authMiddleware, async (req, res) => {
    const { amount, to } = req.body;
    const from = req.userId;

    // Fetch accounts
    const fromAccount = await Account.findOne({ userId: from });
    const toAccount = await Account.findOne({ userId: to });

    if (!fromAccount || fromAccount.balance < amount) {
        return res.status(400).json({
            message: "Insufficient balance"
        });
    }

    if (!toAccount) {
        return res.status(400).json({
            message: "Invalid account"
        });
    }

    // Perform the transfer
    fromAccount.balance -= amount;
    toAccount.balance += amount;

    await fromAccount.save();
    await toAccount.save();

    // Log the transaction
    const trans = new Transaction({
        from: from,
        to: to,
        amount: amount,
        type: 'outgoing'
    });

    await trans.save();

    res.json({
        message: "Transfer successful"
    });
});
router.get('/history',authMiddleware, async(req,res)=>{
    try{
        const userId = req.userId

        const transactions = await Transaction.find({
            $or: [{from:userId}, {to:userId}] //This is an array of two conditions. MongoDB will return documents where either condition is true.
        })
        .populate('from','firstName lastName')
        .populate('to', 'firstName lastName')
        .sort({date:-1}); 

        res.json(transactions)

    }catch(error){
        res.status(500).json({msg:"Failed"})
    }
})
module.exports = router;