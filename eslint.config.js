// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
    settings: {
      // @expo/vector-icons exposes its package root through a generated main
      // entry that eslint-plugin-import does not resolve under Expo 57.
      "import/core-modules": ["@expo/vector-icons"],
    },
  },
  {
    files: [
      "src/components/home/HomeView.tsx",
      "src/components/quran/MushafPage.tsx",
      "src/components/quran/MushafReader.tsx",
      "src/components/quran/MushafScreenLayout.tsx",
      "src/components/quran/PlayerSheet.tsx",
      "src/components/search/SearchScreen.tsx",
      "src/hooks/useJuzList.ts",
      "src/hooks/useMushafPage.ts",
      "src/hooks/useSurahList.ts",
    ],
    rules: {
      // These effects intentionally initialize or refresh async-backed view
      // state. Refactoring them is separate from the Expo SDK migration.
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
