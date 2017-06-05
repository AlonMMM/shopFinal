
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;
var Connection = require('tedious').Connection;
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

//----------------------------------------------------------------------------------------------------------------------

exports.Select = function(query, callback) {
    return new Promise(function (resolve,reject) {
        var req = new Request(query, function (err, rowCount) {
            if (err) {
                console.log(err);
                reject(err);
            }
        });
        console.log("Select **");
        console.log("**Query is: " + query + " **");
        var ans = [];
        var properties = [];
        req.on('columnMetadata', function (columns) {
            columns.forEach(function (column) {
                if (column.colName !== null)
                    properties.push(column.colName);
            });
        });
        req.on('row', function (row) {
            var item = {};
            for (i = 0; i < row.length; i++) {
                item[properties[i]] = row[i].value;
            }
            ans.push(item);
        });

        req.on('requestCompleted', function () {
            //don't forget handle your errors
            console.log('request Completed: ' + req.rowCount + ' row(s) returned');
            console.log(ans);
            resolve(ans);
        });

        connection.execSql(req);
    });
};

exports.Insert = function( query, callback) {
    return new Promise(function (resolve,reject) {
        console.log("Insert **");
        console.log("**Query is: " + query + " **");
        var insert = new Request(query, function (err, rowCount) {
            if (err) {
                console.log(err);
                reject(err);
            }
        });
        insert.on('requestCompleted', function () {
            console.log('requestCompleted with ' + insert.rowCount + ' row(s)');
            resolve("requestCompleted with " + insert.rowCount +  "row(s)");
        });
        connection.execSql(insert);
    });
};

exports.Delete = function( query) {
    return new Promise(function (resolve, reject) {
        console.log("Delete **");
        console.log("**Query is: " + query + " **");
        var insert = new Request(query, function (err, rowCount) {
            if (err) {
                if(err.message.includes)
                console.log(err);
                reject(err);
            }
        });
        insert.on('requestCompleted', function () {
            console.log("Delete completed**");
            resolve(true);
        });
        connection.execSql(insert);
    });
}