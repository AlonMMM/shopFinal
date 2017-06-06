var express = require('express');
var bodyParser = require('body-parser');
var app = express();
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
var cors = require('cors');
app.use(cors());
var DButilsAzure = require('./DButils');
var squel = require("squel");

//var users = require('./routes/users');

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var admins = require('./routes/Admin');
var orders = require('./routes/orders');
var musicalsInstruments = require('./routes/musicalsInstruments');
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
app.use('/musicalsInstruments', musicalsInstruments);
app.use('/Admin', admins);
app.use('/musicalsInstruments', musicalsInstruments);
app.use('/orders', orders);


//login
app.post('/login', function (req, res, next) {
    var email = req.body.mail;
    var pass = req.body.pass;
    var query = loginQuery(email, pass);
    DButilsAzure.Select(query)
        .then(function (ans) {
            if (ans.length === 0) {
                res.send("wrong email or Password!");
                console.log("wrong email or Password!");
            }
            else {
                res.send(ans);   //send the mail back to the client
                console.log("login response: " + JSON.stringify(ans));
            }
        })
        .catch(function (reason) {
            console.log(reason + ", login fail!");
            res.send(reason);
        });
});

//login query
function loginQuery(email, pass) {
    return squel.select()
        .field("Mail")
        .from("ClientsTable")
        .where("Mail = " + "'" + email + "'")
        .where("Password = " + "'" + pass + "'")
        .toString();
}

module.exports = app;