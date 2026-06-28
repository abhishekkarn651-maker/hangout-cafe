// Centralized Error Handling Middleware (updated for Supabase PostgreSQL)
const errorHandler = (err, req, res, next) => {
  console.error('Error Details:', err);

  // Supabase/Postgres Invalid UUID Format (code 22P02)
  if (err.code === '22P02') {
    return res.status(400).json({
      success: false,
      message: 'Resource not found with that id format',
      errors: [{ field: 'id', message: 'The provided UUID format is invalid' }]
    });
  }

  // Supabase/Postgres Duplicate Key Violation (code 23505)
  if (err.code === '23505') {
    let field = 'field';
    let message = 'Duplicate value entered';
    
    if (err.detail) {
      const match = err.detail.match(/Key \((.*?)\)=\((.*?)\) already exists/);
      if (match) {
        field = match[1];
        message = `${field} must be unique`;
      }
    }
    return res.status(400).json({
      success: false,
      message: 'Duplicate field value entered',
      errors: [{ field, message }]
    });
  }

  // Supabase/Postgres Not Null Constraint Violation (code 23502)
  if (err.code === '23502') {
    const field = err.column || 'field';
    return res.status(400).json({
      success: false,
      message: `${field} is required`,
      errors: [{ field, message: 'This field is required' }]
    });
  }

  // Multer Error (e.g. limit exceeded)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
      errors: [{ field: err.field, message: err.message }]
    });
  }

  // Final fallback response
  const statusCode = err.statusCode || (err.status ? parseInt(err.status, 10) : 500) || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: []
  });
};

module.exports = errorHandler;
