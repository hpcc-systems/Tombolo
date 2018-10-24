const express = require('express');
const app = express();
app.use(express.json());

const assert = require('assert');

const appRead = require('./routes/app/read');
const fileRead = require('./routes/file/read');
const indexRead = require('./routes/index/read');
const integrationRead = require('./routes/integration/read');

app.use('/api/app/read', appRead);
app.use('/api/file/read', fileRead);
app.use('/api/index/read', indexRead);
app.use('/api/integration/read', integrationRead);


app.listen(3000, () => console.log('Server listening on port 3000!'));