var express    = require('express'),
    router     = express.Router(),
    Q          = require('q'),
    rest       = require('restler'),
    xml2js     = require('xml2js'),
    crypto     = require('crypto'),
    mysql      = require('mysql'),
    moment     = require('moment'),
    hat        = require('hat'),
    winston    = require('winston'),
    logger     = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: process.env.applog + 'app.log' })
      ]
    }),
    debugOn    = true;

var connection = mysql.createConnection({
  host: process.env.mysqlhost,
  user: process.env.mysqluser,
  password: process.env.mysqlpass,
  database: process.env.mysqldb
});

connection.connect(function(err) {
  if (err) {
    log('Ошибка соединения с mysql: ' + err.stack);
    return;
  }

  log('Успешное соединение с mysql, id=' + connection.threadId);
});

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

//Логгер в одном месте, для упрощения перезда на любой логгер.
function log(logMsg) {
  if (logMsg instanceof Error) logger.error(logMsg.stack);
  if (debugOn) {
    if (typeof logMsg == 'object') {
      console.dir(logMsg);
    } else {
      logger.info(logMsg);
    }
  }
};

connection.end(function(err) {
  log('Завершаем соединение с mysql');
});