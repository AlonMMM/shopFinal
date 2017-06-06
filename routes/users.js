var express = require('express');
var router = express.Router();
var DButilsAzure = require('/shop/DBUtils');
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
module.exports = router;




