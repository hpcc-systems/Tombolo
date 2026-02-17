export interface ApplicationAttributes {
  id: string;
  title: string;
  description: string;
  creator: string;
  visibility?: 'Public' | 'Private';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  deletedAt?: Date | string | null;

  // Associations
  userApplications?: any[];
  fileMonitorings?: any[];
  integrationMappings?: any[];
  jobMonitorings?: any[];
  costMonitorings?: any[];
  orbitProfileMonitorings?: any[];
}

export type ApplicationDTO = ApplicationAttributes;
