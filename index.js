const _ = require('lodash');
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
let createHash = require('hash-generator');
const port = 7000;
let bankDetails = [];

app.use(bodyParser.urlencoded({
    extended: false
}));
app.use(express.json());



app.get('/getBankDetails', (req, res) => {
    res.send(bankDetails);
})

app.get('/newAccount', (req, res) => {
    let hashLength = 16;
    let hash = createHash(hashLength);
    let account = {
        accountNumber: hash,
        Savings: 0,
        Current: 0,
        BasicSavings: 5000
    };
    bankDetails.push(account);

    res.status(200).send({
        message: `Your account ${account.accountNumber} has been succesfully created with savings amount as 500 which you used to create account`
    })
});


app.post('/accountTransfer', (req, res) => {
    const incomingBody = req.body;
    const fromAccount = incomingBody.fromAccountId;
    const toAccount = incomingBody.toAccountId;
    const amount = incomingBody.amount;
    let sender, receiver;
    var today = new Date();
    var time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    let outputResponse = {
        senderAccount: {
            accountNumber: fromAccount,
            balance: 0
        },
        receiverAccount : {
            accountNumber: toAccount,
            balance : 0
        },
        timestamp:time
    }

    if ((!_.isEmpty(incomingBody) || !_.isUndefined(incomingBody)) &&
        (!_.isEmpty(fromAccount) || !_.isUndefined(fromAccount)) &&
        (!_.isEmpty(toAccount) || !_.isUndefined(toAccount)) && amount > 0) {
        if (fromAccount == toAccount) {
            res.status(500).send({
                errorCode: 'ACN_03',
                errorMessage: 'From and to Account are should not be equal'
            });
        } else {
            if (bankDetails.length > 0) {
                _.forEach(bankDetails, (toAccountDetails) => {
                    if (toAccountDetails.accountNumber == fromAccount) {
                        sender = true;

                    } else if (toAccountDetails.accountNumber == toAccount) {
                        receiver = true;
                    }
                })
                if (sender && receiver) {
                    bankDetails.map((account) => {
                        let senderResponse;
                        
                        if (account.accountNumber == fromAccount) {
                            if (account.BasicSavings <= 50000 * 100) {
                                let total = account.BasicSavings + account.Current + account.Savings;
                                if (total > amount) {
                                    console.log("all details are correct")
                                    account.BasicSavings -= amount;
                                    senderResponse = true;
                                    outputResponse.senderAccount.balance = account.BasicSavings
                                    console.log('sender account is',account)
                                } else {
                                    res.status(500).send({
                                        errorCode: 'ACN_05',
                                        errorMessage: 'No enough balance in your account'
                                    });
                                }
                            } else {
                                res.status(500).send({
                                    errorCode: 'ACN_04',
                                    errorMessage: 'Amount should not be greater than 50000'
                                });
                            }
                        }
                        
                        if(senderResponse) {
                            bankDetails.map((acc) => {
                                if(acc.accountNumber == toAccount) {
                                    acc.BasicSavings += amount;
                                    outputResponse.receiverAccount.balance = acc.BasicSavings
                                    console.log('receiver account ', acc)
                                    res.status(200).send({message:"Transaction Successful", outputResponse})
                                }
                            })
                        }
                       
                    })

                } else {
                    res.status(500).send({
                        errorCode: 'ACN_02',
                        errorMessage: 'Account details not found'
                    });
                }
            } else {
                res.status(500).send({
                    errorCode: 'ACN_07',
                    errorMessage: 'No accounts found please create a new account'
                });
            }
        }

    } else {
        res.status(500).send({
            errorCode: 'ACN_01',
            errorMessage: 'Input parameters missing/Invalid'
        });
    }

});

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
});
