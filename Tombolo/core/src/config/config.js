const path = require('path');
const fs = require('fs');
const rootENV = path.join(process.cwd(), '..', '.env');
const serverENV = path.join(process.cwd(), '.env');
const ENVPath = fs.existsSync(rootENV) ? rootENV : serverENV;
require('dotenv').config({ path: ENVPath });

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

module.exports = {
  ENCRYPTION_KEY,
};
