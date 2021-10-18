const fs = require('fs');
const fse = require('fs-extra');
const koa = require('koa')
const koaBody = require('koa-body')
const Router = require('koa-router')
const koaStatic = require('koa-static')
const cors = require('koa2-cors');
const path = require('path')
const router = new Router()
const app = new koa()

app.use(cors({
  origin: function(ctx) {
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

fse.ensureDirSync('./public/uploads/'+curYear)

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
router.post('/upload', async ctx => {

    let res;

    function initFile(data, path) {
      for(let key in data) {
          let tmp = key.split('/')
          tmp.pop()
          let dir_path = path + tmp.join('/')
          // 需要在这里  对比版本号，版本号大于当前，则重新写入
          // 版本号：package.json中的版本号
          fs.mkdir(dir_path, {recursive: true}, (err) => {
              if(err) console.error(err);
              if(dir_path.includes('/img')) {
                  fs.writeFileSync(path + key, data[key], 'binary')
              }else {
                  fs.writeFileSync(path + key, data[key], 'utf-8')
              }
          })

        }
    }

    function setFile(req) {
      const { data, version, time, project } = req
      let path = './' + project + '-' + version
      let path_main = './' + project
      if(fs.existsSync(path)) {
        const msg = JSON.parse(fs.readFileSync(path+'/llscw.config.json', 'utf-8'))
        if(msg.time < time) {
          fs.writeFileSync(path+'/llscw.config.json', JSON.stringify({project,version,time}), 'utf-8')
          fs.writeFileSync(path_main+'/llscw.config.json', JSON.stringify({project,version,time}), 'utf-8')
          initFile(data, path)
          initFile(data, path_main)
        }else {
          res = {
            code: -1,
            message: '发布失败，时间错误'
          }
          return ;
        }
      }else {
        // 备份，用于回滚
        fs.mkdir(path, (err)=>{
          if(err) console.error(err);
          fs.writeFileSync(path+'/llscw.config.json', JSON.stringify({project,version,time}), 'utf-8')
        })
        // 真实展示
        fs.mkdir(path_main, (err)=>{
          if(err) console.error(err);
          fs.writeFileSync(path_main+'/llscw.config.json', JSON.stringify({project,version,time}), 'utf-8')
        })
        initFile(data, path)
        initFile(data, path_main)
        
      }
      res = {
        code: 0,
        message: '发布成功'
      }
    }
    await setFile(ctx.request.body)

    ctx.body = res
})

router.post('/rollback', async ctx => {
  const { version, project, time } = ctx.request.body

  // 错误，应该先删除掉llscw文件夹，再copy过去，不然会有多余文件没删除同时目录不存在报错等问题

  function del_travel(dir) {
    fs.readdirSync(dir).forEach((file)=>{
      let pathname = path.join(dir, file)
      if(fs.statSync(pathname).isDirectory()) {
        del_travel(pathname)
      }else if(fs.statSync(pathname).isFile()) {
        fs.unlinkSync(pathname)
      }
    })
    fs.rmdirSync(dir)
  }
  fs.existsSync(`./${project}`) ? 
  await del_travel(`./${project}`) : ''

  function travel(dir, callback) {
      fs.readdirSync(dir).forEach(async (file) => {
        var pathname = path.join(dir, file)
        if (fs.statSync(pathname).isDirectory()) {
            travel(pathname, callback)
        } else if (fs.statSync(pathname).isFile()) {
          // 跟目录缺失，创建错误，需要先判断根目录是否存在

          fse.ensureDirSync(`./${project}`)

          if(pathname.includes('llscw.config.json')) {
            fs.writeFileSync(pathname, JSON.stringify({project,version, time}))
          }
          let target = pathname.replace(/-\d+(.\d+){0,2}/, '')
          let tmp = target.split('/')
          tmp.pop()
          let target_dir = tmp.join('/')
          await fse.ensureDirSync(target_dir)
          fs.copyFileSync(pathname, target)
            // callback(pathname.split('build')[1], doc)
        }
      })
    }
    await travel(`./${project}-${version}`, function (pathname, doc) {
    })

    ctx.body = {code: 0,message: 'success'}
})

app.use(router.routes())
app.listen(3020, () => {
    console.log('启动成功')
    console.log('http://localhost:3020')
});