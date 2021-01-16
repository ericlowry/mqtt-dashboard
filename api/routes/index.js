const express = require('express');
const router = express.Router();
const pkg = require('../package.json');

/* GET home page. */
router.get('/', function (req, res, next) {
  res.send({
    name: pkg.name,
    description: pkg.description,
    version: pkg.version,
  });
});

module.exports = router;
