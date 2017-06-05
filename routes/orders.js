/**
 * Created by Liron on 05/06/2017.
 */
var express = require('express');
var router = express.Router();
var DButilsAzure = require('/shop/DButils');
var squel = require("squel");


router.post('/checkInInventory', function (req,res){
    var query = squel.select()
        .from("Musical_instrument")
        .where("Musical_instrument = " + "'" + req.body.productID + "'")
        .where("StockAmount >= " + "'" + req.body.amount + "'")
        .toString();
    DButilsAzure.Select(connection, query)
        .then(function (ans) {
            res.send(JSON.stringify(ans));
            console.log("checking inventory response:" + JSON.stringify(ans));
        })
        .catch(function (reason) {
            console.log("checking inventory failed "+ reason);
            res.send("checking inventory failed "+ reason);
        })
});


router.post('/buyProductsInCart', function (req, res) {
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