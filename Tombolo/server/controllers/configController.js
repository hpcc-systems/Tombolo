// Get instance details form .env file
const getInstanceDetails = async (req, res) => {
  try {
    const instanceName = process.env.INSTANCE_NAME;
    const environment = process.env.NODE_ENV;
    
    res.status(200).json({ success: true, data: { instanceName, environment } });
  
  } catch (err) {
    logger.error(`Get instance details: ${err.message}`);
    res
      .status(err.status || 500)
      .json({ success: false, message: err.message });
  }
};

//Exports
module.exports = {
  getInstanceDetails,
};
