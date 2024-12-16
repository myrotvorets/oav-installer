import MyrotvoretsConfig from '@myrotvorets/eslint-config-myrotvorets-ts';
import globals from 'globals';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['dist/**'],
    },
    ...MyrotvoretsConfig,
    {
        files: ['*.mjs'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 2022,
            globals: {
                ...globals.nodeBuiltin,
            },
        },
    },
];
