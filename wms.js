const express = require('express');
const app = express();
const mysql = require('mysql');
const cors = require('cors');

app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'smart_waste_management'
});

db.connect((err) => {
  if (err) {
    console.error('error connecting:', err);
    return;
  }
  console.log('connected as id ' + db.threadId);
});

// Get all bins
app.get('/bins', (req, res) => {
  db.query('SELECT * FROM bins', (err, results) => {
    if (err) {
      console.error('error running query:', err);
      res.status(500).send({ message: 'Error fetching bins' });
    } else {
      res.send(results);
    }
  });
});

// Get bin by id
app.get('/bins/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM bins WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('error running query:', err);
      res.status(500).send({ message: 'Error fetching bin' });
    } else {
      res.send(results[0]);
    }
  });
});

// Update bin
app.put('/bins/:id', (req, res) => {
  const id = req.params.id;
  const bin = req.body;
  db.query('UPDATE bins SET ? WHERE id = ?', [bin, id], (err, results) => {
    if (err) {
      console.error('error running query:', err);
      res.status(500).send({ message: 'Error updating bin' });
    } else {
      res.send({ message: 'Bin updated successfully' });
    }
  });
});

// Get all facilities
app.get('/facilities', (req, res) => {
  db.query('SELECT * FROM facilities', (err, results) => {
    if (err) {
      console.error('error running query:', err);
      res.status(500).send({ message: 'Error fetching facilities' });
    } else {
      res.send(results);
    }
  });
});

// Get facility by id
app.get('/facilities/:id', (req, res) => {
  const id = req.params.id;
  db.query('SELECT * FROM facilities WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('error running query:', err);
      res.status(500).send({ message: 'Error fetching facility' });
    } else {
      res.send(results[0]);
    }
  });
});

// Update facility
app.put('/facilities/:id', (req, res) => {
  const id = req.params.id;
  const facility = req.body;
  db.query('UPDATE facilities SET ? WHERE id = ?', [facility, id], (err, results) => {
    if (err) {
      console.error('error running query:', err);
      res.status(500).send({ message: 'Error updating facility' });
    } else {
      res.send({ message: 'Facility updated successfully' });
    }
  });
});

// Get all vehicles
app.get('/vehicles', (req, res) => {
  db.query('SELECT * FROM vehicles', (err, results) => {