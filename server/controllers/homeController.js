const httpStatus = require('http-status-codes')
exports.sendHome = (req, res) => {
  res.render('index')
  console.log(httpStatus.OK)
}
exports.recieveData = (req, res) => {
  console.log(req.body)
}
exports.sendProfile = (req, res) => {
  res.render('profile', { name: req.params.name })
}
