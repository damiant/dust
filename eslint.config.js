import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import angularEslint from "@angular-eslint/eslint-plugin";
import angularTemplateEslint from "@angular-eslint/eslint-plugin-template";
import angularTemplateParser from "@angular-eslint/template-parser";
import unusedImports from "eslint-plugin-unused-imports";

// Build recommended rules from angular-eslint (those with meta.docs.recommended)
// "recommended" means "error" in flat config.
const recommendedToSeverity = (val) => (val === "recommended" ? "error" : val);

const angularRecommendedRules = {};
for (const [name, rule] of Object.entries(angularEslint.rules)) {
  if (rule.meta?.docs?.recommended) {
    angularRecommendedRules[`@angular-eslint/${name}`] = recommendedToSeverity(rule.meta.docs.recommended);
  }
}

const angularTemplateRecommendedRules = {};
for (const [name, rule] of Object.entries(angularTemplateEslint.rules)) {
  if (rule.meta?.docs?.recommended) {
    angularTemplateRecommendedRules[`@angular-eslint/template/${name}`] = recommendedToSeverity(rule.meta.docs.recommended);
  }
}

export default [
  {
    ignores: ["projects/**/*", "dist/**/*", "www/**/*", "node_modules/**/*", ".angular/**/*"],
  },
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ["tsconfig.app.json", "tsconfig.spec.json"],
      },
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "unused-imports": unusedImports,
      "@angular-eslint": angularEslint,
    },
    rules: {
      ...tseslint.configs["recommended"].rules,
      ...angularRecommendedRules,
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "@angular-eslint/component-class-suffix": [
        "error",
        {
          suffixes: ["Page", "Component"],
        },
      ],
      "@angular-eslint/component-selector": [
        "error",
        {
          type: "element",
          prefix: "app",
          style: "kebab-case",
        },
      ],
      "@angular-eslint/directive-selector": [
        "error",
        {
          type: "attribute",
          prefix: "app",
          style: "camelCase",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  {
    files: ["**/*.html"],
    languageOptions: {
      parser: angularTemplateParser,
    },
    plugins: {
      "@angular-eslint/template": angularTemplateEslint,
    },
    rules: {
      ...angularTemplateRecommendedRules,
    },
  },
];