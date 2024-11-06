const Models = require("../models");
const instance_settings = Models.instance_settings;

const createInstanceSettingFirstRun = async (req, res) => {
  try {
    const {
      instanceValues: { name, description, contactEmail },
    } = req.body;

    const nameSetting = await instance_settings.create({
      name: "name",
      value: name,
      createdBy: "system",
      updatedBy: "system",
    });

    const descriptionSetting = await instance_settings.create({
      name: "description",
      value: description,
      createdBy: "system",
      updatedBy: "system",
    });

    const contactEmailSetting = await instance_settings.create({
      name: "contactEmail",
      value: contactEmail,
      createdBy: "system",
      updatedBy: "system",
    });

    if (!nameSetting || !descriptionSetting || !contactEmailSetting) {
      return res
        .status(400)
        .json({ message: "Failed to create instance settings" });
    }
    res
      .status(201)
      .json({ nameSetting, descriptionSetting, contactEmailSetting });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createInstanceSettingFirstRun,
};
