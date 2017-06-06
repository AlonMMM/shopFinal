/**
 * Created by Liron on 05/06/2017.
 */
var express = require('express');
var router = express.Router();
var DButilsAzure = require('/Users/Liron/IdeaProjects/shop/DButils');
var squel = require("squel");


router.post('/checkInInventory', function (req, res) {
    var query = squel.select()
        .from("Musical_instrument")
        .where("Musical_instrument = " + "'" + req.body.instrumentID + "'")
        .where("StockAmount >= " + "'" + req.body.amount + "'")
        .toString();
    DButilsAzure.Select(query)
        .then(function (ans) {
            if (ans.length != 0) {
                res.send("There is what you wanted in the inventory! ");
                console.log("There is what the client wanted! checking inventory response: " + JSON.stringify(ans));
            }
            else {
                res.send("There product you requested is not available or there isn't enough of it! ");
            }
        })
        .catch(function (reason) {
            console.log("checking inventory failed or the it isnt available " + reason);
            res.send("Inventory check failed ");
        })
});

router.post('/buyProductsInCart', function (req, res) {
    var arr = req.body.products;
    DButilsAzure.Insert(getOrderQuery(req.body.mail, req.body.totalPrice, req.body.details))
        .then(function (ans) {
            var promiseGetID = getOrderID();
            promiseGetID
                .then(function (ID) {
                    var promiseInsertToOrders = DButilsAzure.Insert(getQueryProductsInOrder(arr, ID));
                    promiseInsertToOrders
                        .then(function (ans) {
                            res.send("Adding products to order process Completed! ");
                            console.log("Adding products to order process Completed: " + JSON.stringify(ans));
                        })
                        .catch(function (reason) {
                            res.send("Adding products to order failed!");
                            console.log("Adding products to order failed! " + reason);
                        });
                })
                .catch(function (reason) {
                    console.log("getID failed " + reason);
                    res.send("Order creation failed ");
                });
        })
        .catch(function (reason) {
            console.log("InsertToOrders failed " + reason);
            res.send("Creating an order process failed ");
        });
});

function getOrderQuery(mail, totPrice, details) {
    return squel.insert().into("[Order]")
        .set('ClientMail', mail)
        .set('Time', "GETDATE()", {dontQuote: true})
        .set('TotalPrice', totPrice)
        .set('Details', details)
        .toString();
}

function getOrderID() {
    return new Promise(function (resolve, reject) {
        DButilsAzure.Select("SELECT TOP (1) OrderID FROM [Order] ORDER BY OrderID DESC")
            .then(function (ans) {
                resolve(ans[0]['OrderID']);
            })
            .catch(function (reason) {
                console.log("getting last ID entered failed " + reason);
                res.send("fail in creating your order ");
            });
    });
}

function getQueryProductsInOrder(products, orderID) {
    var queryProducts = "INSERT INTO ProductInOrder (OrderID, ProductID, Amount) VALUES ";
    products.forEach(function (item) {
        queryProducts = queryProducts + "(" + "'" + orderID + "','" + item.instrumentID + "','" + item.amount + "'), ";
    })
    queryProducts = queryProducts.substring(0, queryProducts.length - 2) + ";";
    return queryProducts;
}

router.post('/approveBuying', function (req, res) {
    var invQuery = squel.update()
        .table("Musical_instrument")
        .set("StockAmount = StockAmount -" + "'" + req.body.amount + "'")
        .set(" Sales_number =  Sales_number +" + "'" + req.body.amount + "'")
        .where("Musical_instrument = " + "'" + req.body.instrumentID + "'")
        .toString();
    DButilsAzure.Update(invQuery)
        .then(function (ans) {
            res.send("Your order has been approved and finished! ");
            console.log("The inventory updated according to the order made: " + JSON.stringify(ans));
        })
        .catch(function (reason) {
            res.send("Updating inventory according to your order failed!");
            console.log("Updating inventory according the order failed! " + reason);
        });
})

module.exports = router;