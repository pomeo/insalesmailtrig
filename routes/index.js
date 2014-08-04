var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.render('index', { title: 'Express' });
});

module.exports = router;

//Логгер в одном месте, для упрощения перезда на любой логгер.
function log(logMsg) {
  if (logMsg instanceof Error) console.log(logMsg.stack);
  if (debugOn) {
    if (typeof logMsg == 'object') {
      console.dir(logMsg);
    } else {
      console.log(logMsg);
    }
  }
};