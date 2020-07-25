'use strict'

const httpStatus = require('http-status-codes')
const path = require('path')

exports.logErrors = (error, req, res, next) => {
  console.error(error.stack)
  next(error)
}

exports.respondNoResourceFound = (req, res) => {
  const errorCode = httpStatus.NOT_FOUND
  res.status(errorCode)
  // res.send(`${errorCode} | The page does not exist!`);
  res.sendFile(path.join(__dirname, '../public/html/Er404.html'))
}

exports.respondInternalError = (error, req, res, next) => {
  const errorCode = httpStatus.INTERNAL_SERVER_ERROR
  console.log(`ERROR occurred: ${error.stack}`)
  res.status(errorCode)
  res.send(`${errorCode} | Sorry, our application is experiencing a problem!`)
}
