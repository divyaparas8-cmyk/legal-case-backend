const { sendResponse } = require('../utils/response');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  if (statusCode >= 500) {
    console.error(err.stack);
  }

  res.status(statusCode).json(sendResponse(false, message));
};

module.exports = {
  errorHandler,
};
