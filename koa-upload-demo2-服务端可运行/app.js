const fs = require('fs');
const fse = require('fs-extra');
const koa = require('koa')
const koaBody = require('koa-body')
const Router = require('koa-router')
const koaStatic = require('koa-static')
const cors = require('koa2-cors');
const path = require('path')
const { del_travel } = require('./utils/utils')
const router = new Router()
const app = new koa()

app.use(cors({
  origin: function (ctx) {
    // if (ctx.url === '/test') {
    //   return false;
    // }
    return '*';
  },
  exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'],
  maxAge: 5,
  credentials: false,
  allowMethods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
}));

// 1.静态资源服务，指定对外提供访问的根目录
app.use(koaStatic(path.join(__dirname, 'public')))

const curYear = (new Date()).getFullYear()

fse.ensureDirSync('./public/uploads/' + curYear)

app.use(koaBody({
  // 支持文件格式
  multipart: true,
  formLimit: "10mb",
  jsonLimit: "10mb",
  textLimit: "10mb",
  formidable: {
    // 上传目录
    uploadDir: path.join(__dirname, 'public/uploads/' + curYear),
    // 保留文件扩展名
    keepExtensions: true,
    onFileBegin(formName, file) {
      file.path = path.join(__dirname, 'public/uploads/' + file.name)
    }
  }
}))

// 发布
router.post('/upload', async ctx => {

  let res;

  /**
   * 进行项目的写入操作
   * @param {Object} data - 存储文件信息 key-文件路径 value-文件内容
   * @param {string} dir - 项目根目录
   * @param {Object} config - 项目基础信息  版本号｜时间｜项目名称
   */
  function initFile(data, dir, config) {
    // fs.existsSync(dir) ?
    //   await del_travel(dir) : ''

    // fse.ensureDirSync(dir)
    fs.writeFileSync(dir + '/llscw.config.json', JSON.stringify(config), 'utf-8')

    for (let key in data) {
      let dir_path = dir + path.dirname(key)
      fs.mkdirSync(dir_path, { recursive: true })
      if (dir_path.includes('/img')) {
        fs.writeFileSync(dir + key, data[key], 'binary')
      } else {
        fs.writeFileSync(dir + key, data[key], 'utf-8')
      }
    }
  }

  /**
   * 项目发布
   * @param {*} req - 客户端提交的数据
   * @returns 
   */
  async function setFile(req) {
    const { data, version, time, project } = req

    const config = {version, time, project}

    let path = './' + project + '-' + version
    let path_main = './' + project
    if (fs.existsSync(path)) {
      const msg = JSON.parse(fs.readFileSync(path + '/llscw.config.json', 'utf-8'))
      if (msg.time < time) {
        initFile(data, path, config)
        initFile(data, path_main, config)
      } else {
        res = {
          code: -1,
          message: '发布失败，时间错误'
        }
        return;
      }
    } else {
      // 备份，用于回滚
      fs.mkdirSync(path)
      // 真实展示
      fse.ensureDirSync(path_main)
      initFile(data, path, config)
      initFile(data, path_main, config)
    }
    res = {
      code: 0,
      message: '发布成功'
    }
  }
  await setFile(ctx.request.body)

  ctx.body = res
})

// 回滚
router.post('/rollback', async ctx => {
  const { version, project, time } = ctx.request.body

  // 存在问题：可能服务端没有该版本号
  // 应该先判断回滚的版本号是否存在 or 返回该项目版本号给客户端，客户端通过选择的版本号的方式回滚
  fs.existsSync(`./${project}`) ?
    await del_travel(`./${project}`) : ''

  /**
   * 递归拷贝项目
   * @param {string} dir 
   * @param {Function} callback 
   */
  function travel(dir, callback) {
    fs.readdirSync(dir).forEach(async (file) => {
      var pathname = path.join(dir, file)
      if (fs.statSync(pathname).isDirectory()) {
        travel(pathname, callback)
      } else if (fs.statSync(pathname).isFile()) {
        // 确认项目根目录
        fse.ensureDirSync(`./${project}`)

        // 更新项目信息
        if (file == 'llscw.config.json') {
          fs.writeFileSync(pathname, JSON.stringify({ project, version, time }))
        }
        let target = pathname.replace(/-\d+(.\d+){0,2}/, '')
        await fse.ensureDirSync(path.dirname(target))
        fs.copyFileSync(pathname, target)
      }
    })
  }
  await travel(`./${project}-${version}`, function (pathname, doc) {
  })

  ctx.body = { code: 0, message: 'success' }
})

app.use(router.routes())
app.listen(3020, () => {
  console.log('启动成功')
  console.log('http://localhost:3020')
});