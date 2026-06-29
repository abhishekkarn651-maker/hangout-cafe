const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const errorHandler = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();

const app = express();

// Standard Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve local uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve admin dashboard statically
app.use('/admin', express.static(path.join(__dirname, '../admin')));
// Serve public website statically from the root
app.use(express.static(path.join(__dirname, '../')));

// Routes Setup
app.use('/api/admin', require('./routes/authRoutes'));
app.use('/api/banner', require('./routes/bannerRoutes'));
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/gallery', require('./routes/galleryRoutes'));
app.use('/api/offers', require('./routes/offerRoutes'));
app.use('/api/about', require('./routes/aboutRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// Fallback for 404 - Route not found
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route not found - ${req.originalUrl}`,
    errors: []
  });
});

// Centralized Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const autoCreateTables = require('./utils/autoCreateTables');

const server = app.listen(PORT, async () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  // Automatically check and create tables if missing
  await autoCreateTables();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // Close server & exit process
  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

module.exports = { app, server };

