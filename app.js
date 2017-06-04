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
app.use('/users', users);

//*****************************************************************************************
//start listen
app.listen(3100, function () {
    console.log('I am listening on localhost:3100');
    // server is open and listening on port 3100, to access: localhost:3100 in any browser.
});
//*****************************************************************************************
//connect to the SQL azure server
var config = {
    userName: 'lironAlon',
    password: 'alon&liron1',
    server: 'shopix.database.windows.net',
    requestTimeout: 300000,
    options: {encrypt: true, database: 'shope_nd'}
};
connection = new Connection(config);
var connected = false;
connection.on('connect', function (err) {
    if (err) {
        console.error('error connecting: ' + err.message);
    }
    else {
        console.log("Connected Azure");
        connected = true;
    }
});
//*****************************************************************************************
//*****************************************************************************************
app.use(function (req, res, next) {
    if (connected)
        next();
    else
        res.status(503).send('Server is down');
});

//register request
app.post('/registerUser', function (req, res) {
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
        .set('FirstPetName', req.body.firstPet);
    DButilsAzure.Insert(connection, query)
        .then(insertCategories)
        .then(function (ans) {
            res.send(ans);
            console.log("ans is : *****" +ans);
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

    function insertCategories(response) {
        return new Promise(function (resolve, reject) {
            console.log("insert category*****");
            var allCategories = req.body.interest_types;
            if(allCategories.length===0)
            {
                resolve("No interest types...");
            }
            var cotegoriesArr = allCategories.split(",");
            var userMail = req.body.mail;
            var query = "INSERT INTO Categories (ClientMail, CategoryName) VALUES ";
            cotegoriesArr.forEach(function (category) {
                query = query + "(" + "'" + userMail.toString() + "'," + "'" + category.toString() + "'), ";
            });
            query = query.substring(0, query.length - 2) + ";";
            console.log("insert category: " + query);
            DButilsAzure.Insert(connection, query)
                .then(function (answer) {
                    console.log(answer);
                    resolve("interestTypes response: "+answer+", register response: "+response);
                })
                .catch(function (reason) {
                    console.log("insert Category fail!");
                    res.send("insert Category fail!");
                });

        });
    }
});
//get all product
app.get('/getAllProducts', function (req, res) {
    DButilsAzure.Select(connection, 'Select * from Musical_instrument', function (result) {
        res.send(result);
        console.log(result);
    });
});

app.get('/getTop5Products', function (req, res) {
    DButilsAzure.Select(connection, "SELECT TOP (5) * FROM Musical_instrument ORDER BY Sales_number DESC", function (result) {
        res.send(result);
        console.log(result);
    });
});


//restore pass by verify user
app.post('/verifyUserAndRestorePass', function (req, res) {
    var email = req.body.mail;
    var firstPet = req.body.firstPet;
    var school = req.body.school;
    DButilsAzure.Select(connection, squel.select()
        .field("Password")
        .from("ClientsTable")
        .where("Mail = " + "'" + email + "'")
        .where("FirstPetName = " + "'" + firstPet + "'")
        .where("School = " + "'" + school + "'")
        .toString(), function (result) {
        res.send(result);
        console.log(result);
    });
});

//login
app.post('/login', function (req, res, next) {
    var email = req.body.mail;
    var pass = req.body.pass;
    var loginPromise = login(email, pass);
    loginPromise.then(function (ans) {
        res.send(ans);
        console.log(ans);
    })
        .catch(function (reason) {
            console.log(reason);
            res.send(reason);
        });
});

//get only the product witch added the last 30 days
app.get('/login', function (req, res, next) {
    //it is just a simple example without handling the answer
    DButilsAzure.Select(connection, 'Select * from Musical_instrument where PublishDate >= DATEADD(DAY,+11,GETDATE())', function (result) {
        res.send(result);
        console.log(result);
    });
});

var login = function login(email, pass) {
    return DButilsAzure.Select(connection, squel.select()
        .field("Mail")
        .from("ClientsTable")
        .where("Mail = " + "'" + email + "'")
        .where("Password = " + "'" + pass + "'")
        .toString());
}

var getLatestProduction = function (res) {
    return DButilsAzure.Select(connection, 'Select * from Musical_instrument where PublishDate >= DATEADD(DAY,-30,GETDATE())');

}


module.exports = app;
