
var Request = require('tedious').Request;
var TYPES = require('tedious').TYPES;

//----------------------------------------------------------------------------------------------------------------------

exports.Select = function(connection, query, callback) {
    var req = new Request(query, function (err, rowCount) {
        if (err) {
            console.log(err);
            return;
        }
    });
    console.log("** Select **");
    console.log("**Query is: " + query + " **");
    var ans = [];
    var properties = [];
    req.on('columnMetadata', function (columns) {
        columns.forEach(function (column) {
            if (column.colName != null)
                properties.push(column.colName);
        });
    });
    req.on('row', function (row) {
        var item = {};
        for (i=0; i<row.length; i++) {
            item[properties[i]] = row[i].value;
        }
        ans.push(item);
    });

    req.on('requestCompleted', function () {
        //don't forget handle your errors
        console.log('request Completed: '+ req.rowCount + ' row(s) returned');
        console.log(ans);
        callback(ans);
    });

    connection.execSql(req);
};

exports.Insert = function(req,connection, query, callback) {
    var insert = new Request(query, function (err, rowCount) {
        if (err) {
            console.log(err);
            return;
        }
    });
    insert.addParameter('mail', TYPES.NVarChar, req.body.mail);
    insert.addParameter('password', TYPES.NVarChar, req.body.pass);
    insert.addParameter('fName', TYPES.NVarChar, req.body.fName);
    insert.addParameter('lName', TYPES.NVarChar, req.body.lName);
    insert.addParameter('phone', TYPES.NVarChar, req.body.phone);
    insert.addParameter('cellular', TYPES.NVarChar, req.body.cellular);
    insert.addParameter('addr', TYPES.NVarChar, req.body.addr);
    insert.addParameter('city', TYPES.NVarChar, req.body.city);
    insert.addParameter('country', TYPES.NVarChar, req.body.country);
    insert.addParameter('CreditCardNum', TYPES.NVarChar, req.body.creditCardNum);
    insert.addParameter('isAdmin', TYPES.Int, req.body.isAdmin);
    insert.addParameter('interest_types', TYPES.NVarChar, req.body.interest_types);
    insert.addParameter('school', TYPES.NVarChar, req.body.school);
    insert.addParameter('firstPet', TYPES.NVarChar, req.body.firstPet);

    insert.on('requestCompleted', function () {
        console.log('requestCompleted with ' + insert.rowCount + ' row(s)');
    });
    connection.execSql(insert);

};