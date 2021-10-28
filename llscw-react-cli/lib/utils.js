const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const readPkg = require('read-pkg');
const { execSync } = require('child_process');
const sh = require('shelljs');

async function writeFileTree (dir, files) {
  Object.keys(files).forEach((name) => {
    const filePath = path.join(dir, name)
    fsExtra.ensureDirSync(path.dirname(filePath))
    fsExtra.writeFileSync(filePath, files[name])
  })
}


function resolveJson (context, name = 'package.json') {
  if (fs.existsSync(path.join(context, name))) {
    return readPkg.sync({
      cwd: context
    })
  }
  return {}
}

function pusBranch() {
  try {
    execSync(`git add . && git commit -m 'release project' && git push`);
  } catch (e) {
    console.log(e);
  }
}

/**
 * 遍历目录，回调函数中 执行对应操作
 * @param {string} dir - 路径
 * @param {string} dir_name - 需要切割的路径名称
 * @param {function} callback 
 *  (
 *    args[0]: string, - 不包含文件名的路径
 *    args[1]: string, - 项目中 完整路径
 *    args[2]: string, - 项目跟目录
 *  ) => (?void)
 */
async function travel(dir, dir_name, callback) {
  fs.readdirSync(dir).forEach((file) => {
      var pathname = path.join(dir, file)
      if (fs.statSync(pathname).isDirectory()) {
          travel(pathname, dir_name, callback)
      } else if (fs.statSync(pathname).isFile()) {
          callback(pathname.split(dir_name)[1], pathname, dir)
      }
  })
}

/**
 * 递归删除文件和文件夹
 * @param {string} path 
 */
function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    fs.readdirSync(path).forEach(function (file, index) {
      var curPath = path + "/" + file;
      if (fs.lstatSync(curPath).isDirectory()) {
        deleteFolderRecursive(curPath);
      } else {
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
};

class Shell {
  constructor() {
    this.shell = sh;
  }
  exec(command) {
    return new Promise((resolve, reject) => {
      sh.exec(
        command,
        {
          async: true,
          silent: true  // 不将程序输出回显到控制台
        },
        (code, stdout, stderr) => {
          stdout = stdout.toString().trim();
          if (code === 0) {
            if (stderr) {
              console.error(stderr.toString().trim());
            }
            resolve(stdout);
          } else {
            if (stdout && stderr) {
              console.error(`\n${stdout}`);
            }
            reject(new Error(stderr || stdout));
          }
        }
      );
    });
  }
}

module.exports = {
  writeFileTree,
  resolveJson,
  pusBranch,
  travel,
  deleteFolderRecursive,
  Shell,
}
