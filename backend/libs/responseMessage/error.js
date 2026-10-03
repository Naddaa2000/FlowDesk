const errorResponse = (res, error, statusCode = 500) => {
  const message = typeof error === "string" ? error : error?.message || "Error";
  res.status(statusCode).json({
    success: false,
    status: "fail",
    error: typeof error !== "string" ? error : null,
    message,
    data: null,
    result: null,
  });
};

module.exports = errorResponse;
