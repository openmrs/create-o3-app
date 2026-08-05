import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import styles from './{{currentModal.fileBaseName}}.scss';

interface {{pascalCase currentModal.componentName}}Props {
  close: () => void;
}

const {{pascalCase currentModal.componentName}}: React.FC<{{pascalCase currentModal.componentName}}Props> = ({ close }) => {
  const { t } = useTranslation();

  return (
    <>
      <ModalHeader
        closeModal={close}
        title={t('{{camelCase currentModal.componentName}}Title', '{{pascalCase currentModal.componentName}}')}
      />
      <ModalBody>
        <p className={styles.body}>
          {t('{{camelCase currentModal.componentName}}Body', 'This is the {{currentModal.name}} modal.')}
        </p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={close}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button kind="primary" onClick={close}>
          {t('confirm', 'Confirm')}
        </Button>
      </ModalFooter>
    </>
  );
};

export default {{pascalCase currentModal.componentName}};
