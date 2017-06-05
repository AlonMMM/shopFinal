var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var Connection = require('tedious').Connection;
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
var cors = require('cors');
app.use(cors());
var DButilsAzure = require('./DBUtils');
var squel = require("squel");
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

var users = require('./routes/users');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var index = require('./routes/index');
var users = require('./routes/users');

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
//*****************************************************************************************
//connect to the SQL azure server

//*****************************************************************************************

//*****************************************************************************************
app.use(function (req, res, next) {
        next();
});

//register request
app.use('/users', users);
app.use('/musicalsInstruments', users);

//*******************Bonus part - Admins******************//
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
            if (reason.message.includes("Violation of PRIMARY KEY constraint")) {
                console.log("Mail  already used! **");
                res.send("Mail  already used!");
            }
            else {
                console.log("Server Problem, register fail!");
                res.send("Server Problem, register fail!");
            }
        });
});

//add product ********************
app.post('/addProduct', function (req, res) {
        var instrumentID = req.body.instrumentID;
        var query = squel.insert().into("Musical_instrument")
            .set('Musical_instrument', req.body.instrumentID)
            .set('ManufacturID', req.body.manufacturID)
            .set('Year', req.body.year)
            .set('Description', req.body.description)
            .set('PicturePath', req.body.picturePath)
            .set('PublishDate', "GETDATE()", {
                dontQuote: true
            })
            .set('Price', req.body.price)
            .set('StokAmount', req.body.amount)
            .set('Delivery_time', req.body.price)
            .set('Sales_number', 0)
            .toString();
        DButilsAzure.Select(query)
            .then(insertProductCategory)
            .then(function (ans) {
                res.send(true);
                console.log("addProduct response: " + true);
            })
            .catch(function (reason) {
                if (reason.message.includes("Violation of PRIMARY KEY constraint")) {  //if the product exist we only need to update inv
                    console.log("Product  already exist! Updating**");
                    var updatePromises = updateInvQuery();   //updete the amount of the inv for specific product
                    updatePromises.then(function (ans) {
                        res.send(ans);
                        console.log("updateInvQuery response:" + ans);
                    })
                        .catch(function (reason) {
                            console.log(reason + ", updateInvQuery fail!");
                            res.send(reason);
                        });
                }
                else {
                    console.log("Server Problem, addProduct fail!");
                    res.send(false);
                }
            });

        //function to insert the category to tnother table
        function insertProductCategory(response) {
            return new Promise(function (resolve, reject) {
                console.log("insertProductCategory**")
                var insertCategory = squel.insert().into("InstrumentCategory")
                    .set('Musical_instrument', req.body.instrumentID)
                    .set('CategoryName', req.body.categoryName)
                    .toString();
                DButilsAzure.Insert(insertCategory)
                    .then(function (ans) {
                        console.log(ans);
                        resolve(true);

                    })
                    .catch(function (reason) {
                        console.log(reason);
                        res.send(false);
                    });

            });
        }

        //function to updateInv if the product is exist
        function updateInvQuery() {
            return new Promise(function (resolve, reject) {
                console.log("updateInvQuery promise!");
                var invQuery = squel.update()
                    .table("Musical_instrument")
                    .set("StokAmount = StokAmount +" + "'" + req.body.amount + "'")
                    .where("Musical_instrument = " + "'" + instrumentID + "'")
                    .toString();
                console.log(invQuery);
                DButilsAzure.Insert(invQuery)
                    .then(function (ans) {
                        console.log("updateInvQuery resolve")
                        resolve(true);
                    })
                    .catch(function (reason) {
                        console.log("updateInvQuery reject")
                        reject(false);
                    });
            });
        }
    }
);

//delete product *******************************************
app.delete('/deleteProduct', function (req, res) {
    var instrumentID = req.body.instrumentID;


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
            queryProducts = queryProducts.substring(0, query.length - 2) + ";";
            ordersQuery = getOrderQuery(orderId, totPrice);
        })
    }
    var deleteQueryFromSeconederyTable = squel.delete()
        .from("InstrumentCategory")
        .where("Musical_instrument = " + "'" + instrumentID + "'")
        .toString();
    //first delete from the small table
    DButilsAzure.Delete(deleteQueryFromSeconederyTable)
        .then(deleteFromMainTable)  //then from the mail table
        .then(function (ans) {
            console.log("Response deleteProduct: " + ans);
            res.send(ans);
        })
        .catch(function (reason) {
            console.log("Response deleteProduct ERROR: " + reason);
            res.send("Response deleteProduct ERROR: " + reason);
        });

    function deleteFromMainTable(){
        return new Promise(function (resolve, reject) {
            var deleteQueryFromMailTable = squel.delete()
                .from("Musical_instrument")
                .where("Musical_instrument = " + "'" + instrumentID + "'")
                .toString();
            DButilsAzure.Delete(deleteQueryFromMailTable)
                .then(function (ans) {
                    console.log("deleteFromMainTable resolve")
                    resolve(true);
                })
                .catch(function (reason) {
                    console.log("deleteFromMainTable reject")
                    reject(false);
                });
        });
    }
});

//Adduser *******************************************
app.post('/addUserByAdmin', function (req, res) {
    req.redirect('/registerUser');
});

    function insertToOrders(response) {
        return new Promise(function (resolve, reject) {
            DButilsAzure.Insert(connection, ordersQuery)
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
    DButilsAzure.Select(connection, query)
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

module.exports = app;