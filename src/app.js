require('express-async-errors'); // permite usar async/await en controladores sin try/catch manual
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const apiRoutes = require('./routes');
const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const app = express();

// Middlewares globales
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rutas
app.use('/api/v1', apiRoutes);

// Manejo de errores (siempre al final)
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
