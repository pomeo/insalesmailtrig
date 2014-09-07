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
    cc         = require('coupon-code'),
    logger     = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: process.env.applog + 'app.log' })
      ]
    }),
    debugOn    = true;

db.on('connect', function (err) {
  if (err) {
    log('Ошибка соединения с mysql: ' + err, 'error');
    return;
  } else {
    log('Успешное подключение к mysql');
  }
});

router.get('/', function(req, res) {
  if (req.query.token && (req.query.token !== '')) {
    User.find({ insalesautologin: req.query.token }, function(err, a) {
      if (err) {
        log('Ошибка запроса данных из базы данных', 'error');
        res.send(err, 500);
      } else {
        var errid = cc.generate({ parts : 1, partLen : 6 });
        if (a[0]) {
          req.session.insalesid = a[0].insalesid;
          res.redirect('/');
        } else {
          log('#' + errid + ' Ошибка автологина, token не соотвествует', 'error');
          res.send('#' + errid + ' Ошибка автологина', 403);
        }
      }
    });
  } else {
    var insid = req.session.insalesid || req.query.insales_id;
    log('Вход в магазин: ' + insid);
    if ((req.query.insales_id && (req.query.insales_id !== '')) || req.session.insalesid !== undefined) {
      User.find({ insalesid: insid }, function(err, a) {
        if (a[0].enabled == true) {
          if (req.session.insalesid) {
            if (a[0].appid) {
              res.render('dashboard', { title: '' });
            } else {
              res.render('index', { title: '' });
            }
          } else {
            log('Автологин в магазин ' + a[0].insalesurl);
            var id = hat();
            a[0].insalesautologin = crypto.createHash('md5').update(id + a[0].token).digest('hex');
            a[0].save(function (err) {
              if (err) {
                log('Ошибка сохранения token для автологина в базу данных', 'error');
                res.send(err, 500);
              } else {
                log('Редирект в insales для автологина магазина ' + a[0].insalesurl)
                res.redirect('http://' + a[0].insalesurl + '/admin/applications/' + process.env.insalesid + '/login?token=' + id + '&login=http://' + process.env.mailtrigurl);
              }
            });
          }
        } else {
          log('Приложение не установлено в магазине ' + req.query.shop, 'warn');
          res.send('Приложение не установлено для данного магазина', 403);
        }
      });
    } else {
      log('Ошибка при автологине, не хватает данных в строке запроса к приложению', 'warn')
      res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
    }
  }
});

router.get('/registration', function(req, res) {
  if (req.session.insalesid) {
    res.render('registration', { title: '' });
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

router.post('/registration', function(req, res) {
  res.send('success');
});

router.get('/login', function(req, res) {
  if (req.session.insalesid) {
    res.render('login', { title: '' });
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

router.post('/login', function(req, res) {
  res.send(200);
});

router.get('/remember', function(req, res) {
  if (req.session.insalesid) {
    res.render('remember', { title: '' });
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

router.post('/remember', function(req, res) {
  if (req.session.insalesid) {
    res.send('success');
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

router.get('/service', function(req, res) {
  if (req.session.insalesid) {
    res.send('off');
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

router.get('/dashboard', function(req, res) {
  if (req.session.insalesid) {
    res.render('dashboard', { title: '' });
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

router.post('/dashboard', function(req, res) {
  if (req.session.insalesid) {
    res.send(200);
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

// Сюда приходит запрос от insales на установку приложения
router.get('/install', function(req, res) {
  if ((req.query.shop !== '') && (req.query.token !== '') && (req.query.insales_id !== '') && req.query.shop && req.query.token && req.query.insales_id) {
    User.find({ insalesid: req.query.insales_id }, function (err, u) {
      if (u[0] == null) {
        User.create([{
          insalesid    : req.query.insales_id,
          insalesurl   : req.query.shop,
          token        : crypto.createHash('md5').update(req.query.token + process.env.insalessecret).digest('hex'),
          mailtrig     : false,
          jstagid_main : 0,
          jstagid_var  : 0,
          cookie       : false,
          created_at   : new Date(),
          updated_at   : new Date(),
          webhook      : false,
          enabled      : true
        }], function (err, app) {
              if (err) {
                log('Ошибка установки приложения в insales');
                log(err);
                res.send(err, 500);
              } else {
                log('Приложение успешно установлено в insales');
                log(app);
                res.send(200);
              }
            });
      } else {
        if (u[0].enabled == true) {
          res.send('Приложение уже установленно', 403);
        } else {
          u[0].token = crypto.createHash('md5').update(req.query.token + process.env.insalessecret).digest('hex');
          u[0].updated_at = new Date();
          u[0].enabled = true;
          u[0].save(function (err) {
            if (err) {
              log('Ошибка при активации существующего в базе приложения', 'error');
              log(err, 'error');
              res.send(err, 500);
            } else {
              log('Приложение успешно установлено в insales');
              log(u[0]);
              res.send(200);
            }
          });
        }
      }
    });
  } else {
    log('Переданы не все параметры для установки', 'error');
    res.send('Ошибка установки приложения', 403);
  }
});

// Сюда приходит запрос на удаления приложения из insales
router.get('/uninstall', function(req, res) {
  if ((req.query.shop !== '') && (req.query.token !== '') && (req.query.insales_id !== '') && req.query.shop && req.query.token && req.query.insales_id) {
    User.find({ insalesid: req.query.insales_id }, function (err, u) {
      if (u[0].token == req.query.token) {
        u[0].token = null;
        u[0].updated_at = new Date();
        u[0].enabled = false;
        u[0].save(function (err) {
          if (err) {
            log('Ошибка удаления приложения. Проблема сохранения изменений в базу данных', 'error');
            log(err, 'error');
            res.send(err, 500);
          } else {
            log('Приложение успешно удалено из insales');
            log(u[0]);
            res.send(200);
          }
        });
      } else {
        log('Ошибка удаления приложения. Неправильный token.', 'error');
        res.send('Ошибка удаления приложения', 403);
      }
    });
  } else {
    log('Переданы не все параметры для удаления', 'error');
    res.send('Ошибка удаления приложения', 403);
  }
});

module.exports = router;

var generatePass = function() {
  var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
  var pass = '';
  for (var i = 0; i < 10; i++) {
    var p = Math.floor(Math.random() * set.length);
    pass += set[p];
  }
  return pass;
}

var md5 = function(str) {
  return crypto.createHash('md5').update(str).digest('hex');
}

var appidANDusername = function(appid, username, callback) {
  callback(md5(appid + username));
}

//Схема базы данных
var User = db.define('users', {
  insalesid          : { type: 'integer', unique: true },
  insalesurl         : { type: 'text' },
  insalesautologin   : { type: 'text' },
  token              : { type: 'text' },
  mailtrig           : { type: 'boolean' },
  appid              : { type: 'integer' },
  nameshop           : { type: 'text' },
  nameadmin          : { type: 'text' },
  phone              : { type: 'integer' },
  email              : { type: 'text' },
  username           : { type: 'text' },
  jstagid_main       : { type: 'integer' },
  jstagid_var        : { type: 'integer' },
  autologin          : { type: 'text' },
  webhook            : { type: 'boolean' },
  cookie             : { type: 'boolean' },
  created_at         : { type: 'date', time: true },
  updated_at         : { type: 'date', time: true },
  enabled            : { type: 'boolean' }
});

User.sync(function (err) {
    !err && log('Синхронизация схемы базы данных');
});

//Логгер в одном месте, для упрощения перезда на любой логгер.
function log(logMsg, logType) {
  if (logMsg instanceof Error) logger.error(logMsg.stack);
  if (debugOn) {
    if (logType !== undefined) {
      logger.log(logType, logMsg);
    } else {
      logger.info(logMsg);
    }
  }
};
