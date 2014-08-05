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

db.on('connect', function (err) {
  if (err) {
    log('Ошибка соединения с mysql: ', err);
    return;
  } else {
    log('Успешное подключение к mysql');
  }
});

router.get('/', function(req, res) {
  res.render('index', { title: '' });
});

module.exports = router;

//Схема базы данных
var User = db.define('users', {
  insalesid    : { type: 'integer', unique: true },
  insalesurl   : { type: 'text' },
  token        : { type: 'text' },
  mailtrig     : { type: 'boolean' },
  appid        : { type: 'integer' },
  nameshop     : { type: 'text' },
  nameadmin    : { type: 'text' },
  phone        : { type: 'integer' },
  email        : { type: 'text' },
  username     : { type: 'text' },
  jstagid_main : { type: 'integer' },
  jstagid_var  : { type: 'integer' },
  autologin    : { type: 'text' },
  webhook      : { type: 'boolean' },
  cookie       : { type: 'boolean' },
  created_at   : { type: 'date' },
  updated_at   : { type: 'date' },
  enabled      : { type: 'boolean' }
});

User.sync(function (err) {
    !err && log('Синхронизация схемы базы данных');
});

//Логгер в одном месте, для упрощения перезда на любой логгер.
function log(logMsg) {
  if (logMsg instanceof Error) logger.error(logMsg.stack);
  if (debugOn) {
      logger.info(logMsg);
  }
};
