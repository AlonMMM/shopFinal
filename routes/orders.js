
var express = require('express');
var router = express.Router();
var DButilsAzure = require('../DButils');
var appTools = require('../server');
var squel = require("squel");


router.post('/checkInInventory', function (req, res) {
    if (!appTools.checkLogin(req)) {
        console.log("--------- NOT LOGED-IN-------");
        res.send("no permission");
    }
    else {
        if (Object.keys(req.body).length === 0)
            res.send(false);
        var query = getQueryCheckInventory(req.body);
        console.log("length of req " + Object.keys(req.body).length);
        DButilsAzure.Select(query)
            .then(function (ans) {
                console.log("length of ans " + ans.length);
                if (Object.keys(req.body).length !== 0 && ans.length === Object.keys(req.body).length) {
                    res.send(true);
                    console.log("There is what the client wanted! checking inventory response: " + JSON.stringify(ans));
                }
                else {
                    res.send(ans);
                }
            })
            .catch(function (reason) {
                console.log("checking inventory failed or the it isnt available " + reason);
                res.send(false);
            })
    }
});

function getQueryCheckInventory(products) {
    //if enterd empty array, fail the check
    if (products.length===0)
        return null;
    var queryProducts = "SELECT Musical_instrument FROM Musical_instrument WHERE  ";
    products.forEach(function (item) {
        queryProducts = queryProducts + "(Musical_instrument = " + "'" + item.instrumentID + "' AND StockAmount >= " + "'" + item.amount + "') OR ";
    })
    queryProducts = queryProducts.substring(0, queryProducts.length - 4) + ";";
    return queryProducts;
}

router.post('/buyProductsInCart', function (req, res) {

    if (!appTools.checkLogin(req)) {
        console.log("--------- NOT LOGED-IN-------");
        res.send("no permission");
    }
    else {
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
    }
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
    if (!appTools.checkLogin(req)) {
        console.log("--------- NOT LOGED-IN-------");
        res.send("no permission");
    }
    else {
        if (Object.keys(req.body).length === 0)
            res.send(false);
        var invQuery = getQueryApproveBuying(req.body);
        DButilsAzure.Update(invQuery)
            .then(function (ans) {
                res.send(true);
                console.log("The inventory updated according to the order made: " + JSON.stringify(ans));
            })
            .catch(function (reason) {
                res.send(false);
                console.log("Updating inventory according the order failed! " + reason);
            });
    }
})

function getQueryApproveBuying (products) {
    //if enterd empty array, fail the check
    if (products.length==0)
        return null;
    var queryProducts = "UPDATE Musical_instrument SET StockAmount = CASE Musical_instrument ";
    products.forEach(function (item) {
        queryProducts = queryProducts + "WHEN '" + item.instrumentID + "' THEN StockAmount -" + "'" +item.amount+ "' ";
    })
    queryProducts = queryProducts.substring(0, queryProducts.length - 1) + "END, Sales_number = CASE Musical_instrument ";
    products.forEach(function (item) {
        queryProducts = queryProducts + "WHEN '" + item.instrumentID + "' THEN Sales_number +" + "'" +item.amount+ "' ";
    })
    queryProducts = queryProducts.substring(0, queryProducts.length - 1) + "END WHERE Musical_instrument IN (";
    products.forEach(function (item) {
        queryProducts = queryProducts +"'"+ item.instrumentID + "',";
    })
     queryProducts = queryProducts.substring(0, queryProducts.length - 1) + ")";
    return queryProducts;
}

router.post('/getProductsInOneOrder', function (req, res) {
    if (!appTools.checkLogin(req)) {
        console.log("--------- NOT LOGED-IN-------");
        res.send("no permission");
    }
    else {
        var query = squel.select()
            .from("ProductInOrder")
            .where("OrderID = " + "'" + req.body.orderID + "'")
            .toString();
        DButilsAzure.Select(query)
            .then(function (ans) {
                if (ans.length === 0) {
                    res.send("Admin may delete all the product in this order");
                    console.log("Products in Order: " + JSON.stringify(ans));
                }
                else {
                    res.send(ans);
                    console.log("Products in Order: " + JSON.stringify(ans));
                }
            })
            .catch(function (reason) {
                res.send("Watch products in order failed!");
                console.log("Watch products in order failed! " + reason);
            });
    }
})

router.post('/getOrderHistory', function (req, res) {
    if (!appTools.checkLogin(req)) {
        console.log("--------- NOT LOGED-IN-------");
        res.send("no permission");
    }
    else {
        var query = squel.select()
            .from("[Order]")
            .where("ClientMail = " + "'" + req.body.mail + "'")
            .toString();
        DButilsAzure.Select(query)
            .then(function (ans) {
                res.send(ans);
                console.log("User's order history : " + JSON.stringify(ans));
            })
            .catch(function (reason) {
                res.send("Watch user Orders failed!");
                console.log("Watch user Orders failed! " + reason);
            });
    }
})

module.exports = router;

