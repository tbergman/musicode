var id = null;
var interval = 100;

onmessage = function(e){
    if (e.data == 'start') {
        console.log('start');
        id = setInterval(function () { postMessage('tick'); }, interval)
    } else if (e.data == 'stop') {
        console.log('stop');
        clearInterval(id);
        id = null;
    } else if (e.data.interval) {
        console.log('interval: ' + e.data.interval);
        interval = e.data.interval;
        if (id) {
            clearInterval(id);
            id = setInterval(function () { postMessage('tick'); }, interval)
        }
    }
};
