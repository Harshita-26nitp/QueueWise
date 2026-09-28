export function notFound(req, res) {
  res.status(404).json({
 success:false, message:`Route not found: ${req.method} ${req.originalUrl}`
  });
}
export function errorHandler(error,req,res,next) {
  console.error(error);
  if(error.name==="JsonWebTokenError") {
    error.statusCode = 401;
    error.message = "Invalid login token";
  }
  if (error.code===11000) {
    error.statusCode = 409;
    error.message = "A record with this value already exists";
  }
  res.status(error.statusCode||500).json({
    success: false,
    message: error.message||"Internal server error"
  });
}