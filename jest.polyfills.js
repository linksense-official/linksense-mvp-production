// Jest Polyfills - 最小限版
const { TextEncoder, TextDecoder } = require('util')

global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

console.log('✅ Jest polyfills loaded successfully')