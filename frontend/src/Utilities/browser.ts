const ua = window.navigator.userAgent;

export function isMobile() {
  return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    ua
  );
}

export function isIOS() {
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function isFirefox() {
  return ua.toLowerCase().indexOf('firefox/') >= 0;
}
