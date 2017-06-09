
var express = require('express');
var router = express.Router();
var DButilsAzure = require('../DButils');
var squel = require("squel");

router.get('/getAllProducts', function (req, res) {
    var query = 'Select * from Musical_instrument';
    DButilsAzure.Select(query)
        .then(function (ans) {
            res.send(ans);
            console.log("GetAllProduct response: " + JSON.stringify(ans));
        })
        .catch(function (reason) {
            console.log("getAllProducts fail!"+reason);
            res.send("getAllProducts fail!");
        });
});

router.get('/getTop5Products', function (req, res) {
    var query = "SELECT TOP (5) * FROM Musical_instrument ORDER BY Sales_number DESC";
    DButilsAzure.Select(query)
        .then(function (ans) {
            res.send(ans);
            console.log("getTop5Products response: " + JSON.stringify(ans));
        })
        .catch(function (reason) {
            console.log("getTop5Products fail!"+reason);
            res.send("getTop5Products fail!");
        });
});

router.get('/latestProducts', function (req, res) {
    //it is just a simple example without handling the answer
    var query = 'Select * from Musical_instrument where PublishDate >= DATEADD(DAY,-30,GETDATE())';
    DButilsAzure.Select(query)
        .then(function (ans) {
            res.send(ans);
            console.log("latestProducts response: " + ans);
        })
        .catch(function (reason) {
            console.log("Get latestProducts fail!"+reason);
            res.send("Get latestProducts fail!");
        });
});

router.post('/getProductDetails', function (req, res) {
    var instrumentID = req.body.instrumentID;
    var query = squel.select()
        .from("Musical_instrument")
        .where("Musical_instrument = " + "'" + instrumentID + "'")
        .toString();
    DButilsAzure.Select(query)
        .then(function (ans) {
            res.send(ans);
            console.log("latestProducts response: " + ans);
        })
        .catch(function (reason) {
            console.log("getProductDetails fail!" + reason);
            res.send("getProductDetails fail!");
        });

});

module.exports = router;
