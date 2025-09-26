const getClusterTimezoneOffset = require('../../jobs/cluster/clustertimezoneoffset');
const hpccUtil = require('../../utils/hpcc-util');
const { Cluster } = require('../../models');
const { parentPort } = require('worker_threads');

jest.mock('../../utils/hpcc-util');
jest.mock('worker_threads');
jest.mock('../../jobs/workerUtils', () => () => ({
  log: jest.fn(),
}));

describe('getClusterTimezoneOffset', () => {
  let log;
  beforeEach(() => {
    jest.clearAllMocks();
    parentPort.postMessage = jest.fn();
    log = require('../../jobs/workerUtils')().log;
  });

  it('should post info and exit if no clusters', async () => {
    Cluster.findAll.mockResolvedValue([]);
    await getClusterTimezoneOffset();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: 'No clusters to get timezone offset for',
      })
    );
  });

  it('should post info for up-to-date timezone offset', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 1 }]);
    hpccUtil.getClusterTimezoneOffset.mockResolvedValue(100);
    Cluster.findOne.mockResolvedValue({ id: 1, timezone_offset: 100 });
    await getClusterTimezoneOffset();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: 'Cluster timezone offset is up to date',
      })
    );
  });

  it('should update cluster and post info if offset changed', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 2 }]);
    hpccUtil.getClusterTimezoneOffset.mockResolvedValue(200);
    Cluster.findOne.mockResolvedValue({ id: 2, timezone_offset: 100 });
    Cluster.update.mockResolvedValue({});
    await getClusterTimezoneOffset();
    expect(Cluster.update).toHaveBeenCalledWith(
      { timezone_offset: 200 },
      { where: { id: 2 } }
    );
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining('Cluster timezone offset updated for 2'),
      })
    );
  });

  it('should post error if hpccUtil throws', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 3 }]);
    hpccUtil.getClusterTimezoneOffset.mockRejectedValue(new Error('fail'));
    await getClusterTimezoneOffset();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('Error checking cluster timezone offset'),
      })
    );
  });

  it('should post completion message at end', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 4 }]);
    hpccUtil.getClusterTimezoneOffset.mockResolvedValue(100);
    Cluster.findOne.mockResolvedValue({ id: 4, timezone_offset: 100 });
    await getClusterTimezoneOffset();
    expect(parentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining('Cluster Timezone Offset Job completed'),
      })
    );
  });
});
