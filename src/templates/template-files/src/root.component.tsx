import React from 'react';
{{#if routes}}
import { BrowserRouter, Routes, Route } from 'react-router-dom';
{{#each routes}}
import {{pascalCase this.componentName}} from './{{kebabCase this.componentName}}.component';
{{/each}}
{{else}}
import { useTranslation } from 'react-i18next';
import styles from './root.scss';
{{/if}}

{{#if routes}}
const Root: React.FC = () => (
  <BrowserRouter basename={window.getOpenmrsSpaBase()}>
    <Routes>
{{#each routes}}
      <Route path="{{#if (startsWith this.path '/')}}{{substring this.path 1}}{{else}}{{this.path}}{{/if}}" element={<{{pascalCase this.componentName}} />} />
{{/each}}
    </Routes>
  </BrowserRouter>
);
{{else}}
const Root: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <h1>{t('welcomeToModule', 'Welcome to {{projectName}}!', { projectName: '{{projectName}}' })}</h1>
      <p>{t('getStarted', 'Get started by adding routes, extensions, or components.')}</p>
    </div>
  );
};
{{/if}}

export default Root;
