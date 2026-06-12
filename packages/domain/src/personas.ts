import type { Decision } from './types.js';
import { tabOf, type QueueTab } from './queue.js';

/** Demo seats are derived from Decisions, not accounts. */
export interface Persona {
  name: string;
  role: string;
  group: 'decider' | 'escalation-path';
}

function ownerKey(decision: Decision): string {
  return `${decision.owner.name}\u0000${decision.owner.role}`;
}

export function personasFrom(decisions: Decision[], seniorRoles: readonly string[]): Persona[] {
  const deciders: Persona[] = [];
  const ownerKeys = new Set<string>();
  const ownerNames = new Set<string>();

  for (const decision of decisions) {
    const key = ownerKey(decision);
    if (ownerKeys.has(key)) continue;
    ownerKeys.add(key);
    ownerNames.add(decision.owner.name);
    deciders.push({ name: decision.owner.name, role: decision.owner.role, group: 'decider' });
  }

  const escalationPaths: Persona[] = [];
  const escalationPathNames = new Set<string>();
  for (const role of seniorRoles) {
    for (const decision of decisions) {
      for (const path of decision.escalationPaths) {
        if (path.role !== role || ownerNames.has(path.name) || escalationPathNames.has(path.name)) continue;
        escalationPathNames.add(path.name);
        escalationPaths.push({ name: path.name, role: path.role, group: 'escalation-path' });
      }
    }
  }

  return [...deciders, ...escalationPaths];
}

export function personaQueue(persona: Persona | null, tab: QueueTab, decisions: Decision[]): Decision[] {
  if (!persona) return decisions.filter((d) => tabOf(d) === tab);

  if (persona.group === 'decider') {
    return decisions.filter((d) => d.owner.name === persona.name && tabOf(d) === tab);
  }

  if (tab !== 'needs-you') return [];
  return decisions.filter((d) => d.status === 'escalated' && d.escalation?.to === persona.name);
}

export function needsYouCount(persona: Persona, decisions: Decision[]): number {
  return personaQueue(persona, 'needs-you', decisions).length;
}
