import type { IOptions } from '@hpcc-js/comms';

/**
 * Customizes HPCC cluster connection options to allow/disallow self-signed certificates
 * @param iOptions - HPCC connection options
 * @param allowSelfSigned - Whether to allow self-signed SSL certificates
 * @returns Modified IOptions with rejectUnauthorized set
 */
function getClusterOptions(
  iOptions: IOptions,
  allowSelfSigned: boolean
): IOptions {
  iOptions.rejectUnauthorized = !allowSelfSigned;
  return iOptions;
}

export { getClusterOptions };
