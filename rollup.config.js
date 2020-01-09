import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
    input: 'src/main.js',
    output: [
        {
            file: 'dist/timus-parser.js',
            format: 'umd',
            name: 'timus.parser'
        },
        {
            file: 'dist/timus-parser.mjs',
            format: 'es'
        }
    ],
    plugins: [
        nodeResolve({
            browser: true
        }),
        commonjs({
            include: ['node_modules/**'],
            sourceMap: false
        })
    ]
}