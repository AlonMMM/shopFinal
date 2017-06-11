/**
 * Created by windows on 06/06/2017.
 */
var express = require('express');
var router = express.Router();
var DButilsAzure = require('../DBUtils');
var squel = require("squel");


//add product ********************
router.post('/addProduct', function (req, res) {
    var instrumentID = req.body.instrumentID;
    var caregory = req.body.categoryName;
    var query = addProductQ(req);
    DButilsAzure.Insert(query)
        .then(function (ans) {
            var insertCategoryPtomise = insertProductCategory(instrumentID, caregory);
            insertCategoryPtomise.then(function (ans1) {
                res.send("addProduct response:" + ans + "\n" + ans1);
                console.log("addProduct response:" + ans + "\n" + ans1);
            }, function (reason) {
                res.send("addProduct fail!" + reason);
                console.log("addProduct fail!");
            });
        })
        .catch(function (reason) {
            if (reason.message.includes("Violation of PRIMARY KEY constraint")) {  //if the product exist we only need to update inv
                console.log("Product  already exist! Updating**");
                var updatePromises = updateInvQuery(req.body.amount, req.body.instrumentID);   //updete the amount of the inv for specific product
                updatePromises.then(function (ans) {
                    res.send("updateInvQuery response: Product  already exist! Updating his stock Amount" + ans);
                    console.log("updateInvQuery response: " + ans);
                })
                    .catch(function (reason1) {
                        console.log(reason1 + "addProduct ERROR: " + reason);
                        res.send("addProduct fail!");
                    });
            }
            else {
                console.log("Server Problem, addProduct fail!" + reason);
                res.send("addProduct fail!");
            }
        });
});

function addProductQ(req) {
    return squel.insert().into("Musical_instrument")
        .set('Musical_instrument', req.body.instrumentID)
        .set('Manufactur', req.body.manufactur)
        .set('Year', req.body.year)
        .set('Description', req.body.description)
        .set('PicturePath', req.body.picturePath)
        .set('PublishDate', "GETDATE()", {
            dontQuote: true
        })
        .set('Price', req.body.price)
        .set('StockAmount', req.body.amount)
        .set('Delivery_time', req.body.price)
        .set('Sales_number', 0)
        .toString();

}
//function to insert the category to tnother table
function insertProductCategory(instrumentID, caregory) {
    return new Promise(function (resolve, reject) {
        console.log("insertProductCategory**");
        var insertCategory = squel.insert().into("InstrumentCategory")
            .set('Musical_instrument', instrumentID)
            .set('CategoryName', caregory)
            .toString();
        DButilsAzure.Insert(insertCategory)
            .then(function (ans) {
                console.log("insertProductCategory Response :" + ans);
                resolve("insertProductCategory Response :" + ans);

            })
            .catch(function (reason) {
                console.log("insertProductCategory fail!" + reason);
                reject("insertProductCategory fail!");
            });
    });
}

//function to updateInv if the product is exist
function updateInvQuery(amount, instrumentID) {
    return new Promise(function (resolve, reject) {
        console.log("updateInvQuery promise!");
        var invQuery = squel.update()
            .table("Musical_instrument")
            .set("StockAmount = StockAmount +" + "'" + amount + "'")
            .where("Musical_instrument = " + "'" + instrumentID + "'")
            .toString();
        console.log(invQuery);
        DButilsAzure.Insert(invQuery)
            .then(function (ans) {
                console.log("updateInvQuery resolve" + ans);
                resolve("updateInvQuery Response: " + ans);
            })
            .catch(function (reason) {
                console.log("Response updateInvQuery ERROR: " + reason);
                reject("updateInvQuery Fail!" + reason);
            });
    });
}

router.delete('/deleteUser', function (req, res) {
    var mainTable = "ClientsTable";
    var instrumentName = "Mail";
    var secondaryTable = "ClientCategories";
    var instrumentID = req.body.mail;
    var deleteFromSeconedTablePromise = deleteFromTable(instrumentID, secondaryTable, instrumentName);
    deleteFromSeconedTablePromise
        .then(function (ans1) {
            var deleteFromMainTablePromise = deleteFromTable(instrumentID, mainTable, instrumentName);
            deleteFromMainTablePromise
                .then(function (ans3) {
                    res.send("deleteUser response:" + ans1);
                    console.log("deleteUser response: " + ans1 + ", " + ans2 + ", " + ans3);
                })
                .catch(function (reason) {
                    res.send(reason);
                    console.log(reason);
                });
        })
        .catch(function (reason) {
            console.log("Response deleteUser ERROR: " + reason);
            res.send("Response deleteUser ERROR: " + reason);
        });
});

router.delete('/deleteProduct', function (req, res) {
    var mainTable = "Musical_instrument";
    var instrumentName = "Musical_instrument";
    var secondaryTable = "InstrumentCategory";
    var instrumentID = req.body.instrumentID;
    var deleteFromSeconedTablePromise = deleteFromTable(instrumentID, secondaryTable, instrumentName);
    deleteFromSeconedTablePromise
        .then(function (ans) {
            var deleteFromMainTablePromise = deleteFromTable(instrumentID, mainTable, instrumentName);
            deleteFromMainTablePromise
                .then(function (ans1) {
                    res.send("deleteProduct response:" + ans);
                    console.log("deleteProduct response:" + true);
                }, function (reason) {
                    res.send(reason);
                    console.log(reason);
                });
        })
        .catch(function (reason) {
            console.log("Response deleteProduct ERROR: " + reason);
            res.send("Response deleteProduct ERROR: " + reason);
        });
});


function deleteFromTable(instrumentID, tableName, instrumentName) {
    return new Promise(function (resolve, reject) {
        var deleteQueryFromMailTable = squel.delete()
            .from(tableName)
            .where(instrumentName + " = " + "'" + instrumentID + "'")
            .toString();
        DButilsAzure.Delete(deleteQueryFromMailTable)
            .then(function (ans) {
                console.log("deleteFromTable resolve " + ans);
                resolve(ans);
            })
            .catch(function (reason) {

                console.log("deleteFromTable reject");
                reject(reason);
            });
    });
}

router.get('/getInventory', function (req, res) {
    var query = "SELECT Musical_instrument,StockAmount FROM Musical_instrument";
    DButilsAzure.Select(query)
        .then(function (ans) {
            console.log("Response getInventory :" + JSON.stringify(ans));
            res.send(ans);
        })
        .catch(function (reason) {
            console.log("Response getInventory ERROR :" + reason);
            res.send("Response getInventory ERROR :" + reason);
        });
});

router.get('/getOrdersReport', function (req, res) {
    var query = squel.select()
        .from("[Order]")
        .toString();
    DButilsAzure.Select(query)
        .then(function (ans) {
            res.send(ans);
            console.log("All orders  : " + JSON.stringify(ans));
        })
        .catch(function (reason) {
            res.send("Get all Orders failed!");
            console.log("Get all Orders failed! " + reason);
        });
});


router.get('/getAllClients', function (req, res) {
    var query = squel.select()
        .from("ClientsTable")
        .toString();
    DButilsAzure.Select(query)
        .then(function (ans) {
            res.send(ans);
            console.log("All Clients  : " + JSON.stringify(ans));
        })
        .catch(function (reason) {
            res.send("Get all Clients failed!");
            console.log("Get all Clients failed! " + reason);
        });
});

router.post('/addUser', function (req, res) {
    res.redirect(307, '/users/registerUser');
});
module.exports = router;