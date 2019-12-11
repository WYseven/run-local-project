let { spawn } = require('child_process');
let {EventEmitter} = require('events');

// 继承有 on emit 的方法
class TaskManger extends EventEmitter {
  constructor(){
    super();
  }
  // 初始调用，接收发送数据的方法
  init(send){
    // 监听 自定义事件
    this.on('std-out-message', (message) => {
      send({
        type: 'task.log',
        payload: {
          log: message
        }
      });
    })
  }
  // 通用的执行命令函数
  runCommand(script, options={}){
    options.env = {
      ...process.env,
      ...options.env
    }
    options.cwd = options.cwd || process.cwd();
    options.stdio = ['pipe', 'pipe', 'pipe', 'ipc'];
    let sh = 'sh',shFlag = '-c';
    return spawn(sh, [shFlag, script], options)
  }
  // 开始任务
  async run(script, options){
    this.ipc = await this.runCommand(script, options);
    this.processHandler(this.ipc);
  }
  // 取消任务
  cancel(){
    this.ipc.kill('SIGTERM');
  }
  // 接收创建的子进程
  processHandler(ipc){
    // 子进程 **process.send** 发送的数据
    ipc.on('message', (message) => {
      this.emit('std-out-message', message);
    });
    // 接收子进程的输出数据，例如 console.log 的输出
    ipc.stdout.setEncoding('utf8');
    ipc.stdout.on('data', log => {
      this.emit('std-out-message', log);
    });
    // 当子进程执行结束时触发
    ipc.stdout.on('close', log => {
      console.log('结束了', log);
      this.emit('std-out-message', '服务停止');
    });
    // 当主程序结束时，无论子程序是否执行完毕，都kill掉
    process.on('exit', () => {
      console.log('主线程退出');
      ipc.kill('SIGTERM');  // 终止进程
    });
  }
}

module.exports = TaskManger;