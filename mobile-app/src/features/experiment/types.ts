export type Experiment = {
  experimentId: string;
  name: string;
  description: string;
  status: 'RUNNING' | 'PAUSED' | 'STOPPED';
  variants: string[];
  trafficAllocation: Record<string, number>;
  config: Record<string, Record<string, unknown>>;
  startDate: string;
  endDate: string;
};

export type ExperimentAssignment = {
  experimentId: string;
  variant: string;
  config: Record<string, unknown>;
  assignedAt: number;
};
