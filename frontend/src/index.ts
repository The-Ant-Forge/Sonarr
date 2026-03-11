import './polyfills';
import 'Styles/globals.css';
import './index.css';

const initializeUrl = `${
  window.Sonarr.urlBase
}/initialize.json?t=${Date.now()}`;

try {
  const response = await fetch(initializeUrl);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  window.Sonarr = await response.json();
} catch (error) {
  console.error('[init] Failed to initialize Sonarr', error);

  const container = document.createElement('div');
  container.style.cssText = 'padding: 2rem; font-family: sans-serif; color: #c33;';

  const heading = document.createElement('h1');
  heading.textContent = 'Sonarr failed to initialize';

  const message = document.createElement('p');
  message.textContent =
    'Could not load configuration from the server. Check that the Sonarr backend is running and accessible.';

  const detail = document.createElement('p');
  detail.style.cssText = 'color: #666; font-size: 0.9rem;';
  detail.textContent = String(error);

  container.append(heading, message, detail);
  document.body.append(container);

  throw error;
}

/* eslint-disable no-undef, @typescript-eslint/ban-ts-comment */
// @ts-ignore 2304
__webpack_public_path__ = `${window.Sonarr.urlBase}/`;
/* eslint-enable no-undef, @typescript-eslint/ban-ts-comment */

const error = console.error;

// Monkey patch console.error to filter out some warnings from React
// TODO: Remove this after the great TypeScript migration

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function logError(...parameters: any[]) {
  const filter = parameters.find((parameter) => {
    return (
      typeof parameter === 'string' &&
      (parameter.includes(
        'Support for defaultProps will be removed from function components in a future major release'
      ) ||
        parameter.includes(
          'findDOMNode is deprecated and will be removed in the next major release'
        ))
    );
  });

  if (!filter) {
    error(...parameters);
  }
}

console.error = logError;

const { bootstrap } = await import('./bootstrap');

await bootstrap();
