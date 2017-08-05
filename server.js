var express = require('express');
var bodyParser = require('body-parser');
var app = express();
//app.use(bodyParser.urlencoded({extended: false}));
//app.use(bodyParser.json());
//var cors = require('cors');
//app.use(cors());
var DButilsAzure = require('./DButils');
var squel = require("squel");

var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');

var index = require('./routes/index');
var users = require('./routes/users');
var admins = require('./routes/Admin');
var orders = require('./routes/orders');
var musicalsInstruments = require('./routes/musicalsInstruments');

//app.use(cors());

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
//app.set('view engine', 'jade');


//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(__dirname + '/public/shopClient/app'));
//app.use(express.static(__dirname + '/public/shopClient/app/templates'));
//app.use('/', index);


//*****************************************************************************************

app.locals.users = {};
//start listen
app.listen(3100, function () {
    console.log('I am listening on localhost:3100');
    // server is open and listening on port 3100, to access: localhost:3100 in any browser.
});


app.use(function (req, res, next) {
        next();
});

//routers
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
                var token = generateToken(ans);
                console.log("**************************************************Token is:"+token+"   user: "+email);
                app.locals.users[email] = token;
                console.log("login response: " + token);
                res.json(token);
                //res.send(ans);   //send the mail back to the client
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

exports.checkLogin =  function checkLogin(req) {
    var token = req.headers["my-token"];
    var user = req.headers["user"];
    if (!token || !user)
        return false;
    var validToken = app.locals.users[user];
    if (validToken == token)
        return true;
    else
        return false;
}

function generateToken(user) {
    var token = Math.floor(Math.random()*1000000);
    return token;
}

module.exports = app;