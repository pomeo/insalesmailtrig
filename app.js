var express = require('express'),
    debug = require('debug')('mailtrig'),
    session = require('express-session'),
    mysql = require('mysql'),
    MySQLStore = require('connect-mysql')(session),
    options = {
      config: {
        host: process.env.mysqlhost,
        user: process.env.mysqluser,
        password: process.env.mysqlpass,
        database: process.env.mysqldb
      }
    },
    path = require('path'),
    favicon = require('static-favicon'),
    logger = require('morgan'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    xmlparser = require('express-xml-bodyparser');

var routes = require('./routes/index');

var app = express();

app.set('port', process.env.PORT || 3000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
if (app.get('env') !== 'development') {
  app.enable('view cache');
}
app.enable('trust proxy');
app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
app.use(xmlparser());
app.use(cookieParser());
app.use(session({secret: process.env.SECRET, store: new MySQLStore(options)}))
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);

/// catch 404 and forwarding to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var server = app.listen(app.get('port'), function() {
  debug('Express server listening on port ' + server.address().port);
});
