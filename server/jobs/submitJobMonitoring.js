const hpccUtil = require("../utils/hpcc-util");

(async () => {
  const cluster_id = "d7864d62-f610-4da1-9d15-f7ce7ab360d6";

  // Get cluster details
  const wUService = await hpccUtil.getWorkunitsService(cluster_id);
  const wus = await wUService.WUQuery({ LastNDays: 1, DateRB: 0 });

  console.log("------------------------------------------");
  console.dir(wus, {depth : null});
  console.log("------------------------------------------");
})();
