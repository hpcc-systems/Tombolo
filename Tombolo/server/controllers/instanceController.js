const { where } = require("sequelize");
const Models = require("../models");
const instance_settings = Models.instance_settings;

// Get a single instance setting by name
const getInstanceSetting = async (req, res) => {
  try {
    const instance = await instance_settings.findOne({
      where: { name: req.params.name },
    });

    if (!instance) {
      return res.status(404).json({ message: "Instance setting not found" });
    }
    res.status(200).json(instance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all instance settings
const getAllInstanceSettings = async (req, res) => {
  try {
    const instances = await instance_settings.findAll();
    if (!instances) {
      return res.status(404).json({ message: "Instance settings not found" });
    }
    res.status(200).json(instances);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new instance setting
const createInstanceSetting = async (req, res) => {
  try {
    const newInstance = await instance_settings.create(req.body);

    if (!newInstance) {
      return res
        .status(400)
        .json({ message: "Failed to create instance setting" });
    }
    res.status(201).json(newInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an existing instance setting by ID
const updateInstanceSetting = async (req, res) => {
  try {
    const instance = await instance_settings.findOne({
      where: { id: req.params.id },
    });

    if (!instance) {
      return res.status(404).json({ message: "Instance setting not found" });
    }

    const updatedInstance = await instance.update(req.body);

    res.status(200).json(updatedInstance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an instance setting by ID
const deleteInstanceSetting = async (req, res) => {
  try {
    const instance = await instance_settings.findOne({
      where: { id: req.params.id },
    });
    if (!instance) {
      return res.status(404).json({ message: "Instance setting not found" });
    }

    await instance.destroy();
    res.status(200).json({ message: "Instance setting deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInstanceSetting,
  getAllInstanceSettings,
  createInstanceSetting,
  updateInstanceSetting,
  deleteInstanceSetting,
};
