/* eslint no-empty-function: 0, no-extend-native: 0 */

window.console = window.console || {};
window.console.log = window.console.log || function () {};
window.console.group = window.console.group || function () {};
window.console.groupEnd = window.console.groupEnd || function () {};
window.console.debug = window.console.debug || function () {};
window.console.warn = window.console.warn || function () {};
window.console.assert = window.console.assert || function () {};

// For Firefox ESR 115 support
if (!Object.groupBy) {
  import('core-js/actual/object/group-by');
}
