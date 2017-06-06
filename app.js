var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
var cors = require('cors');
app.use(cors());
var DButilsAzure = require('./DBUtils');
var squel = require("squel");

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var musicalIns = require('./routes/musicalsInstruments');
var admins = require('./routes/Admin');
app.use(cors());
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);


//*****************************************************************************************
//start listen
app.listen(3100, function () {
    console.log('I am listening on localhost:3100');
    // server is open and listening on port 3100, to access: localhost:3100 in any browser.
});

app.use(function (req, res, next) {
        next();
});

//register request
app.use('/users', users);
app.use('/musicalsInstruments', musicalIns);
app.use('/Admin', admins);


//login
app.post('/login', function (req, res, next) {
    var email = req.body.mail;
    var pass = req.body.pass;
    var query = loginQuery(email, pass);
    DButilsAzure.Select(query)
        .then(function (ans) {
            if (ans.length === 0) {
                res.send("wrong email or Password!");
                console.log("wrong email or Password!");
            }
            else {
                res.send(ans);   //send the mail back to the client
                console.log("login response: " + JSON.stringify(ans));
            }
        })
        .catch(function (reason) {
            console.log(reason + ", login fail!");
            res.send(reason);
        });
});

//login query
function loginQuery(email, pass) {
    return squel.select()
        .field("Mail")
        .from("ClientsTable")
        .where("Mail = " + "'" + email + "'")
        .where("Password = " + "'" + pass + "'")
        .toString();
}

//*******************Bonus part - Admins******************//
app.post('/buyProductsInCart', function (req, res) {
    var totPrice = 0;
    var orderId = 3;
    var ordersQuery = "";
    var queryProducts = "";
    getDataFromInventory()
        .then(insertToOrders)
        .then(insertProductsToOrder)
        .then(function (ans) {
            res.send("buying completed");
            console.log("buying completed");
        })
        .catch(function (reason) {
            res.send("buying process failed" + reason);
            console.log("buying completed failed" + reason);
        });
    function getDataFromInventory() {
        return new Promise(function (resolve, reject) {
            var arr = req.body;
            queryProducts = "INSERT INTO ProductsInOrder (OrderID, ProductID, Amount) VALUES ";
            arr.forEach(function (item) {
                if (checkInInventory(item.productID, item.amount)) {
                    totPrice = totPrice + (item.price * item.amount);
                    queryProducts = queryProducts + "(" + "'" + orderId.toString() + "'," + "'" + item.productID + "' '" + item.amount + "'), ";
                }
            });
            queryProducts = queryProducts.substring(0, queryProducts.length - 2) + ";";
            ordersQuery = getOrderQuery(orderId, totPrice);
        })
    }

    function insertToOrders(response) {
        return new Promise(function (resolve, reject) {
            DButilsAzure.Insert(ordersQuery)
                .then(function (ans) {
                    res.send("insertToOrder completed");
                    console.log("insertToOrder completed");
                })
                .catch(function (reason) {
                    res.send("insertToOrder process failed" + reason);
                    console.log("insertToOrder process failed" + reason);
                });
        });
    }


    function insertProductsToOrder(response) {
        return new Promise(function (resolve, reject) {
            DButilsAzure.Insert(connection, queryProducts)
                .then(function (ans) {
                    res.send("insertProductsToOrder completed");
                    console.log("insertProductsToOrder completed");
                })
                .catch(function (reason) {
                    res.send("insertProductsToOrder process failed" + reason);
                    console.log("insertProductsToOrder process failed" + reason);
                });
        });
    }
})

function checkInInventory(productID, amount) {
    var query = squel.select()
        .from("Musical_instrument")
        .where("Musical_instrument = " + "'" + productID + "'")
        .where("StockAmount >= " + "'" + amount + "'")
        .toString();
    DButilsAzure.Select(query)
        .then(function (answer) {
            return true;
        })
        .catch(function (reason) {
            console.log("check inventory failed!");
            return false;
        })
}

function getOrderQuery(orderID, totPrice) {
    return squel.insert().into("Order")
        .set('OrderID', orderID)
        .set('ClientMail', "lir@lir")
        .set('Time', "GETDATE()")
        .set('TotalPrice', totPrice)
        .set('Details', "Order details here...")
        .toString();
}

// function getTotPrice(productID, amount){
//     var query = squel.select()
//         .field("Price")
//         .from("Musical_instrument")
//         .where("Musical_instrument = " + "'" + productID + "'")
//         .toString();
//     DButilsAzure.Select(connection,query)
//         .then(function(answer){
//             return (answer*amount);
//         })
//         .catch(function (reason) {
//             console.log("get total price failed!");
//         })
// }
//get all clients
app.get('/getClients', function (req, res) {
    var query = squel.select()
        .from("ClientsTable")
        .toString();
    DButilsAzure.Select(query)
        .then(function (ans) {
            res.send(ans);
            console.log("getClients response: " + ans);
        })
        .catch(function (reason) {
            console.log(reason + ", getClients fail!");
            res.send(reason);
        });
});


//Adduser *******************************************
app.post('/addUserByAdmin', function (req, res) {
    req.redirect('/registerUser');
});


module.exports = app;
