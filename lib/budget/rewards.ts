/**
 * Small-win milestones. We only ever ADD wins — there is no streak to break and
 * nothing is ever taken away (shame-free, per the product principles).
 */
export type RewardStats = {
  accounts: number;
  transactions: number;
  incomes: number;
  bills: number;
  paidBills: number;
  daysTracked: number;
};

export type Milestone = { kind: string; title: string; emoji: string; met: boolean };

export function computeMilestones(s: RewardStats): Milestone[] {
  const defs: { kind: string; title: string; emoji: string; met: boolean }[] = [
    { kind: "connected_bank", title: "Connected an account", emoji: "🔗", met: s.accounts >= 1 },
    { kind: "first_transaction", title: "Started tracking spending", emoji: "👀", met: s.transactions >= 1 },
    { kind: "income_added", title: "Added an income source", emoji: "💵", met: s.incomes >= 1 },
    { kind: "first_bill", title: "Set up a bill", emoji: "🔔", met: s.bills >= 1 },
    { kind: "first_bill_paid", title: "Paid a bill on time", emoji: "✅", met: s.paidBills >= 1 },
    { kind: "week_tracked", title: "A week of staying aware", emoji: "📅", met: s.daysTracked >= 7 },
  ];
  return defs;
}
