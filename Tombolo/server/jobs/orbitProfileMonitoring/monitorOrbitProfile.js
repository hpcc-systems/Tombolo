const { parentPort } = require('worker_threads');
const { logOrPostMessage } = require('../jobUtils');
const { OrbitProfileMonitoring } = require('../../models');

async function monitorOrbitProfile() {
  try {
    logOrPostMessage({
      level: 'info',
      text: 'Orbit monitoring running message ..',
    });

    // Get all active Orbit Profile Monitoring
    const activeOrbitProfiles = await OrbitProfileMonitoring.findAll({
      where: { isActive: true },
      raw: true,
    });

    console.log('------------------------');
    console.dir({ activeOrbitProfiles }, { depth: null });
    console.log('------------------------');

    // If running under Bree worker, optionally signal completion or trigger downstream jobs
    if (parentPort) {
      parentPort.postMessage({ action: 'done' });
    }
  } catch (err) {
    logOrPostMessage({
      level: 'error',
      text: `monitorOrbitProfile: ${err.message}`,
    });
  }
}

(async () => {
  await monitorOrbitProfile();
})();

module.exports = {
  monitorOrbitProfile,
};
