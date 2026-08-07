const successResponse = (res, message, result, statusCode = 200) => {
  res.status(statusCode).json({
    success: true,
    status: "success",
    error: null,
    message,
    data: result,
    result,
  });
};

module.exports = successResponse;
