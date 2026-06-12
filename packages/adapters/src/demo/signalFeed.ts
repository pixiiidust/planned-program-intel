import type { DetectionThresholds, Signal, SignalFeed } from '@ppi/domain';
import { DEFAULT_DETECTION_THRESHOLDS } from '@ppi/domain';

export const SCRIPTED_PACE_SIGNAL: Signal = {
  id: 'sig-sko-pace-1',
  type: 'registration.pace_updated',
  event: {
    id: 'sko',
    name: 'Global Sales Kickoff 2027',
    location: 'Lisbon',
    date: 'Jan 12–15, 2027',
    budget: '$1.4M',
    attendees: 850,
  },
  payload: { registered: 480, target: 650, daysOut: 147 },
};

export const DEMO_PROGRAM_THRESHOLDS: DetectionThresholds = {
  ...DEFAULT_DETECTION_THRESHOLDS,
  'registration.pace_updated': { ...DEFAULT_DETECTION_THRESHOLDS['registration.pace_updated'], maxDaysOut: 180 },
};

export class ScriptedSignalFeed implements SignalFeed {
  private delivered = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly options: { delayMs: number; signal?: Signal }) {}

  subscribe(onSignal: (signal: Signal) => void): () => void {
    if (this.delivered || this.timer) return () => {};

    let active = true;
    this.timer = setTimeout(() => {
      this.timer = null;
      if (!active || this.delivered) return;
      this.delivered = true;
      onSignal(this.options.signal ?? SCRIPTED_PACE_SIGNAL);
    }, this.options.delayMs);

    return () => {
      active = false;
      if (!this.timer) return;
      clearTimeout(this.timer);
      this.timer = null;
    };
  }
}
