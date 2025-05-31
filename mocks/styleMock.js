// Style Mock for Jest
// CSS、SCSS、SASS ファイルをモックします

module.exports = {}

// CSS Modules の場合
// module.exports = new Proxy({}, {
//   get: function getter(target, key) {
//     if (key === '__esModule') {
//       return false
//     }
//     return key
//   },
// })