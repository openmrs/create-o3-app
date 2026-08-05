import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonSet } from '@carbon/react';
import { type DefaultWorkspaceProps } from '@openmrs/esm-framework';
import styles from './{{currentWorkspace.fileBaseName}}.scss';

const {{pascalCase currentWorkspace.componentName}}: React.FC<DefaultWorkspaceProps> = ({ closeWorkspace }) => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <p className={styles.description}>
          {t('{{kebabCase currentWorkspace.componentName}}Description', 'This is the {{currentWorkspace.name}} workspace.')}
        </p>
      </div>
      <ButtonSet className={styles.buttonSet}>
        <Button className={styles.button} kind="secondary" onClick={() => closeWorkspace()}>
          {t('discard', 'Discard')}
        </Button>
        <Button className={styles.button} kind="primary" onClick={() => closeWorkspace()}>
          {t('save', 'Save')}
        </Button>
      </ButtonSet>
    </div>
  );
};

export default {{pascalCase currentWorkspace.componentName}};
