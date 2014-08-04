var express    = require('express'),
    router     = express.Router(),
    Q          = require('q'),
    rest       = require('restler'),
    xml2js     = require('xml2js'),
    crypto     = require('crypto'),
    orm        = require('orm'),
    db         = orm.connect('mysql://' + process.env.mysqluser + ':' + process.env.mysqlpass + '@' + process.env.mysqlhost + '/' + process.env.mysqldb),
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

orm.connect('mysql://' + process.env.mysqluser + ':' + process.env.mysqlpass + '@' + process.env.mysqlhost + '/' + process.env.mysqldb, function (err, db) {
  if (err) {
    log('Ошибка соединения с mysql: ' + err);
    throw err;
  } else {

  }
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
