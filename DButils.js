var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

//----------------------------------------------------------------------------------------------------------------------

exports.Select = function(connection, query, callback) {
    return new Promise(function (resolve,reject) {
        var req = new Request(query, function (err, rowCount) {
            if (err) {
                console.log(err);
                reject(err);
            }
        });
        console.log("** Select **");
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

exports.Insert = function(connection, query, callback) {
    return new Promise(function (resolve,reject) {
        console.log("** Select **");
        console.log("**Query is: " + query + " **");
        var insert = new Request(query, function (err, rowCount) {
            if (err) {
                console.log(err);
                reject(err);
            }
        });
        insert.on('requestCompleted', function () {
            console.log('requestCompleted with ' + insert.rowCount + ' row(s)');
            resolve('requestCompleted with ' + insert.rowCount + ' row(s)');
        });
        connection.execSql(insert);
    });
};