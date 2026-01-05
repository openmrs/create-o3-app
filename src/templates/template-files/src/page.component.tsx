import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layer, Tile } from '@carbon/react';
import styles from './{{kebabCase currentRoute.componentName}}.scss';

const {{pascalCase currentRoute.componentName}}: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <Layer>
        <Tile className={styles.tile}>
          <h1 className={styles.heading}>
            {t('{{kebabCase currentRoute.componentName}}Heading', '{{currentRoute.componentName}}')}
          </h1>
          <p className={styles.content}>
            {t('{{kebabCase currentRoute.componentName}}Description', 'Welcome to the {{currentRoute.componentName}} page.')}
          </p>
        </Tile>
      </Layer>
    </div>
  );
};

export default {{pascalCase currentRoute.componentName}};