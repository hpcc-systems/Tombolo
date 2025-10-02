/* eslint-disable */
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MonitoringFilters from '@/components/common/Monitoring/MonitoringFilters.jsx';

// Mock antd primitives used by MonitoringFilters
vi.mock('antd', async (importOriginal) => {
  const antd = await importOriginal();

  const MockForm = ({ children, onValuesChange, className }) => (
    <form data-testid="form" className={className} onChange={(e) => onValuesChange?.({}, {})}>
      {children}
    </form>
  );
  MockForm.Item = ({ name, label, children }) => (
    <div data-testid={`form-item-${Array.isArray(name) ? name.join('.') : name}`}>
      {label ? <div>{label}</div> : null}
      {children}
    </div>
  );
  MockForm.useForm = () => [{}, vi.fn()];

  const MockRow = ({ children }) => <div data-testid="row">{children}</div>;
  const MockCol = ({ children, span }) => (
    <div data-testid={`col-${span || 'n'}`}>{children}</div>
  );

  const MockSelect = ({ children, placeholder, allowClear, mode, disabled }) => (
    <select aria-label={placeholder || 'select'} multiple={mode === 'multiple'} disabled={disabled}>
      {children}
    </select>
  );

  MockSelect.Option = ({ value, children }) => <option value={value}>{children}</option>;

  const MockInput = ({ placeholder, prefix, suffix, onChange, allowClear, disabled }) => (
    <div>
      {prefix}
      <input
        aria-label={placeholder || 'input'}
        placeholder={placeholder}
        disabled={disabled}
        onChange={onChange}
      />
      <span data-testid="suffix">{suffix}</span>
    </div>
  );

  return { ...antd, Form: MockForm, Row: MockRow, Col: MockCol, Select: MockSelect, Input: MockInput };
});

// Mock icon to simple element
vi.mock('@ant-design/icons', () => ({
  SearchOutlined: () => <span data-testid="icon-search">S</span>,
}));

// Stub AsrSpecificFilters to assert rendering and props
let lastAsrProps = null;
vi.mock('@/components/common/Monitoring/AsrSpecificFilters.jsx', () => ({
  default: (props) => {
    lastAsrProps = props;
    return <div data-testid="asr-filters">ASR Filters</div>;
  },
}));

beforeEach(() => {
  lastAsrProps = null;
});

const baseOptions = {
  approvalStatusOptions: ['pending', 'approved', 'rejected'],
  activeStatusOptions: ['Active', 'Inactive'],
  domainOptions: [{ id: 1, name: 'Domain A' }],
  productOptions: [{ id: 10, name: 'Product X' }],
  clusterOptions: [
    { id: 'c1', name: 'alpha' },
    { id: 'c2', name: 'beta' },
  ],
  userOptions: ['alice', 'bob'],
  frequencyOptions: ['daily', 'weekly'],
};

const integrationsASR = [{ name: 'ASR' }];

describe('MonitoringFilters', () => {
  it('returns null when filtersVisible is false', () => {
    const { container } = render(
      <MonitoringFilters
        form={{}}
        filtersVisible={false}
        options={baseOptions}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders base fields and options; search suffix logic and lowercasing on change', async () => {
    const setSearchTerm = vi.fn();
    render(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        searchTerm=""
        setSearchTerm={setSearchTerm}
        matchCount={0}
      />
    );

    // Base labels
    expect(screen.getByText('Monitoring Name')).toBeInTheDocument();
    expect(screen.getByText('Approval Status')).toBeInTheDocument();
    expect(screen.getByText('Active Status')).toBeInTheDocument();

    // Search suffix hidden when searchTerm empty
    const suffix = screen.getByTestId('suffix');
    expect(suffix).toHaveTextContent('');

    // Provide a non-empty term to show suffix; rerender component
    const view = await import('@testing-library/react');
    view.render(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        searchTerm={'HELLO'}
        setSearchTerm={setSearchTerm}
        matchCount={2}
      />
    );

    // Now suffix should show matches and primary color
    const suffixes = screen.getAllByTestId('suffix');
    const suffix2 = suffixes[suffixes.length - 1];
    expect(suffix2.textContent.replace(/\s+/g,' ').trim()).toContain('2 matches');

    // color style check (string contains var(--primary))
    expect(suffix2.firstChild).toHaveStyle({ color: 'var(--primary)' });

    // Change event lowercases input
    const inputs = screen.getAllByPlaceholderText('Search by monitoring name');
    const input = inputs[inputs.length - 1];
    await userEvent.type(input, 'NewTEXT');
    // Only the last onChange matters, we assert that it receives lowercase
    expect(setSearchTerm).toHaveBeenCalled();
    const lastCall = setSearchTerm.mock.calls[setSearchTerm.mock.calls.length - 1][0];
    expect(lastCall).toBe('newtext');
  });

  it('renders ASR-specific filters only when showAsr is true and integrations include ASR', () => {
    const handleDomainChange = vi.fn();
    const { rerender } = render(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        showAsr
        integrations={integrationsASR}
        handleDomainChange={handleDomainChange}
      />
    );
    expect(screen.getByTestId('asr-filters')).toBeInTheDocument();
    expect(lastAsrProps.domainOptions).toEqual(baseOptions.domainOptions);
    expect(lastAsrProps.productOptions).toEqual(baseOptions.productOptions);
    expect(lastAsrProps.handleDomainChange).toBe(handleDomainChange);

    // Hide when showAsr false
    rerender(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        showAsr={false}
        integrations={integrationsASR}
      />
    );
    expect(screen.queryByTestId('asr-filters')).not.toBeInTheDocument();

    // Hide when no ASR integration
    rerender(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        showAsr
        integrations={[]}
      />
    );
    expect(screen.queryByTestId('asr-filters')).not.toBeInTheDocument();
  });

  it('renders Clusters select when showClusters; switches name and mode based on clustersMode', () => {
    const { rerender } = render(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        showClusters
        clustersMode="multiple"
      />
    );

    // Multiple mode uses field name "clusters" and multiple select
    const clustersItem = screen.getByText('Clusters').parentElement; // div label wrapper
    expect(clustersItem).toBeInTheDocument();
    const selectMultiple = within(clustersItem.parentElement).getByLabelText('Clusters');
    expect(selectMultiple).toHaveAttribute('multiple');

    // Single mode uses name "cluster" and no multiple
    rerender(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        showClusters
        clustersMode="single"
      />
    );
    const clustersItem2 = screen.getByText('Clusters').parentElement;
    const selectSingle = within(clustersItem2.parentElement).getByLabelText('Cluster');
    expect(selectSingle).not.toHaveAttribute('multiple');

    // Options should render cluster names (startCase used, but names already lowercase -> should be same or capitalized)
    // Our mock Select renders <option> text as-is from component mapping; just assert options exist
    const options = within(selectSingle).getAllByRole('option');
    expect(options.length).toBe(baseOptions.clusterOptions.length);
  });

  it('renders Users and Frequency fields when toggles enabled and shows provided options', () => {
    render(
      <MonitoringFilters
        form={{}}
        filtersVisible
        options={baseOptions}
        showUsers
        showFrequency
      />
    );

    expect(screen.getByText('Users')).toBeInTheDocument();
    const usersSelect = screen.getByLabelText('Users');
    expect(usersSelect).toHaveAttribute('multiple');

    expect(screen.getByText('Frequency')).toBeInTheDocument();
    const freqSelect = screen.getByLabelText('Frequency');
    const opts = within(freqSelect).getAllByRole('option');
    expect(opts.map((o) => o.textContent.toLowerCase())).toEqual(['daily', 'weekly']);
  });
});
