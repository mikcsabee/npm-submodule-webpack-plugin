'use strict';

/**
 * @name npm-submodule-webpack-plugin
 * @desc Executes npm commands in a node_modules module.
 * @author Csaba Miklos
 * @license MIT
 */

const spawn = require('cross-spawn');
const path = require('path');
const fs = require('fs');

/** 
 * Standard npm commands.
 * @constant
 * @type {string[]}
 */
const npmCommands = [
    'access', 'adduser', 'bin', 'bugs', 'c', 'cache', 'completion', 'config',
    'ddp', 'dedupe', 'deprecate', 'dist-tag', 'docs', 'doctor', 'edit',
    'explore', 'get', 'help', 'help-search', 'i', 'init', 'install',
    'install-test', 'it', 'link', 'list', 'ln', 'login', 'logout', 'ls',
    'outdated', 'owner', 'pack', 'ping', 'prefix', 'prune', 'publish', 'rb',
    'rebuild', 'repo', 'restart', 'root', 'run', 'run-script', 's', 'se',
    'search', 'set', 'shrinkwrap', 'star', 'stars', 'start', 'stop', 't', 'team',
    'test', 'tst', 'un', 'uninstall', 'unpublish', 'unstar', 'up', 'update', 'v',
    'version', 'view', 'whoami'
];

/**
 * Logger to caputer the command output.
 * @callback Logger
 * @param {string} message - message to log.
 */

/**
 * The mandatory named JavaScript function which represents a Webpack plugin.
 * @example 
 * new NpmSubmodulePlugin({
 *   module: 'isObject',
 *   autoInstall: false,
 *   commands: [
 *     'install',
 *     'install --save react'
 *   ],
 *   logger: console.log
 * });
 * @param {Object} options - The plugin options
 * @param {string} options.module - The node module to operate on.
 * @param {boolean} [options.autoInstall=false] - Adds `npm install` to the commands if the `node_modules` folder is not exists.
 * @param {string[]} [options.commands=[]] - The commands to execute.
 * @param {Logger} [options.logger=console.log] - The logger.
 * @class
 */
function NpmSubmodulePlugin(options) {
  // initialize instance variables
  this.commands = options.commands ? options.commands : [];
  this.autoInstall = options.autoInstall ? options.autoInstall : false;
  this.logger = options.logger ? options.logger : console.log;
  this.path = 'node_modules' + path.sep + options.module;
  this.spawnSyncOptions = {
    stdio: ['ignore', 'pipe', 'inherit'],
    cwd: this.path
  };
}

/**
 * The mandatory `apply` method: called by webpack.
 * @param {Object} compiler - Webpack compiler
 */
NpmSubmodulePlugin.prototype.apply = function(compiler) {
  compiler.plugin('done', () => {      // hook into 'done'
    this.handleAutoInstall();          // add 'install' if necessary
    this.commands.forEach(command =>   // for every command
      this.runCommand(command)         // run runCommand
    );
  });
}

/**
 * Run an npm command in the `module` folder.
 * @param {string} command - the npm command to run.
 */
NpmSubmodulePlugin.prototype.runCommand = function(command) {
  const args = this.getArguemts(command);                         // create npm argument array
  const result = spawn.sync('npm', args,  this.spawnSyncOptions); // execute the command
  const output = this.getOutput(result)                           // handle thr result
  if(output) {                                                    // if output exists
    this.logger(output);                                          // log the output
  }
}

/**
 * Generates the npm argument array:
 * @example 
 * - 'command with arguments' -> ['command', 'with', 'arguments'] // split by space
 * - 'install'                -> ['install']                      // converts a standard command to an array
 * - 'my-command'             -> ['run', 'my-command']            // if the command is not standard converts it to an array and add 'run' to index 0
 *
 * @param {string} command - the npm command to run.
 * @returns {string[]} argument array.
 */
NpmSubmodulePlugin.prototype.getArguemts = function(command) {
  if(command.includes(' ')) {        // if the command has arguments -> split by space
    return command.split(' ');
  }
  if(npmCommands.includes(command)) { // if npm command -> convert to array
    return [command];
  }
  return ['run', command];            // else -> convert to an array and add 'run' to index 0
}

/**
 * Tries to parse the stdout into UTF-8 string if it exist. If it not exists then tries the same with the stderr.
 * If none of them exist resutns null.
 * @param {Objet} result - the output of the spawn.sync.
 * @param {string} result.stdout
 * @param {string} result.stderr
 * @returns {string|null} output
 */
NpmSubmodulePlugin.prototype.getOutput = function(result) {
  if(result.stdout) {
    return result.stdout.toString('utf8');                      // parse the output into string
  } else if(result.stderr) {
    return result.stderr.toString('utf8');                      // parse the output into string
  }
  return null;
}

/**
 * Handles the `autoInstall` option. If the `autoInstall` is true and if the node_modules doesn't exists 
 * adds 'install' to the begining of the commands.
 */
NpmSubmodulePlugin.prototype.handleAutoInstall = function() {
  if (this.autoInstall && !fs.existsSync(this.path + path.sep + 'node_modules')) {
    this.commands.unshift("install");
  }
}

module.exports = NpmSubmodulePlugin;
