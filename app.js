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
            console.log(reason + ", getClients fail!");
            res.send(reason);
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


module.exports = app;
