module.exports = {
    arrowParens: 'always',
    printWidth: 100,
    quoteProps: 'consistent',
    singleQuote: true,
    endOfLine: 'lf',
    tabWidth: 4,
    trailingComma: 'all',
    bracketSpacing: true,
    vueIndentScriptAndStyle: true,
    bracketSameLine: true,
    singleAttributePerLine: false,

    overrides: [
        {
            files: '*.{yaml,yml}',
            options: {
                tabWidth: 2,
            },
        },
        {
            files: '*.json',
            options: {
                tabWidth: 2,
            },
        },
    ],
};
