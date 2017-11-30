const fs = require("fs");
const co = require("co");
var db  = require('./lib/db2.js');
const AdmZip = require('adm-zip'); //引入查看zip文件的包


function readtoArray (path) {
    let arr = [];
    const zip = new AdmZip(path);
    let contentXml = zip.readAsText("word/document.xml");

    // wp级
    contentXml.match(/<w:p>[\s\S]*?<\/w:p>/ig).forEach((wp) => {

        var currentLine = '';
        if(!wp.match(/<w:r>[\s\S]*?<\/w:r>/ig)) return;

        // wr级
        wp.match(/<w:r>[\s\S]*?<\/w:r>/ig).forEach((wr) => {
            if(!wr.match(/<w:t[\s\S]*?<\/w:t>/ig)) return;

            // wt级
            wr.match(/<w:t[\s\S]*?<\/w:t>/ig).forEach((wt) => {
                if(!wt) return;

                currentLine += (wt.match(/<w:t[^>]*>([^<]*)<\/w:t>/)[1])
            })
        })

        if (currentLine) {
            arr.push(currentLine)
        }
    });

    return arr;
}


function saveToTxt(arr, Path) {
    fs.writeFile(Path, arr.join('\r\n'), (err)=>{
        console.error('保存txt文件出错：');
        console.error(err);
        if(err)throw err;
    });
}


// 行处理方法
var dealLine = function* () {
    if(line.match(/^\d+/)) { // 以数字开头的行，代表是问题
        var num = line.match(/^\d+/)[0]
        var q_content = line.substr(num.length + 1) // 题干去掉了序号

        cQA = q_content.match(/(\s*([\s|A-H|、]+)\s*)/)[2] // 从括号中读取答案
        q_content = q_content.replace(cQA, '')  // 题干去掉答案
        cQA = cQA.replace(/[\s|、]/g, '') // 答案中可能有：空格，顿号（、）等

        console.log('问题：' + q_content)
        console.log('答案：' +  cQA)

        var res = yield insertQuestion(q_content, cQOrder) // 插入问题

        cQId = res.insertId;
        cOOrder = 1;
        cQOrder++;
    } else if (line.match(/A/) && line.match(/B/) && line.match(/C/) && line.match(/D/)) { //一行中包含四个选项
        // console.log('四选项合并插入')
         var options = line.replace(/\s*B/g, '|B').replace(/\s*C/g, '|C').replace(/\s*D/g, '|D').replace(/\s*E/g, '|E').replace(/\s*F/g, '|F').split('|');
        yield insert4Options(options)
    } else { // 每行是一个选项
        yield insertOption(line)
        cOOrder++;
    }
    if (arr.length > 0) {
        line = arr.shift()
        co(dealLine).catch(function (err) {
            log('出现error:');
            log(err);
        });
    }
}


// 插入问题
function insertQuestion(str, order) {
    var sqlstr = "insert into t_question (test_id, question_order, question_content, question_type) values (3, ?, ?, 1)";
    return db.query2(sqlstr, [order, str]);
}

// 插入4个选项
function insert4Options(options) {
    // console.log(cQId)
    // console.log(cQA)

    var sqlstr = 'insert into t_answer_option (question_id, option_order, option_content, option_score) ';
    var exp = new RegExp(cQA.split('').join('|'), 'g');
    var arr_ops = []
    options.forEach((op, index) => {
        var s = (op.match(exp) ? '2' : '0')
        arr_ops.push('select ' + cQId + ', '+ (index + 1) +', \'' + op + '\', ' + s);
        console.log('选项：' + op + (s == '2' ? '，2' : ''))
     })
    sqlstr += arr_ops.join(' UNION ')

    return db.query2(sqlstr, []);
}

// 插入选项
function insertOption(str) {

    var exp = new RegExp(cQA.split('').join('|'), 'g');

    var score = (str.match(exp) ? '2' : '');
    console.log('选项：' + str + (score == '2' ? '，2' : ''))

    var sqlstr = "insert into t_answer_option (question_id, option_order, option_content, option_score) values (?, ?, ?, ?)";

    return db.query2(sqlstr, [cQId, cOOrder, str, score]);
}


// 定义变量
var cQId = '',
    cQA = '', 
    cQOrder = 1, 
    cOOrder = 1;

// 读取文件内容
var arr = readtoArray('./rulesS.docx');

// 读取第一行
var line = arr.shift();

// 递归处理
co(dealLine).catch(function (err) {
    log('出现error:');
    log(err);
});
