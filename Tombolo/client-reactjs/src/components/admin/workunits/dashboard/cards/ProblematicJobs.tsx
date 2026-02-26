import React from 'react';
import { Card, Tag, Badge, Empty } from 'antd';
import { WarningOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

export type JobSeverity = 'critical' | 'warning' | 'info';

export interface ProblematicJob {
  wuid: string;
  jobName: string;
  severity: JobSeverity;
  issue: string;
  cost: number;
  owner: string;
  cluster?: string;
}

interface ProblematicJobsProps {
  jobs: ProblematicJob[];
}

interface SeverityConfig {
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  tag: string;
}

const severityConfig: Record<JobSeverity, SeverityConfig> = {
  critical: {
    color: '#dc2626',
    bg: '#fef2f2',
    border: '#fecaca',
    icon: <CloseCircleOutlined />,
    tag: 'red',
  },
  warning: {
    color: '#d97706',
    bg: '#fffbeb',
    border: '#fde68a',
    icon: <WarningOutlined />,
    tag: 'orange',
  },
  info: {
    color: '#2563eb',
    bg: '#eff6ff',
    border: '#bfdbfe',
    icon: <InfoCircleOutlined />,
    tag: 'blue',
  },
};

export default function ProblematicJobs({ jobs }: ProblematicJobsProps) {
  const criticalCount = jobs.filter(j => j.severity === 'critical').length;
  const warningCount = jobs.filter(j => j.severity === 'warning').length;

  return (
    <Card
      title={
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <span style={{ color: '#111827', fontWeight: 600, fontSize: 15 }}>Problematic Jobs</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {criticalCount > 0 && (
              <Badge
                count={criticalCount}
                style={{
                  backgroundColor: '#dc2626',
                  fontSize: 11,
                  boxShadow: 'none',
                }}
              />
            )}
            {warningCount > 0 && (
              <Badge
                count={warningCount}
                style={{
                  backgroundColor: '#d97706',
                  color: '#ffffff',
                  fontSize: 11,
                  boxShadow: 'none',
                }}
              />
            )}
          </div>
        </div>
      }
      style={{
        background: '#ffffff',
        borderColor: '#e5e7eb',
        borderRadius: 8,
      }}
      styles={{
        body: {
          padding: '8px 16px',
          maxHeight: 360,
          overflow: 'auto',
        },
      }}>
      {jobs.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={<span style={{ color: '#9ca3af' }}>No issues detected</span>}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {jobs.map(job => {
            const cfg = severityConfig[job.severity];
            return (
              <div
                key={job.wuid}
                style={{
                  background: cfg.bg,
                  border: `1px solid ${cfg.border}`,
                  borderRadius: 6,
                  padding: '10px 12px',
                }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 4,
                  }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      overflow: 'hidden',
                    }}>
                    <span style={{ color: cfg.color, fontSize: 14 }}>{cfg.icon}</span>
                    <span
                      style={{
                        color: '#374151',
                        fontSize: 13,
                        fontWeight: 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: 180,
                      }}>
                      {job.jobName}
                    </span>
                  </div>
                  <Tag
                    color={cfg.tag}
                    style={{
                      fontSize: 10,
                      lineHeight: '16px',
                      padding: '0 6px',
                      margin: 0,
                      borderRadius: 4,
                    }}>
                    {job.severity}
                  </Tag>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}>
                  <span style={{ color: '#6b7280', fontSize: 11 }}>{job.issue}</span>
                  <span
                    style={{
                      color: '#111827',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono), monospace',
                    }}>
                    ${job.cost.toFixed(2)}
                  </span>
                </div>
                <div style={{ marginTop: 2 }}>
                  <span style={{ color: '#9ca3af', fontSize: 10 }}>
                    {job.wuid} &middot; {job.owner}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
