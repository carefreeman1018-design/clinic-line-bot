import fs from "node:fs/promises";

const REQUIRED_DAYS = ["週一", "週二", "週三", "週四", "週五", "週六"];
const REQUIRED_PERIODS = ["早診", "午診", "晚診"];
const SPECIAL_VALUES = new Set(["手術", "休診"]);
const DOCTOR_NAME_PATTERN = /^[\u4e00-\u9fff]{2,4}醫師(?:（[^）]+）)?$/;

async function main() {
  const issues = [];
  const raw = await fs.readFile("data/fixed-schedule.json", "utf8");
  const config = JSON.parse(raw);

  if (!config.updatedAt) issues.push("fixed-schedule.json missing updatedAt");
  if (!config.source) issues.push("fixed-schedule.json missing source");
  if (!config.temporaryChangeConfirmation) {
    issues.push("fixed-schedule.json missing temporaryChangeConfirmation");
  }

  validatePeriodTimes(config.periodTimes, issues);
  validateSchedule(config.schedule, issues);

  console.log(
    JSON.stringify(
      {
        ok: issues.length === 0,
        days: Object.keys(config.schedule ?? {}).length,
        periods: Object.keys(config.periodTimes ?? {}).length,
        issues
      },
      null,
      2
    )
  );

  if (issues.length > 0) process.exitCode = 1;
}

function validatePeriodTimes(periodTimes, issues) {
  if (!periodTimes || typeof periodTimes !== "object") {
    issues.push("periodTimes must be an object");
    return;
  }

  for (const period of REQUIRED_PERIODS) {
    const value = periodTimes[period];
    if (!value) {
      issues.push(`periodTimes missing ${period}`);
      continue;
    }

    if (!/^\d{2}:\d{2}-\d{2}:\d{2}$/.test(value)) {
      issues.push(`periodTimes.${period} must use HH:mm-HH:mm format`);
    }
  }
}

function validateSchedule(schedule, issues) {
  if (!schedule || typeof schedule !== "object") {
    issues.push("schedule must be an object");
    return;
  }

  for (const day of REQUIRED_DAYS) {
    const daySchedule = schedule[day];
    if (!daySchedule || typeof daySchedule !== "object") {
      issues.push(`schedule missing ${day}`);
      continue;
    }

    for (const period of REQUIRED_PERIODS) {
      const value = daySchedule[period];
      if (!value) {
        issues.push(`schedule.${day} missing ${period}`);
        continue;
      }

      if (!SPECIAL_VALUES.has(value) && !DOCTOR_NAME_PATTERN.test(value)) {
        issues.push(`schedule.${day}.${period} has invalid value: ${value}`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
