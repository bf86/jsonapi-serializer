module.exports = function(res, status, obj) {
  if (!res.headersSent) {
    res.status(status).json(obj);
  }
}
