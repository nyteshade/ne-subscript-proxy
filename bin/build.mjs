const { readFile, writeFile } = await import('fs/promises')

try {
  const packageName = 'SubscriptProxy'
  const filename = 'subscriptproxy'

  const sourceCode = await readFile(`./src/${filename}.js`)
  const bufferToString = buffer => buffer.toString()

  const files = {
    commonjs: [
      sourceCode,
      commonjs(packageName),
    ].map(bufferToString).join('\n'),

    modulejs: [
      sourceCode,
      modulejs(packageName),
    ].map(bufferToString).join('\n'),

    iifejs: [
      iifejs(packageName, sourceCode),
    ].map(bufferToString).join('\n'),
  }

  await writeFile(`./dist/${filename}.js`, files.commonjs)
  await writeFile(`./dist/${filename}.mjs`, files.modulejs)
  await writeFile(`./dist/${filename}.browser.js`, files.iifejs)
}
catch (error) {
  console.error(error)
}

function commonjs(packageName) {
  return [
    'module.exports = {',
    `  default: ${packageName},`,
    `  ${packageName}`,
    `}`
  ].join('\n')
}

function iifejs(packageName, sourceCode) {
  return [
    '(function () {',
      '',
      `${sourceCode}`,
      '',
      'var target = (',
        `(typeof globalThis != 'undefined') ? globalThis :`,
        `(typeof window != 'undefined') ? window :`,
        `(typeof global != 'undefined') ? global :`,
        'undefined',
      ');',
      '',
      'if (target) {',
        `target.${packageName} = ${packageName};`,
      '}',
    '})()',
  ].join('\n')
}

function modulejs(packageName) {
  return [
    '',
    `export { ${packageName} }`,
    `export default ${packageName}`,
  ].join('\n')
}
