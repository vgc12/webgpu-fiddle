import * as monaco from 'monaco-editor';

export function registerWGSL() {
    // Registration is idempotent; calling multiple times has no adverse effect.
    if (monaco.languages.getLanguages().some(lang => lang.id === 'wgsl')) {
        return;
    }


    monaco.languages.register({id: 'wgsl'});


    monaco.languages.setMonarchTokensProvider('wgsl', {
        keywords: [
            'fn', 'var', 'let', 'const', 'struct', 'if', 'else', 'for', 'while', 'return',
            'break', 'continue', 'switch', 'case', 'default', 'loop', 'continuing',
        ],
        typeKeywords: [
            'f32', 'i32', 'u32', 'bool', 'vec2', 'vec3', 'vec4', 'mat2x2', 'mat3x3', 'mat4x4',
            'array', 'texture_2d', 'sampler',
        ],
        attributes: [
            '@vertex', '@fragment', '@compute', '@group', '@binding', '@location',
            '@builtin', '@workgroup_size', '@stage',
        ],
        operators: [
            '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
            '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
            '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
            '%=', '<<=', '>>=', '>>>=',
        ],

        tokenizer: {
            root: [
                [/@[a-z_]\w*/, 'annotation'],
                [/[a-z_]\w*/, {
                    cases: {
                        '@keywords': 'keyword',
                        '@typeKeywords': 'type',
                        '@default': 'identifier'
                    }
                }],
                [/[A-Z][\w]*/, 'type.identifier'],
                {include: '@whitespace'},
                [/[{}()\[\]]/, '@brackets'],
                [/[<>](?!@symbols)/, '@brackets'],
                [/@symbols/, {
                    cases: {
                        '@operators': 'operator',
                        '@default': ''
                    }
                }],
                [/\d*\.\d+([eE][\-+]?\d+)?[fF]?/, 'number.float'],
                [/0[xX][0-9a-fA-F]+[uU]?/, 'number.hex'],
                [/\d+[uU]?/, 'number'],
                [/"([^"\\]|\\.)*$/, 'string.invalid'],
                [/"/, 'string', '@string'],
            ],

            whitespace: [
                [/[ \t\r\n]+/, ''],
                [/\/\*/, 'comment', '@comment'],
                [/\/\/.*$/, 'comment'],
            ],

            comment: [
                [/[^/*]+/, 'comment'],
                [/\*\//, 'comment', '@pop'],
                [/[/*]/, 'comment']
            ],

            string: [
                [/[^\\"]+/, 'string'],
                [/"/, 'string', '@pop']
            ],
        },
    });

// Set language configuration (auto-closing brackets, etc.)
    monaco.languages.setLanguageConfiguration('wgsl', {
        comments: {
            lineComment: '//',
            blockComment: ['/*', '*/']
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')']
        ],
        autoClosingPairs: [
            {open: '{', close: '}'},
            {open: '[', close: ']'},
            {open: '(', close: ')'},
            {open: '"', close: '"'},
        ],
    });

}