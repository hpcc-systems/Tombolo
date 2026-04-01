import { vi, describe, it, expect, beforeEach } from 'vitest';
import getClusterTimezoneOffset from '../../jobs/cluster/clustertimezoneoffset.js';
import { getClusterTimezoneOffset as utilGetClusterTzOffset } from '../../utils/hpcc-util.js';
import { mockedModels } from '../mockedModels.js';
const { Cluster } = mockedModels;
import { parentPort } from 'worker_threads';

const workerParentPort = parentPort as NonNullable<typeof parentPort>;
const mockedGetClusterTzOffset =
  utilGetClusterTzOffset as unknown as ReturnType<typeof vi.fn>;

vi.mock('../../utils/hpcc-util.js');
vi.mock('../../jobs/workerUtils.js', () => ({
  default: () => ({
    log: vi.fn(),
  }),
}));

describe('getClusterTimezoneOffset', () => {
  let _log;
  beforeEach(async () => {
    vi.clearAllMocks();
    vi.clearAllMocks();
    const workerUtils = (await import('../../jobs/workerUtils.js')).default;
    _log = workerUtils(parentPort).log;
  });

  it('should post info and exit if no clusters', async () => {
    Cluster.findAll.mockResolvedValue([]);
    await getClusterTimezoneOffset();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: 'No clusters to get timezone offset for',
      })
    );
  });

  it('should post info for up-to-date timezone offset', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 1 }]);
    mockedGetClusterTzOffset.mockResolvedValue(100);
    Cluster.findOne.mockResolvedValue({ id: 1, timezone_offset: 100 });
    await getClusterTimezoneOffset();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: 'Cluster timezone offset is up to date',
      })
    );
  });

  it('should update cluster and post info if offset changed', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 2 }]);
    mockedGetClusterTzOffset.mockResolvedValue(200);
    Cluster.findOne.mockResolvedValue({ id: 2, timezone_offset: 100 });
    Cluster.update.mockResolvedValue({});
    await getClusterTimezoneOffset();
    expect(Cluster.update).toHaveBeenCalledWith(
      { timezone_offset: 200 },
      { where: { id: 2 } }
    );
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining('Cluster timezone offset updated for 2'),
      })
    );
  });

  it('should post error if hpccUtil throws', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 3 }]);
    mockedGetClusterTzOffset.mockRejectedValue(new Error('fail'));
    await getClusterTimezoneOffset();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'error',
        text: expect.stringContaining('Error checking cluster timezone offset'),
      })
    );
  });

  it('should post completion message at end', async () => {
    Cluster.findAll.mockResolvedValue([{ id: 4 }]);
    mockedGetClusterTzOffset.mockResolvedValue(100);
    Cluster.findOne.mockResolvedValue({ id: 4, timezone_offset: 100 });
    await getClusterTimezoneOffset();
    expect(workerParentPort.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        level: 'info',
        text: expect.stringContaining('Cluster Timezone Offset Job completed'),
      })
    );
  });
});
