const express = require("express");
const router = express.Router();

//route just to check if backend is running
router.get("/", (req, res) => {
  res.send("Tombolo's Backend is running succesfully");
});

module.exports = router;
