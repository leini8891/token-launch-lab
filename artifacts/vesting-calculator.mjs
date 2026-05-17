export function vestedAmount({ allocation, cliffMonths, vestingMonths, month }) {
  if (!Number.isFinite(allocation) || allocation < 0) {
    throw new Error("allocation must be a non-negative number");
  }
  if (!Number.isInteger(cliffMonths) || cliffMonths < 0) {
    throw new Error("cliffMonths must be a non-negative integer");
  }
  if (!Number.isInteger(vestingMonths) || vestingMonths <= 0) {
    throw new Error("vestingMonths must be a positive integer");
  }
  if (!Number.isInteger(month) || month < 0) {
    throw new Error("month must be a non-negative integer");
  }

  if (month < cliffMonths) return 0;
  if (month >= cliffMonths + vestingMonths) return allocation;

  const activeMonths = month - cliffMonths;
  return Math.floor((allocation * activeMonths) / vestingMonths);
}

export function buildSchedule({ allocation, cliffMonths, vestingMonths, intervalMonths = 6 }) {
  const end = cliffMonths + vestingMonths;
  const months = new Set([0, cliffMonths, end]);

  for (let month = cliffMonths + intervalMonths; month < end; month += intervalMonths) {
    months.add(month);
  }

  return [...months]
    .sort((a, b) => a - b)
    .map((month) => {
      const vested = vestedAmount({ allocation, cliffMonths, vestingMonths, month });
      return {
        month,
        vested,
        percentVested: allocation === 0 ? 100 : Math.round((vested / allocation) * 100),
      };
    });
}

export function describeSchedule(params) {
  return buildSchedule(params)
    .map((row) => `Month ${row.month}: ${row.vested} tokens vested (${row.percentVested}%)`)
    .join("\n");
}
