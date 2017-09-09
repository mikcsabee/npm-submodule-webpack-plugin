[![Build Status](https://travis-ci.org/mikcsabee/npm-submodule-webpack-plugin.svg?branch=master)](https://travis-ci.org/mikcsabee/npm-submodule-webpack-plugin)

<div align="center">
  <!-- replace with accurate logo e.g from https://worldvectorlogo.com/ -->
  <a href="https://github.com/webpack/webpack">
    <img width="200" height="200" vspace="" hspace="25"
      src="https://cdn.rawgit.com/webpack/media/e7485eb2/logo/icon.svg">
  </a>
  <h1>NPM Submodule Webpack Plugin</h1>
  <p>Run npm commands in a module inside the node_modules folder.<p>
</div>

<h2 align="center">Install</h2>

```bash
$ npm install --save-dev npm-submodule-webpack-plugin
```

<h2 align="center">Usage</h2>

Let say that you have something similar in your `package.json`:

```js
  "dependencies": {
    "myproject": "git+https://my.private/repo.git#1234567"
  }
```

And you would like to run the following npm commands in the `node_modules/myproject` folder:

```bash
$ npm install
$ npm run compile
```

Then you need to add the following lines into your  `webpack.config.js`:

```js
var NpmSubmodulePlugin = require("npm-submodule-webpack-plugin");
```

```js
  plugins: [
    new NpmSubmodulePlugin({
      module: 'myproject',
      commands: [
        'install',
        'compile'
      ]
    })
  ]
```

By default, the plugins use the `console.log` method to log the output of the command, but it is possible, to use a custom logger:


```js
  plugins: [
    new NpmSubmodulePlugin({
      module: 'myproject',
      commands: [
        'install',
        'compile'
      ],
      logger: my-logger-method
    })
  ]
```

Working with arguments:

```js
  plugins: [
    new NpmSubmodulePlugin({
      module: 'myproject',
      commands: [
        'install --save react'
      ]
    })
  ]
```
