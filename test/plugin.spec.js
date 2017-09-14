const expect = require('expect');
const spawn = require('cross-spawn');
const path = require('path');
const fs = require('fs');

const NpmSubmodulePlugin = require('../src/plugin');

const node_module = 'isObject';
const inner_module_path = 'node_modules' + path.sep + node_module + path.sep + 'node_modules';

describe('plugin', () => {
  let compiler;
  let plugin;
  let logs;
  const spawnSpy = expect.spyOn(spawn, 'sync');
  const fsSpy = expect.spyOn(fs, 'existsSync');

  beforeEach(function() {
    spawnSpy.calls = [];                              // reset spys
    fsSpy.calls = [];
    logs = [];                                        // initialize variables.
    compiler = {};
    compiler.plugin = (hook, callback) => callback(); // default compiler.plugin calls the callback immediately.
    plugin = new NpmSubmodulePlugin({                 // create default plugin.
      module: node_module,
      commands: ['clean', 'compile'],                 // npm commands to test.
      logger: (log) => logs.push(log)                 // default logger pushes the output into the logs array.
    });
  });

  it('default values created', () => {
    plugin = new NpmSubmodulePlugin({module: ''});  // create a plugin without the optional fields.
    expect(plugin.logger).toExist();                // verify default values
    expect(plugin.commands).toEqual([]);
    expect(plugin.autoInstall).toBe(false);
  });

  it('autoInstall saved', () => {
    plugin = new NpmSubmodulePlugin({module: '', autoInstall: true}); // create a plugin without autoInstall === true
    expect(plugin.autoInstall).toBe(true);                            // verify that autoInstall is saved
  });


  it('apply should hook into `done`', () => {
    let hook = null;
    compiler.plugin = (h) => hook = h;  // override the plugin method to save the hook.
    plugin.apply(compiler);             // call the apply method.
    expect(hook).toBe('done');          // verify that the hook is 'done'.
  });

  it('apply should loop commands', () => {
    spawnSpy.andReturn({ stdout: 'command output' });  // fake the npm call
    plugin.apply(compiler);                            // call the npm commands ('npm install' and 'npm view).
    expect(logs.length).toBe(2);                       // verify that both command executed.
    expect(logs[0]).toEqual('command output');         // verify logs
    expect(logs[1]).toEqual('command output');
  });

  it('runCommand handle errors', () => {
    spawnSpy.andReturn({ stderr: 'error message' });                // fake the npm call
    plugin.runCommand('command');                                   // execute command
    expect(logs.length).toBe(1);                                    // verify log
    expect(logs[0]).toEqual('error message');
  });

  it('runCommand calls cross-spawn properly', () => {
    spawnSpy.andReturn({});                                              // fake the npm call
    plugin.runCommand('command');                                        // execute command
    expect(logs.length).toBe(0);                                         // verify log
    expect(spawnSpy.calls[0].arguments[0]).toEqual('npm');               // arguments
    expect(spawnSpy.calls[0].arguments[1]).toEqual(['run', 'command']);
  });

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

  it('handleAutoInstall calls fs.existsSync with the correct path', () => {
    fsSpy.andReturn(true);                                          // set the 'node_modules' to exist
    const commands = plugin.commands.slice();                       // clone the commands
    plugin.autoInstall = true;                                      // set the autoInstall to true, otherwise the fs.existsSync won't get invoked
    plugin.handleAutoInstall();                                     // invoke the handleAutoInstall
    expect(plugin.commands).toEqual(commands);                      // verify that the output not changed
    expect(fsSpy.calls[0].arguments[0]).toEqual(inner_module_path); // verify that the fs.existsSync invoked with the correct path
  });

  it('handleAutoInstall adds install if the node_modules not exists', () => {
    fsSpy.andReturn(false);                                         // set the 'node_modules' to not-exist
    expect(plugin.commands.includes('install')).toBe(false);        // verify that install is not in the commands
    plugin.autoInstall = true;                                      // set the autoInstall to true, otherwise the 'node_modules' never checked
    plugin.handleAutoInstall();                                     // invoke the handleAutoInstall
    expect(plugin.commands.includes('install')).toBe(true);         // verify that install is in the commands
  });
});
