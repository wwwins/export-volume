#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawn } = require('child_process');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const term = require('terminal-kit').terminal;

const DEBUG = process.env.DEBUG=='true' ? true : false;

const cmd = 'docker run --rm -v #:/workspaces busybox tar -C /workspaces -zcf - . > #.tgz';

let log = console.log;
console.log = function () {
  if (!DEBUG)
    return;
  log.call(console, new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  log.apply(console, arguments);
}

async function doCmd(cmd, next) {
  const { stdout, stderr } = await exec(cmd);
  if (stdout)
    console.log(`stdout: ${stdout}`);
  if (stderr)
    console.log(`stderr: ${stderr}`);
  next();
}

function getDockerVolumeName(next) {
  const process = spawn('docker', ['volume', 'ls', '-q']);
  let bufs='';
  let errs='';
  let type=0;

  process.stdout.on('data', (data) => {
    bufs = bufs + Buffer.from(data).toString();
    console.log('stdout:'+data);
  })

  process.stderr.on('data', (data) => {
    errs = errs + Buffer.from(data).toString();
    console.log('stderr:'+data);
  })

  process.on('exit', (data) => {
    const s = bufs.split("\n").slice(0,-1);
    next(s);
  })

  process.on('error', (data) => {
    console.log(data);
  })
}

function show(items) {
  term.cyan('請選擇要輸出的 volume 名稱\n');

  term.singleColumnMenu(
      items, (error,response) => {
      term( '\n' ).eraseLineAfter.green(
        "#%s selected: %s (%s,%s)\n",
        response.selectedIndex+1 ,
        response.selectedText ,
        response.x ,
        response.y,
      );
      doCmd(cmd.replace(/#/g,response.selectedText), () => term.processExit());
      term('輸出中\n');
  })
}

getDockerVolumeName(show);

