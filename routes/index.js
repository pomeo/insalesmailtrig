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
              res.render('dashboard', { title: '', user: a[0] });
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
    var errid = cc.generate({ parts : 1, partLen : 6 });
    User.find({ insalesid: req.session.insalesid }, function (err, u) {
      if (err) {
        log('#' + errid + ' Произошла ошибка обращения к базе данных ' + JSON.stringify(err), 'error');
        res.send(errid);
      } else {
        rest.get('http://' + process.env.insalesid + ':' + u[0].token + '@' + u[0].insalesurl + '/admin/account.xml').once('complete', function(response) {
          if (response.errors) {
            log('#' + errid + ' Ошибка во время запроса данных аккаунта из insales ' + JSON.stringify(response), 'error');
            res.send(errid);
          } else {
            res.render('registration', { title: '', user: response, link: u[0] });
          }
        });
      }
    });
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
});

router.post('/registration', function(req, res) {
  if (req.session.insalesid) {
    var pass = generatePass();
    var p = crypto.createHash('md5').update(pass).digest('hex');
    rest.post('http://app.mailtrig.ru/api/?method=reg_user', {
      data: {
        'mt_partner': req.param('partner'),
        // 'mt_api_url': '',
        // 'mt_integration': '',
        'email': req.param('email'),
        'password': pass
      },
      headers: {'Content-Type': 'application/json'}
    }).once('complete', function(o) {
      var errid = cc.generate({ parts : 1, partLen : 6 });
      if (o.errors) {
        log('Ошибка во время регистрации нового пользователя: ' + JSON.stringify(o), 'error');
        res.send('Произошла ошибка', 500);
      } else {
        var appId = JSON.parse(o);
        if (appId.status == 200) {
          User.find({ insalesid: req.session.insalesid }, function (err, u) {
            if (err) {
              log('#' + errid + ' Произошла ошибка обращения к базе данных ' + JSON.stringify(err), 'error');
              res.send(errid);
            } else {
              u[0].autologin = crypto.createHash('md5').update(req.param('email') + p).digest('hex');
              u[0].mailtrig = true;
              u[0].nameshop = req.param('shop');
              u[0].nameadmin = req.param('fio');
              u[0].phone = req.param('phone');
              u[0].email = req.param('email');
              u[0].appid = appId.data.appId;
              u[0].updated_at = new Date();
              u[0].save(function (e) {
                if (e) {
                  log('#' + errid + ' Произошла ошибка сохранения в базу данных' + JSON.stringify(e), 'error');
                  res.send(errid);
                } else {
                  res.send('success');
                }
              });
            }
          });
        } else {
          if ((appId.error == '401')||(appId.error == '402')||(appId.error == '403')||(appId.error == '404')||(appId.error == '405')||(appId.error == '406')||(appId.error == '407')) {
            log('Ошибка в ответе от mailtrig ' + JSON.stringify(appId), 'error');
            res.send(appId.error);
          } else {
            log('#' + errid + ' Ошибка в ответе от mailtrig на запрос регистрации: ' + JSON.stringify(o), 'warn');
            res.send(errid);
          }
        }
      }
    })
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
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
  if (req.session.insalesid) {
    rest.post('http://app.mailtrig.ru/api/?method=get_appId', {
      data: {
        // 'mt_partner': '',
        // 'mt_api_url': '',
        'username': req.param('login'),
        'password': req.param('pass')
      },
      headers: {'Content-Type': 'application/json'}
    }).once('complete', function(o) {
      var errid = cc.generate({ parts : 1, partLen : 6 });
      if (o.errors) {
        log('#' + errid + ' Ошибка во время регистрации нового пользователя, запрос appId: ' + JSON.stringify(o), 'error');
        res.send(errid);
      } else {
        var appId = JSON.parse(o);
        if (appId.status == 200) {
          User.find({ insalesid: req.session.insalesid }, function (err, u) {
            if (err) {
              log('#' + errid + ' Произошла ошибка обращения к базе данных ' + JSON.stringify(err), 'error');
              res.send(errid);
            } else {
              rest.get('http://' + process.env.insalesid + ':' + u[0].token + '@' + u[0].insalesurl + '/admin/account.xml').once('complete', function(response) {
                if (response.errors) {
                  log('#' + errid + ' Ошибка во время запроса данных аккаунта из insales ' + JSON.stringify(response), 'error');
                  res.send(errid);
                } else {
                  var p = crypto.createHash('md5').update(req.param('pass')).digest('hex');
                  u[0].autologin = crypto.createHash('md5').update(req.param('login') + p).digest('hex');
                  u[0].mailtrig = true;
                  u[0].nameshop = response.account.title[0];
                  u[0].nameadmin = response.account.owner[0].name[0];
                  u[0].phone = response.account.phone[0];
                  u[0].email = req.param('login');
                  u[0].appid = appId.data.appId;
                  u[0].updated_at = new Date();
                  u[0].save(function (e) {
                    if (e) {
                      log('#' + errid + ' Произошла ошибка сохранения в базу данных' + JSON.stringify(e), 'error');
                      res.send(errid);
                    } else {
                      res.send('success');
                    }
                  });
                }
              });
            }
          });
        } else {
          if ((appId.error == '401')||(appId.error == '402')||(appId.error == '403')||(appId.error == '404')||(appId.error == '405')||(appId.error == '406')||(appId.error == '407')) {
            log('Ошибка в ответе от mailtrig ' + JSON.stringify(appId), 'error');
            res.send(appId.error);
          } else {
            log('#' + errid + ' Ошибка в ответе от mailtrig на запрос appId: ' + JSON.stringify(o), 'warn');
            res.send(errid);
          }
        }
      }
    })
  } else {
    log('Попытка обращения с отсутствием сессии', 'warn');
    res.send('Вход возможен только из панели администратора insales -> приложения -> установленные -> войти', 403);
  }
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
    User.find({ insalesid: req.session.insalesid }, function (err, u) {
      if (err) {
        log('Ошибка при запросе данных из базы данных', 'error');
        res.send(err, 500);
      } else {
        if (u[0].appid) {
          log('При открытии /dashboard не найдена запись о пользователе в базе', 'error');
          res.redirect('/');
        } else {
          res.render('dashboard', { title: '', user: u[0] });
        }
      }
    });
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
                log(err, 'error');
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
        u[0].mailtrig = false;
        u[0].autologin = null;
        u[0].appid = 0;
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
  insalesid          : { type: 'integer', unique: true }, //ID магазина в InSales
  insalesurl         : { type: 'text' }, //Домен магазина
  insalesautologin   : { type: 'text' }, //Token автологина insales
  token              : { type: 'text' }, //Token для работы с API InSales
  mailtrig           : { type: 'boolean' }, //Флаг указывающий, что пользователь (администратор магазина) зарегистрирован в системе MailTrig
  appid              : { type: 'integer' }, //AppId в системе MailTrig
  nameshop           : { type: 'text' }, //Название магазина
  nameadmin          : { type: 'text' }, //Имя администратора магазина
  phone              : { type: 'integer' }, //Телефон администратора магазина
  email              : { type: 'text' }, //E-Mail администратора магазина
  username           : { type: 'text' }, //Username в системе MailTrig (email-пользователя)
  jstagid_main       : { type: 'integer' }, //id обработчика событий (если 0, то обработчик не установлен, либо удален)
  jstagid_var        : { type: 'integer' }, //id переменных обработчка (если 0, то обработчик не установлен, либо удален)
  autologin          : { type: 'text' }, //MD5 Hash двух значения AppId и Username (используется для автологина в личном кабинете MailTrig)
  webhook            : { type: 'boolean' }, //Флаг указывающий, что внешний обработчик установлен (при удалении приложения, webhook удаляется автоматически, соответственно флаг должен сбрасываться)
  cookie             : { type: 'boolean' }, //Флаг указывающий, что cookie добавлена в настройки магазина (при установке, необходимо обязательно проверить её наличие, чтобы избежать дублирования)
  created_at         : { type: 'date', time: true }, //Дата создания записи
  updated_at         : { type: 'date', time: true }, //Дата обновляется при любых изменениях
  enabled            : { type: 'boolean' } //Флаг указывающий что приложение установлено
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
