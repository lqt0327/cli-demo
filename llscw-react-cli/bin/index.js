#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const program = require('commander');
const initial = require('../command/initial');
const generate = require('../command/generator');
const release = require('../command/release');
const rollback = require('../command/rollback');

const pkg = require('../package.json')

let config = {};
// 配置文件如果存在则读取
if(fs.existsSync(path.resolve('llscw.config.js'))){
  config = require(path.resolve('llscw.config.js'));
}

program
  .version(pkg.version,'-v, --version')
  .command('init')
  .description('初始化 llscw config 配置文件')
  .action(initial);

program
  .command('create [template]')
  .description('生成 llscw 模板')
  .action(function(template){
    generate(template);
  });

program
  .command('release')
  .description('发布模板')
  .action(function(){
    release();
  });

program
  .command('rollback')
  .description('回滚模版')
  .action(function(){
    rollback();
  });

program.parse(process.argv);