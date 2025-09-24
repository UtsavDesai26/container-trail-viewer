require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');

const containersRoute = require('./routes/containers');

const PORT = process.env.PORT || 4000;

async function start() {
  await connectDB();

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api/containers', containersRoute);

  app.get('/', (req, res) => res.send('Container Trail API'));

  app.use((err, req, res, next) => {
    console.error('Unexpected error', err);
    res.status(500).json({ error: err.message || 'server error' });
  });

  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
