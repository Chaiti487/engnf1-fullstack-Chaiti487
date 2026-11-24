const { z } = require("zod");

const utcDateTimeSchema = z.string().datetime({
  offset: false,
});

const MINUTE_MS = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE_MS;

function isHalfHourBoundary(date) {
  return (
    date.getUTCMinutes() % 30 === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

module.exports = {
  utcDateTimeSchema,
  MINUTE_MS,
  DAY_MS,
  isHalfHourBoundary,
};
