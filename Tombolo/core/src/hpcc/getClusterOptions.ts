import type { IOptions } from '@hpcc-js/comms';

/**
 * Configure cluster connection options
 * @param iOptions - HPCC cluster connection options
 * @param allowSelfSigned - Whether to allow self-signed certificates
 * @returns Customized IOptions with certificate settings
 */
export function getClusterOptions(
  iOptions: IOptions,
  allowSelfSigned: boolean
): IOptions {
  iOptions.rejectUnauthorized = !allowSelfSigned;
  return iOptions;
}
