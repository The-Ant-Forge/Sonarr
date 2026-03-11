import React from 'react';
import translate from 'Utilities/String/translate';
import styles from './ErrorBoundaryError.css';

export interface ErrorBoundaryErrorProps {
  className: string;
  messageClassName: string;
  detailsClassName: string;
  message: string;
  error: Error;
  info: {
    componentStack: string;
  };
}

function ErrorBoundaryError(props: ErrorBoundaryErrorProps) {
  const {
    className = styles.container,
    messageClassName = styles.message,
    detailsClassName = styles.details,
    message = translate('ErrorLoadingContent'),
    error,
    info,
  } = props;

  return (
    <div className={className}>
      <div className={messageClassName}>{message}</div>

      <div className={styles.imageContainer}>
        <img
          className={styles.image}
          src={`${window.Sonarr.urlBase}/Content/Images/error.png`}
        />
      </div>

      <details className={detailsClassName}>
        {error ? <div>{error.message}</div> : null}

        {error?.stack ? (
          <pre className={styles.stackTrace}>{error.stack}</pre>
        ) : (
          <div>{info.componentStack}</div>
        )}

        <div className={styles.version}>Version: {window.Sonarr.version}</div>
      </details>
    </div>
  );
}

export default ErrorBoundaryError;
