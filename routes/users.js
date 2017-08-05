var express = require('express');
var router = express.Router();
var DButilsAzure = require('../DBUtils');
var appTools = require("../server");
var squel = require("squel");


router.post('/registerUser', function (req, res) {
    var allCategories = req.body.interest_types;
    var query = squel.insert().into("ClientsTable")
        .set('Mail', req.body.mail)
        .set('Password', req.body.pass)
        .set('FirstName', req.body.fName)
        .set('LastName', req.body.lName)
        .set('Phone', req.body.phone)
        .set('Cellular', req.body.cellular)
        .set('Adress', req.body.addr)
        .set('City', req.body.city)
        .set('Country', req.body.country)
        .set('CreditCardNumber', req.body.creditCardNum)
        .set('isAdmin', req.body.isAdmin)
        .set('School', req.body.school)
        .set('FirstPetName', req.body.firstPet)
        .toString();
    DButilsAzure.Insert(query)
        .then(function (ans) {
            var insertCategoriesPromise = insertCategories(allCategories, req.body.mail);
            insertCategoriesPromise.then(function (ans1){
                res.send("Register response:" + ans + "\n"+ans1);
                console.log("Register response:" + ans + "\n"+ans1);
            },function (reason) {
                res.send(reason);
                console.log(reason);
            });
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

//help function to add caregories to the user.
function insertCategories(allCategories, mail) {
    return new Promise(function (resolve, reject) {
        console.log("insert category*****");
        if (allCategories.length === 0) {
            resolve("No interest types...");
        }
        else {
            var cotegoriesArr = allCategories.split(",");
            var query = "INSERT INTO ClientCategories (Mail, CategoryName) VALUES ";
            cotegoriesArr.forEach(function (category) {
                query = query + "(" + "'" + mail.toString() + "'," + "'" + category.toString() + "'), ";
            });
            query = query.substring(0, query.length - 2) + ";";
            console.log("insert category: " + query);
            DButilsAzure.Insert(query)
                .then(function (answer) {
                    console.log(answer);
                    resolve("insert Category response: " + answer);
                })
                .catch(function (reason) {
                    console.log(reason + "insert Category fail!");
                    reject("insert Category fail!");
                });
        }
    })
}
//restore pass by verify user
router.post('/verifyUserAndRestorePass', function (req, res) {
    var email = req.body.mail;
    var firstPet = req.body.firstPet;
    var school = req.body.school;
    var query = squel.select()
        .field("Password")
        .from("ClientsTable")
        .where("Mail = " + "'" + email + "'")
        .where("FirstPetName = " + "'" + firstPet + "'")
        .where("School = " + "'" + school + "'")
        .toString();
    DButilsAzure.Select(query)
        .then(function (ans) {
            if (ans.length === 0) {
                res.send("wrong email or anwers!");
                console.log("wrong email or anwers!");
            }
            else {
                res.send(ans);
                console.log("verifyUserAndRestorePass response: " + JSON.stringify(ans));
            }
        })
        .catch(function (reason) {
            console.log(reason + " ,verifyUserAndRestorePass fail!");
            res.send("verifyUserAndRestorePass fail!");
        });
});

router.post('/getMatchProduct', function (req, res) {
    if (!appTools.checkLogin(req)) {
        console.log("--------- NOT LOGED-IN-------");
        res.send("no permission");
    }
    else {
        var email = req.body.mail;

        //to knew if the user buy the product alredy.
        var notByProductQuery = "SELECT ProductID FROM" +
            " ProductInOrder po INNER JOIN" +
            "(SELECT * FROM [Order] WHERE ClientMail = " + "'" + email + "') c " +
            "ON (po.OrderID = c.OrderID)";

        //show the  product witch match to the user categories.
        var productInFavorCategory = "SELECT Musical_instrument FROM" +
            " InstrumentCategory mi INNER JOIN" +
            "(SELECT * FROM ClientCategories WHERE Mail = " + "'" + email + "') c " +
            "ON (mi.CategoryName = c.CategoryName) WHERE Musical_instrument NOT IN(" + notByProductQuery + ")";

        //return only the top 5 "hotest product".
        var favorProduct = "SELECT TOP (5) * FROM Musical_instrument mi1 INNER JOIN " +
            "(" + productInFavorCategory + ") mi2 ON (mi1.Musical_instrument = mi2.Musical_instrument)" +
            " ORDER BY Sales_number DESC";

        console.log(favorProduct);
        DButilsAzure.Select(favorProduct)
            .then(function (ans) {
                if (ans.length === 0) {
                    res.send("There is no such a user or No match product for you !");
                    console.log("There is no such a user or No match product for you !");
                }
                else {
                    res.send(ans);
                    console.log("getMatchProduct response: " + JSON.stringify(ans));
                }
            })
            .catch(function (reason) {
                console.log(reason + " ,getMatchProduct fail!");
                res.send("getMatchProduct fail!");
            });
    }
});
module.exports = router;




