function escapeSearch(value) {
  return value.replace(/[\\%_]/g, "\\$&");
}

module.exports = {
  escapeSearch,
};
