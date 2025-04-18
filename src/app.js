const express = require('express');
const bodyParser = require('body-parser');
const carsRoutes = require('./routes/carsRoutes');
const servicesRoutes = require('./routes/servicesRoutes');
const consultationRoutes = require('./routes/consultationRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/cars', carsRoutes);
app.use('/services', servicesRoutes);
app.use('/consultation', consultationRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});