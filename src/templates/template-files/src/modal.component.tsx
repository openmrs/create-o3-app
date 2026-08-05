import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import styles from './{{kebabCase currentModal.componentName}}.scss';

interface {{pascalCase currentModal.componentName}}Props {
  closeModal: () => void;
}

const {{pascalCase currentModal.componentName}}: React.FC<{{pascalCase currentModal.componentName}}Props> = ({ closeModal }) => {
  const { t } = useTranslation();

  return (
    <>
      <ModalHeader
        closeModal={closeModal}
        title={t('{{kebabCase currentModal.componentName}}Title', '{{pascalCase currentModal.componentName}}')}
      />
      <ModalBody>
        <p className={styles.body}>
          {t('{{kebabCase currentModal.componentName}}Body', 'This is the {{currentModal.name}} modal.')}
        </p>
      </ModalBody>
      <ModalFooter>
        <Button kind="secondary" onClick={closeModal}>
          {t('cancel', 'Cancel')}
        </Button>
        <Button kind="primary" onClick={closeModal}>
          {t('confirm', 'Confirm')}
        </Button>
      </ModalFooter>
    </>
  );
};

export default {{pascalCase currentModal.componentName}};
