const axios = require('axios')
const inquirer = require('inquirer')
const ora = require('ora');

async function rollback() {
    async function setTemplateMsg() {
        return await inquirer.prompt([
            {
                name: 'project',
                type: 'input',
                message: '项目名称',
                default: 'llscw'
            },
            {
                name: 'version',
                type: 'input',
                message: '版本号',
                default: '0.0.1'
            }
        ])
    }
 
    const config = await setTemplateMsg()

    const spinner = await ora('🗃 开始回滚项目...').start();
    
    axios.post('http://localhost:3020/rollback', {
        version: config.version,
        project: config.project,
        time: Date.now()
    })
    .then(res => {
        // let obj = res.data
        console.log()
        if(res.data.code == 0) {
            spinner.succeed('项目回滚完成');
        }
    }).catch(err => {
        console.log(err,'----')
        spinner.fail('项目回滚失败')
    })
}

module.exports = rollback