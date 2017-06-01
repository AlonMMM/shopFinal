/**
 * Created by windows on 31/05/2017.
 */
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var Connection = require('tedious').Connection;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
var cors = require('cors');
app.use(cors());
var DButilsAzure = require('./DBUtils');


app.use(function(req, res, next){
    if (connected)
        next();
    else
        res.status(503).send('Server is down');
});


//******************

var config = {
    userName: 'lironAlon',
    password: 'alon&liron1',
    server: 'shopix.database.windows.net',
    requestTimeout: 300000,
    options: {encrypt:true, database: 'shope_nd'}
};

var connection = new Connection(config);
connection.on('connect',function(err){
        if(err) {
            console.error('error connectiong: ' + err.stack);
            return;
        }
        console.log("connected Azure");
    }
);

//*********************

app.use(function(req, res, next){
    if (connected)
        next();
    else
        res.status(503).send('Server is down');
});

//****************

app.get('/select1', function (req,res) {
    //it is just a simple example without handling the answer
    DButilsAzure.Select(connection, 'Select * from Score', function (result) {
        res.send(result);
    });
});

//***************
var port = 4000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});

