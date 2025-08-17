import React from 'react';
import { useTranslation } from 'react-i18next';

const ErrorMessage = ({ error }: {error: {endpoint: string, message: string}}) => {
  const { t } = useTranslation();
  return (
    <div className="error-message">
        <strong>{t('apiErrorOn', { endpoint: error.endpoint })}</strong> {error.message}
    </div>
  );
}

export default ErrorMessage;
