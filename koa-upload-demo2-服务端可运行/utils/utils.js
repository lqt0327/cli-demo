const fs = require('fs');
const path = require('path')

/**
 * 递归删除项目
 * @param {string} dir - 目录路径
 */
async function del_travel(dir) {
  fs.readdirSync(dir).forEach((file) => {
    let pathname = path.join(dir, file)
    if (fs.statSync(pathname).isDirectory()) {
      del_travel(pathname)
    } else if (fs.statSync(pathname).isFile()) {
      fs.unlinkSync(pathname)
    }
  })
  fs.rmdirSync(dir)
}

module.exports = {
  del_travel
}