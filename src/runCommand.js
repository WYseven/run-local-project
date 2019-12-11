let { spawn } = require('child_process');

// 封装可执行命令的方法。
function runCommand(script, options={}){
  options.env = {
    ...process.env,
    ...options.env
  }

  options.cwd = options.cwd || process.cwd();

  options.stdio = ['pipe', 'pipe', 'pipe', 'ipc'];
  let sh = 'sh',shFlag = '-c';
  return spawn(sh, [shFlag, script], options)
}

// 创建子进程，执行命令
const ipc = runCommand('node test.js', {
  env: {
    ENV_TEST: '测试数据'
  }
});
ipc.on('message',function(message){
  console.log('message: ', message);
})
// 接收子进程的输出数据，例如 console.log 的输出
ipc.stdout.on('data', log => {
  console.log(log.toString());
});
// 当子进程执行结束时触发
ipc.stdout.on('close', log => {
  console.log('结束了');
});
// 当主程序结束时，无论子程序是否执行完毕，都kill掉
process.on('exit', () => {
  console.log('主线程退出');
  ipc.kill('SIGTERM');  // 终止子进程
});