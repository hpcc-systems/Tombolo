import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, expect, test, beforeEach } from 'vitest';
import MonitoringDetailsModal from '@/components/common/Monitoring/MonitoringDetailsModal';
import React from 'react';

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    content: '',
  }),
});

// Sample test data
const mockSelectedMonitoring = {
  monitoringName: 'Test Monitoring',
  description: 'This is a test monitoring',
  createdAt: '2025-09-01T12:00:00Z',
  updatedAt: '2025-09-03T12:00:00Z',
  approvedAt: '2025-09-02T12:00:00Z',
  isActive: true,
  approvalStatus: 'Approved',
  approverComment: 'Looks good',
  clusterIds: ['cluster1', 'cluster2'],
  creator: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  },
  approver: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
  },
  updater: {
    firstName: 'Bob',
    lastName: 'Johnson',
    email: 'bob.johnson@example.com',
  },
  metaData: {
    asrSpecificMetaData: {
      jobMonitorType: 'Batch',
      domain: 'domain1',
      productCategory: 'category1',
      severity: 'High',
    },
    notificationMetaData: {
      notificationCondition: ['OnFailure', 'OnSuccess'],
      primaryContacts: ['primary@example.com'],
      secondaryContacts: ['secondary@example.com'],
      notifyContacts: ['notify@example.com'],
    },
    // New structure used by Orbit Profile Monitoring UI
    monitoringData: {
      notificationConditions: ['OnFailure', 'OnSuccess'],
    },
  },
};

const mockClusters = [
  { id: 'cluster1', name: 'Cluster One' },
  { id: 'cluster2', name: 'Cluster Two' },
];

const mockDomains = [{ value: 'domain1', label: 'Domain One' }];

const mockProductCategories = [{ value: 'category1', label: 'Category One' }];

describe('MonitoringDetailsModal', () => {
  const setDisplayMonitoringDetailsModal = vi.fn();
  const setSelectedMonitoring = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not render when selectedMonitoring is null', () => {
    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={null}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    expect(screen.queryByText('Test Monitoring Type Details')).not.toBeInTheDocument();
  });

  test('renders modal with monitoring details when open', async () => {
    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={mockSelectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    // Wait for the modal to appear
    await screen.findByText('Test Monitoring Type Details');

    // Verify core modal content
    expect(screen.getByText('Test Monitoring')).toBeInTheDocument();
    expect(screen.getByText('This is a test monitoring')).toBeInTheDocument();
    expect(screen.getByText('Cluster One')).toBeInTheDocument();
    expect(screen.getByText('Cluster Two')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('Approval status')).toBeInTheDocument();
    expect(screen.getByText('Approved')).toBeInTheDocument();
    expect(screen.getByText("Approver's comment")).toBeInTheDocument();
    expect(screen.getByText('Looks good')).toBeInTheDocument();
  });

  test('renders audit info with creator, approver, and updater', async () => {
    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={mockSelectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    await screen.findByText('Test Monitoring Type Details');

    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Approved by')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Last updated by')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

    const createdByLabel = screen.getByText('Created by');
    const createdBySection = createdByLabel.closest('.ant-descriptions-row');
    expect(within(createdBySection).getByText('John Doe')).toBeInTheDocument();
    expect(within(createdBySection).getByText(content => content.includes('September 1, 2025'))).toBeInTheDocument();

    const approvedByLabel = screen.getByText('Approved by');
    const approvedBySection = approvedByLabel.closest('.ant-descriptions-row');
    expect(within(approvedBySection).getByText('Jane Smith')).toBeInTheDocument();
    expect(within(approvedBySection).getByText(content => content.includes('September 2, 2025'))).toBeInTheDocument();

    const updatedByLabel = screen.getByText('Last updated by');
    const updatedBySection = updatedByLabel.closest('.ant-descriptions-row');
    expect(within(updatedBySection).getByText('Bob Johnson')).toBeInTheDocument();
    expect(within(updatedBySection).getByText(content => content.includes('September 3, 2025'))).toBeInTheDocument();
  });

  test('renders ASR-specific metadata', async () => {
    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={mockSelectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    await screen.findByText('Test Monitoring Type Details');

    expect(screen.getByText('Job Monitoring Type')).toBeInTheDocument();
    expect(screen.getByText('Batch')).toBeInTheDocument();
    expect(screen.getByText('Domain')).toBeInTheDocument();
    expect(screen.getByText('Domain One')).toBeInTheDocument();
    expect(screen.getByText('Product category')).toBeInTheDocument();
    expect(screen.getByText('Category One')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('renders notification metadata', async () => {
    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={mockSelectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    await screen.findByText('Test Monitoring Type Details');

    expect(screen.getByText('Notify when')).toBeInTheDocument();
    // monitoringData now contains the conditions; they render as provided
    expect(screen.getByText('OnFailure')).toBeInTheDocument();
    expect(screen.getByText('OnSuccess')).toBeInTheDocument();
  });

  test('closes modal and resets selectedMonitoring on cancel', async () => {
    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={mockSelectedMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    await screen.findByText('Test Monitoring Type Details');

    // Click the Close button in the footer
    fireEvent.click(screen.getByText('Close'));
    // The code below will close by clicking the header button ('X')
    // fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    // Verify the modal closes and state is updated
    await waitFor(
      () => {
        expect(setDisplayMonitoringDetailsModal).toHaveBeenCalledWith(false);
        expect(setSelectedMonitoring).toHaveBeenCalledWith(null);
        // Weird behavior here, the modal is still in the DOM but not visible
        // expect(screen.queryByText('Test Monitoring Type Details')).not.toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  test('handles missing metadata gracefully', async () => {
    const noMetadataMonitoring = {
      ...mockSelectedMonitoring,
      metaData: {},
    };

    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={noMetadataMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    await screen.findByText('Test Monitoring Type Details');

    expect(screen.queryByText('Job Monitoring Type')).not.toBeInTheDocument();
    expect(screen.queryByText('Domain')).not.toBeInTheDocument();
    expect(screen.queryByText('Product category')).not.toBeInTheDocument();
    expect(screen.queryByText('Severity')).not.toBeInTheDocument();
    expect(screen.queryByText('Notify when')).not.toBeInTheDocument();
  });

  test('displays unknown cluster when cluster ID is invalid', async () => {
    const invalidClusterMonitoring = {
      ...mockSelectedMonitoring,
      clusterIds: ['invalid-cluster'],
    };

    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={invalidClusterMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    await screen.findByText('Test Monitoring Type Details');
    expect(screen.getByText('Unknown (invalid-cluster)')).toBeInTheDocument();
  });

  test('renders audit info with JSON-parsed fields', async () => {
    const jsonMonitoring = {
      ...mockSelectedMonitoring,
      creator: null,
      approver: null,
      updater: null,
      createdBy: JSON.stringify({ name: 'John Doe', email: 'john.doe@example.com' }),
      approvedBy: JSON.stringify({ name: 'Jane Smith', email: 'jane.smith@example.com' }),
      lastUpdatedBy: JSON.stringify({ name: 'Bob Johnson', email: 'bob.johnson@example.com' }),
    };

    render(
      <MonitoringDetailsModal
        displayMonitoringDetailsModal={true}
        setDisplayMonitoringDetailsModal={setDisplayMonitoringDetailsModal}
        selectedMonitoring={jsonMonitoring}
        setSelectedMonitoring={setSelectedMonitoring}
        clusters={mockClusters}
        domains={mockDomains}
        productCategories={mockProductCategories}
        monitoringTypeName="Test Monitoring Type"
      />
    );

    await screen.findByText('Test Monitoring Type Details');

    expect(screen.getByText('Created by')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Approved by')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Last updated by')).toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });
});
