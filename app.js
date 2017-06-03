var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var Connection = require('tedious').Connection;
app.use(bodyParser.urlencoded({ extended: false }));
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
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

//*****************************************************************************************
//start listen
app.listen(3100, function() {
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
    options: {encrypt:true, database: 'shope_nd'}
};
connection = new Connection(config);
var connected = false;
connection.on('connect', function(err) {
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
app.use(function(req, res, next){
    if (connected)
        next();
    else
        res.status(503).send('Server is down');
});

var isLoggedIn = false;
//register request
app.post('/registerUser', function (req, res) {
    var email = req.body.mail;
    DButilsAzure.Select(connection, "Select * from ClientsTable where Mail = "+"'"+email.toString()+"'", function (result) {
        if (result.length!==0){
            res.send("cannot add user with same email");
        }
        else {
            DButilsAzure.Insert(req,connection,"INSERT INTO ClientsTable (Mail, Password, FirstName , LastName , Phone, Cellular, Adress , City , Country ,CreditCardNumber , isAdmin, InterestType, School, FirstPetName)" +
                "VALUES (@mail , @password , @fName , @lName , @phone , @cellular , @addr , @city , @country, @creditCardNum, @isAdmin, @interest_types, @school, @firstPet) ", function (err, rowCount) {
                if (err) {
                    console.log(err);
                }
                else
                {
                    console.log("RegisterCompleted");
                }
            });
            res.send("user was added successfully");
        }
    });
});


//get all product
app.get('/getAllProducts', function (req,res) {
    DButilsAzure.Select(connection, 'Select * from Musical_instrument', function (result) {
        res.send(result);
        console.log(result);
    });
});

app.get('/getTop5Products', function(req,res){
    DButilsAzure.Select(connection, "SELECT TOP (5) * FROM Musical_instrument ORDER BY Sales_number DESC", function(result){
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
        .where("Mail = "+"'"+email+"'")
        .where("FirstPetName = "+"'"+firstPet+"'")
        .where("School = "+"'"+school+"'")
        .toString(), function (result) {
        res.send(result);
        console.log(result);
    });
});

//login
app.post('/login', function (req,res,next) {
    var email = req.body.mail;
    var pass = req.body.pass;
    var loginPromise = login(email,pass);
    loginPromise.then(function(ans)
    {
        res.send(ans);
        console.log(ans);
    })
        .catch(function (reason) {
            console.log(reason);
            res.send(reason);
        });
});

//get only the product witch added the last 30 days
app.get('/login', function (req,res,next) {
    //it is just a simple example without handling the answer
    DButilsAzure.Select(connection, 'Select * from Musical_instrument where PublishDate >= DATEADD(DAY,+11,GETDATE())', function (result) {
        res.send(result);
        console.log(result);
    });
});

var login =function login(email,pass) {
    return DButilsAzure.Select(connection, squel.select()
        .field("Mail")
        .from("ClientsTable")
        .where("Mail = "+"'"+email+"'")
        .where("Password = "+"'"+pass+"'")
        .toString());
}

var getLatestProduction=function(res) {
    return DButilsAzure.Select(connection, 'Select * from Musical_instrument where PublishDate >= DATEADD(DAY,-30,GETDATE())');

}


module.exports = app;
