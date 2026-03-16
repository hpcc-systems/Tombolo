// ASR Domain
export interface AsrDomainAttributes {
  id: string;
  name: string;
  region: string;
  severityThreshold: number;
  severityAlertRecipients: any;
  metaData?: any | null;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string | null;
  deletedAt?: Date | string | null;

  // Associations
  creator?: any;
  updater?: any;
  associatedMonitoringTypes?: any[];
  associatedProducts?: any[];
}

export type AsrDomainDTO = AsrDomainAttributes;

// ASR Product
export interface AsrProductAttributes {
  id: string;
  name: string;
  shortCode: string;
  tier: number;
  createdBy: string;
  updatedBy?: string | null;
  deletedBy?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string | null;
  deletedAt?: Date | string | null;

  // Associations
  creator?: any;
  updater?: any;
  associatedDomains?: any[];
}

export type AsrProductDTO = AsrProductAttributes;
