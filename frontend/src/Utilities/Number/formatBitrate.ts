const BIT_UNITS = ['bps', 'Kbps', 'Mbps', 'Gbps', 'Tbps'];

function formatBitrate(input: string | number) {
  const size = Number(input);

  if (isNaN(size)) {
    return '';
  }

  if (size === 0) {
    return '0 bps';
  }

  // Convert bytes to bits, then use base-10 (SI) units
  const bits = (size / 8) * 8;
  const exponent = Math.min(
    Math.floor(Math.log(Math.abs(bits)) / Math.log(1000)),
    BIT_UNITS.length - 1
  );
  const value = bits / Math.pow(1000, exponent);

  return `${value.toFixed(1)} ${BIT_UNITS[exponent]}/s`;
}

export default formatBitrate;
