import type { AiJsonRequest, AiPort } from '@ppi/domain';

interface PatternNarrateInput {
  approachId: string;
  decisionType: string;
  clusterOutcome: 'worked' | 'failed';
}

interface ExceptionNarrateInput {
  label: string;
  direction?: 'underperforms' | 'outperforms';
  metric?: { label: string; unit: string; direction: 'higher' | 'lower' };
}

interface TrackBasisInput {
  decisionType: string;
}

export function createCannedAi(): AiPort {
  return {
    async generateJson(request) {
      return cannedJsonForRequest(request);
    },
  };
}

export function cannedJsonForRequest(request: Pick<AiJsonRequest, 'task' | 'input'>): unknown {
  switch (request.task) {
    case 'pattern.narrate': {
      const input = request.input as Partial<PatternNarrateInput>;
      const humanized = humanizeApproachId(String(input.approachId ?? 'approach'));
      const decisionType = String(input.decisionType ?? 'decision');
      const takeaway =
        input.clusterOutcome === 'worked'
          ? `In similar ${decisionType} decisions, "${humanized}" is the play that has repeatedly worked.`
          : `In similar ${decisionType} decisions, "${humanized}" is the play that has repeatedly failed.`;
      return { title: humanized, takeaway };
    }
    case 'exception.narrate': {
      const input = request.input as Partial<ExceptionNarrateInput>;
      const label = numberlessText(String(input.label ?? 'This subgroup'));
      if (input.metric) {
        const direction = input.metric.direction === 'higher' ? 'longer' : 'shorter';
        return {
          whyItMattersNow: `${label} have run notably ${direction} on ${input.metric.label} than the rest of the similar set — check whether it applies to this decision.`,
        };
      }
      const direction = input.direction === 'underperforms' ? 'worked notably less often' : 'worked notably more often';
      return { whyItMattersNow: `${label} have ${direction} than the rest of the similar set — check whether it applies to this decision.` };
    }
    case 'track.basis': {
      const input = request.input as Partial<TrackBasisInput>;
      return { basis: `similar ${String(input.decisionType ?? 'decision')} decisions drawn from past event programs` };
    }
    default:
      throw new Error(`Canned AI has no template for task "${request.task}"`);
  }
}

export function humanizeApproachId(approachId: string): string {
  const words = approachId
    .split('-')
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);
  if (words.length === 0) return 'Approach';
  const [first, ...rest] = words;
  return [capitalize(first!), ...rest].join(' ');
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0]!.toUpperCase() + value.slice(1);
}

function numberlessText(value: string): string {
  return value.replace(/\d+/g, (digits) => integerWords(Number(digits)));
}

function integerWords(value: number): string {
  const small = [
    'zero',
    'one',
    'two',
    'three',
    'four',
    'five',
    'six',
    'seven',
    'eight',
    'nine',
    'ten',
    'eleven',
    'twelve',
    'thirteen',
    'fourteen',
    'fifteen',
    'sixteen',
    'seventeen',
    'eighteen',
    'nineteen',
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  if (Number.isNaN(value)) return '';
  if (value < small.length) return small[value]!;
  if (value < 100) {
    const ten = Math.floor(value / 10);
    const one = value % 10;
    return one === 0 ? tens[ten]! : `${tens[ten]} ${small[one]}`;
  }
  return String(value)
    .split('')
    .map((digit) => small[Number(digit)]!)
    .join(' ');
}
