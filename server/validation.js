// Shared length checks for write endpoints.
// Limits mirror the VARCHAR sizes in schema_additions.sql / SETUP.md. Without these,
// MariaDB (non-strict mode, the XAMPP default) silently truncates over-long values,
// so the API would answer 201 for a row it stored under a different id.

const MEMBER_LIMITS = { id: 10, name: 100, initials: 5, group_id: 10 };
const TASK_LIMITS = { id: 10, title: 150 };

// MySQL counts characters, not UTF-16 code units, so spread the string first.
const charLength = (s) => [...s].length;

// Returns an error message for the first string field longer than its limit, or null.
// Fields that are missing or not strings are skipped (other checks handle those).
function checkMaxLengths(fields, limits) {
  for (const [name, max] of Object.entries(limits)) {
    const value = fields[name];
    if (typeof value === 'string' && charLength(value) > max) {
      return `${name} must be at most ${max} characters`;
    }
  }
  return null;
}

module.exports = { checkMaxLengths, MEMBER_LIMITS, TASK_LIMITS };
