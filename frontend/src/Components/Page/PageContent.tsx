import React, { useEffect } from 'react';
import ErrorBoundary from 'Components/Error/ErrorBoundary';
import PageContentError from './PageContentError';
import styles from './PageContent.css';

interface PageContentProps {
  className?: string;
  title?: string;
  children: React.ReactNode;
}

function PageContent({
  className = styles.content,
  title,
  children,
}: PageContentProps) {
  useEffect(() => {
    document.title = title
      ? `${title} - ${window.Sonarr.instanceName}`
      : window.Sonarr.instanceName;
  }, [title]);

  return (
    <ErrorBoundary errorComponent={PageContentError}>
      <div className={className}>{children}</div>
    </ErrorBoundary>
  );
}

export default PageContent;
