const logQueue = {
  all: [],
  sent: []
};
window.logQueue = logQueue;

const _log = console.log;
const _error= console.error;

console.log = function(){
  const args = Array.from(arguments);
  args.unshift('debug', performance.now().toFixed());
  args.push((new Error).stack?.split('at')[2].split(' ')[2]);
  _log.apply(_error, args);
  window.logQueue.all.push(args);
}

console.error = function(){
  const args = Array.from(arguments);
  args.unshift('error', performance.now().toFixed());
  args.push((new Error).stack?.split('at')[2].split(' ')[2]);
  _error.apply(_error, args);
  window.logQueue.all.push(args);
}

function postLog(data, url) {
  if (!data.length) return;
  const sent = data.map((item) => item[1]);
  window.logQueue.sent = [...new Set(window.logQueue.sent.concat(sent))];
  fetch(url, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }).then(() => {
    const from = data[0][1];
    const to = data[data.length - 1][1];
    window.logQueue.all = window.logQueue.all.filter(item => item[1] < from || item[1] > to);
  }, (what) => {
    console.warn('Missed logs', what);
  });
}

setInterval(() => {
  if (!window.logQueue.all.length) {
    return;
  }
  postLog(window.logQueue.all
    .filter(item => window.logQueue.sent.indexOf(item[1]) === -1).slice());
}, 1000);
