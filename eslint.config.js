// eslint.config.js
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        languageOptions: {
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/naming-convention': [
                'error',
                {
                    selector: 'class',
                    format: ['PascalCase'],
                },
                {
                    selector: 'method',
                    format: ['camelCase'],
                },
                {
                    selector: 'property',
                    format: ['camelCase'],
                },
                {
                    selector: 'property',
                    modifiers: ['private'],
                    format: ['camelCase'],
                },
                {
                    selector: 'variable',
                    format: ['camelCase', 'UPPER_CASE'],
                },
                {
                    selector: 'variable',
                    modifiers: ['exported'],
                    format: ['PascalCase']
                },

                {
                    selector: 'typeAlias',
                    format: ['snake_case'],
                },
                {
                    selector: 'property',
                    modifiers: ['readonly', 'static'],
                    format: ['UPPER_CASE']
                }


            ],
        },
    }
);