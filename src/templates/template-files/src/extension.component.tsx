import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@carbon/react';
import styles from './{{kebabCase currentExtension.componentName}}.scss';

const {{pascalCase currentExtension.componentName}}: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {t('{{kebabCase currentExtension.componentName}}Title', '{{currentExtension.componentName}}')}
      </h3>
      <p className={styles.description}>
        {t('{{kebabCase currentExtension.componentName}}Description', 'This is the {{currentExtension.componentName}} extension.')}
      </p>
      <Button size="sm" kind="tertiary">
        {t('viewMore', 'View More')}
      </Button>
    </div>
  );
};

export default {{pascalCase currentExtension.componentName}};