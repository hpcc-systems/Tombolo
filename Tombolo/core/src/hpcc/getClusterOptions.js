/**
 * @param {import("@hpcc-js/comms").IOptions} iOptions
 * @param {boolean} allowSelfSigned
 * @returns {import("@hpcc-js/comms").IOptions} Returns a customized IOptions
 */
function getClusterOptions(iOptions, allowSelfSigned) {
  iOptions.rejectUnauthorized = !allowSelfSigned;
  return iOptions;
}

module.exports = { getClusterOptions };
