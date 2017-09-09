const fs = require('fs');
const expect = require('expect');
const rimraf = require('rimraf');

const NpmSubmodulePlugin = require('../src/plugin');

const node_module = 'isObject';
const path = 'node_modules/' + node_module + '/node_modules';

describe('plugin', () => {
  let compiler;
  let plugin;
  let logs;

  beforeEach(function() {
    rimraf.sync(path);                                // clean the folder where 'npm install' executes.
    logs = [];                                        // initialize variables.
    compiler = {};
    compiler.plugin = (hook, callback) => callback(); // default compiler.plugin calls the callback immediately.
    plugin = new NpmSubmodulePlugin({                 // create default plugin.
      module: node_module,
      commands: ['install', 'view'],                  // npm commands to test.
      logger: (log) => logs.push(log)                 // default logger pushes the output into the logs array.
    });
  });

  it('default logger should be exist', () => {
    plugin = new NpmSubmodulePlugin({module: '', commands: []});  // create a plugin without defining a logger.
    expect(plugin.logger).toBeDefined();                          // verify that the logger created.
  });

  it('apply should hook into `done`', () => {
    let hook = null;
    compiler.plugin = (h) => hook = h;  // override the plugin method to save the hook.
    plugin.apply(compiler);             // call the apply method.
    expect(hook).toBe('done');          // verify that the hook is 'done'.
  });

  it('apply should loop commands', (done) => {
    expect(fs.existsSync(path)).toBe(false);        // make sure that the node_modules folder is not exists.
    plugin.apply(compiler);                         // call the npm commands ('npm install' and 'npm view).
    expect(logs.length).toBe(2);                    // verify that both command executed.
    expect(fs.existsSync(path)).toBe(true);         // verify that the 'npm install' invoked and the node_modules folder created.
    expect(logs[1]).toContain("name: 'isobject'");  // verify that the 'npm view' returned a correct output to the logger.
    done();
  }).timeout(30 * 1000);                            // 'npm install' takes a lot of time.

  it('getArguemts parses command with argument into array', () => {
    const input = 'install --save react';                  // create input (command with argument).
    const expectedOutput = ['install', '--save', 'react']; // create expected output.
    const output = plugin.getArguemts(input);              // invoke getArguments with the input.
    expect(output).toEqual(expectedOutput);                // verify that the method split the input by spaces.
  });

  it('getArguemts recognises npm commnad', () => {
    const input = 'install';                  // create input (standard npm command).
    const expectedOutput = ['install'];       // create expected output.
    const output = plugin.getArguemts(input); // invoke getArguments with the input.
    expect(output).toEqual(expectedOutput);   // verify output (method converts input into an array).
  });

  it('getArguemts recognises custom commnad', () => {
    const input = 'clean';                    // create input (non-standard npm command).
    const expectedOutput = ['run', 'clean'];  // create expected output.
    const output = plugin.getArguemts(input); // incoke getArguments with the input.
    expect(output).toEqual(expectedOutput);   // verify output (method converts input into an array and puts 'run' into index 0).
  });
});
