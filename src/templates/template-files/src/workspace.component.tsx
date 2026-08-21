import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ButtonSet } from '@carbon/react';
import { Workspace2, type Workspace2DefinitionProps } from '@openmrs/esm-framework';
import styles from './{{currentWorkspace.fileBaseName}}.scss';

const {{pascalCase currentWorkspace.componentName}}: React.FC<Workspace2DefinitionProps> = ({ closeWorkspace }) => {
  const { t } = useTranslation();

  return (
    <Workspace2 title={t('{{camelCase currentWorkspace.componentName}}Title', {{{json currentWorkspace.title}}})}>
      <div className={styles.container}>
        <div className={styles.content}>
          <p className={styles.description}>
            {t('{{camelCase currentWorkspace.componentName}}Description', 'This is the {{currentWorkspace.name}} workspace.')}
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
    </Workspace2>
  );
};

export default {{pascalCase currentWorkspace.componentName}};
