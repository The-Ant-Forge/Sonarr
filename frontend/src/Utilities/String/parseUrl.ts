// See: https://developer.mozilla.org/en-US/docs/Web/API/HTMLHyperlinkElementUtils
const anchor = document.createElement('a');

export default function parseUrl(url: string) {
  anchor.href = url;

  const properties: Record<string, string | number | boolean | object> = {
    hash: anchor.hash,
    host: anchor.host,
    hostname: anchor.hostname,
    href: anchor.href,
    origin: anchor.origin,
    pathname: anchor.pathname,
    port: anchor.port,
    protocol: anchor.protocol,
    search: anchor.search,
  };

  properties.isAbsolute = /^[\w:]*\/\//.test(url);

  if (anchor.search) {
    properties.params = Object.fromEntries(new URLSearchParams(anchor.search));
  } else {
    properties.params = {};
  }

  return properties;
}
