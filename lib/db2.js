const log = console.log;
var mysql  = require('mysql');
// Uncomment if mysql has not been properly promisified yet
var Promise = require("bluebird");
Promise.promisifyAll(mysql);
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/Pool").prototype);

var connConfig = {
    host     : 'rm-bp1l127cta7kxe7l5o.mysql.rds.aliyuncs.com',
    database : 'wec_micro_app',
    user     : 'microapp',
    password : 'microapp1qaz@2017',
    port     : '3306',
    charset  : 'UTF8MB4_GENERAL_CI'
}

var connection = mysql.createConnection(connConfig);

function query (sql) {
    return connection.queryAsync(sql); 
}

function query2 (sql, params) {
    return connection.queryAsync(sql, params); 
}

function close () {
    if(connection) {
        connection.end();
        connected = false;
    }
}

// 业务相关

function getUser (params) {
    var sqlstr = "select * from t_user where school_code = ? and user_code = ?";
    return query2(sqlstr, [params.FC_SCHOOL_CODE, params.FC_USER_ID]);
}

function addUserBasic (params) {
    var sqlstr = "insert into t_user (school_code, user_code, user_name) values (?, ?, ?)";
    return query2(sqlstr, [params.FC_SCHOOL_CODE, params.FC_USER_ID, params.FC_USER_NAME]);
}

module.exports = {
    query2: query2,
    query: query,
    close: close,
    user: {
        getUser: getUser,
        addUserBasic: addUserBasic
    }
}