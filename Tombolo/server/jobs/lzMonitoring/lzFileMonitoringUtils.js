const logger = require('../../config/logger');

// Match strings using * and ? wildcards
const wildcardMatch = (pattern, str) => {
  const escaped = pattern.replace(/[-\\/^$+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(
    '^' + escaped.replace(/\*/g, '.*').replace(/\?/g, '.') + '$'
  );
  return regex.test(str);
};

// Get files from a single landing zone directory
const getFilesFromSingleLzDirectory = async ({
  lzFileMovementMonitoringId,
  fss,
  DropZoneName,
  Netaddr,
  Path,
  directoryOnly,
}) => {
  try {
    const resp = await fss.FileList({
      DropZoneName,
      Netaddr,
      Path,
      directoryOnly,
    });

    const contents = resp?.files?.PhysicalFileStruct || [];
    // Add lzFileMovementMonitoringId to each file
    if (contents.length > 0) {
      contents.forEach(file => {
        file.lzFileMovementMonitoringId = lzFileMovementMonitoringId;
      });
    }

    return contents;
  } catch (error) {
    logger.error(
      `Error in getting files from ${DropZoneName}, ${Netaddr}, ${Path} - ${error.message}`
    );
    return [];
  }
};

// Get files recursively given the destionation path and depth
const getFilesFromLandingZoneRecursivly = async ({
  lzFileMovementMonitoringId,
  depth,
  fss,
  DropZoneName,
  Netaddr,
  Path,
  directoryOnly,
  fileNameToMatch,
}) => {
  try {
    let currentDepth = 0;
    const files = [];
    let pathsToProcess = [Path]; // Start with initial path

    while (pathsToProcess.length > 0 && currentDepth < depth) {
      logger.verbose(
        `Processing depth ${currentDepth + 1}/${depth}, paths: ${pathsToProcess.length}`
      );

      const currentPaths = [...pathsToProcess];
      pathsToProcess = [];

      for (const currentPath of currentPaths) {
        try {
          const filiesAndDirs = await getFilesFromSingleLzDirectory({
            lzFileMovementMonitoringId,
            fss,
            DropZoneName,
            Netaddr,
            Path: currentPath,
            directoryOnly,
          });

          filiesAndDirs.forEach(f => {
            if (!f.isDir) {
              // Check if the file is a match
              if (fileNameToMatch && wildcardMatch(fileNameToMatch, f.name)) {
                files.push(f);
              }
            } else {
              // Add directory paths for next iteration
              const pathForTheDir = `${f.Path}${f.name}`;
              pathsToProcess.push(pathForTheDir);
            }
          });
        } catch (error) {
          logger.error(`Error processing files from ${currentPath}:`, error);
        }
      }

      currentDepth++;
    }

    return files;
  } catch (error) {
    logger.error(error);
  }
};

// Time/Date Functions
// Local time at cluster
const findLocalDateTimeAtCluster = timeZoneOffset => {
  const newDate = new Date();
  const localTime = new Date(newDate.getTime() + timeZoneOffset * 60 * 1000);
  return localTime;
};

// Unit Conversion Functions
// Convert bytes to specified unit
const convertBytes = (bytes, unit) => {
  const units = {
    MB: 1024 ** 2, // 1,048,576 bytes
    GB: 1024 ** 3, // 1,073,741,824 bytes
    TB: 1024 ** 4, // 1,099,511,627,776 bytes
    PB: 1024 ** 5, // 1,125,899,906,842,624 bytes
  };
  return bytes / (units[unit] || 1);
};

// Format size for display
const formatSize = (bytes, unit) => {
  const size = convertBytes(bytes, unit);
  return `${size.toFixed(2)} ${unit}`;
};

module.exports = {
  getFilesFromSingleLzDirectory,
  getFilesFromLandingZoneRecursivly,
  findLocalDateTimeAtCluster,
  convertBytes,
  formatSize,
};
