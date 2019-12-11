let express = require('express');
let app = express();
let fs = require('fs');
let path = require('path');
let TaskManger = require('./TaskManger');
let sockjs = require('sockjs');
const ss = sockjs.createServer();

app.use('/*',(req, res) => {
  let indexHtml = fs.readFileSync(path.join(__dirname, './index.html'));
  res.set('Content-Type', 'text/html');
  res.send(indexHtml.toString());
})

const task = new TaskManger();

const server = app.listen(3002,()=> {
  console.log('服务启动');
})


// 发送给 访问者。
const send = (payload) => {
  const message = JSON.stringify(payload);
  Object.keys(conns).forEach(id => {
    conns[id].write(message);
  });
}

let conns = {};
ss.on('connection', (conn) => {
  conns[conn.id] = conn;
  conn.on('data', async (data) => {
    const datas = JSON.parse(data);
    switch(datas.type){
      case 'task/init':
        task.init(send);
      break;
      case 'task/run':
        task.run('npm run serve', {
          cwd: `/Users/test/vue-cli3-project`  // cwd可以设置为你本地的vue-cli3创建的项目目录地址
        });
      break;
      case 'task/cancel':
        task.cancel()
      break;
    }
  })
  conn.on('close', () => {
    delete conns[conn.id];
  })
})

ss.installHandlers(server, {
  prefix: '/test',
  log: () => {},
});