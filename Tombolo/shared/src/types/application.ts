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

// UI-friendly Application type used by client components
export interface Application extends ApplicationAttributes {
  // optional richer creator info for UI
  application_creator?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
  };
}

export type ApplicationUI = Application;
