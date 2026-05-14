// lint-staged config. Filters out src/templates/template-files/ before
// invoking prettier/eslint, because lint-staged passes explicit filenames
// to those tools and eslint then walks up to the template's own .eslintrc
// (which references plugins only installed in the *generated* projects).
export default {
  '*.{ts,tsx}': (files) => {
    const real = files.filter((f) => !f.includes('src/templates/template-files/'));
    if (real.length === 0) return [];
    const list = real.map((f) => `"${f}"`).join(' ');
    return [`prettier --write ${list}`, `eslint --fix ${list}`];
  },
};
