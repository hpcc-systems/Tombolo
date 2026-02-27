// Shared types for JobMonitoring components

export interface DomainOption {
  value: string;
  label: string;
}

export interface ProductCategoryOption {
  value: string;
  label: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  shortCode?: string;
}
