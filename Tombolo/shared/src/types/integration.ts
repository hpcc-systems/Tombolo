export interface IntegrationAttributes {
  id: string;
  name: string;
  config?: Record<string, any> | null;
  application_id?: string | null;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type IntegrationDTO = IntegrationAttributes;

// eslint-disable-next-line
export interface IntegrationUI extends IntegrationAttributes {}

export type IntegrationUIDTO = IntegrationUI;
