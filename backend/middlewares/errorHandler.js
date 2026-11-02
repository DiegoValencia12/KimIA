export const errorHandler = (error, req, res, next) => {
  console.error('[ERROR INTERNO]', {
    message: error.message,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  })

  if (res.headersSent) {
    return next(error)
  }

  return res.status(error.status || 500).json({
    error: error.status && error.status < 500
      ? error.message
      : 'Ha ocurrido un error interno. Inténtalo más tarde.'
  })
}