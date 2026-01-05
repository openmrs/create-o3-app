module.exports = {
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
    i18n: {
      changeLanguage: () => new Promise(() => {}),
    },
  }),
  Trans: ({ children }) => children,
};

