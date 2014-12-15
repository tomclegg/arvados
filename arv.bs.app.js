var apidir;

m.route(document.body, '/', {
    '/': new ArvBsLayout([apidir = new ArvBsApidirectory()]),
    '/login-callback': ArvBsLoginCallback(),
    '/show/:uuid': new ArvBsLayout([new ArvBsShow()]),
});

'4xphq qr1hi 9tee4 su92l bogus'.split(' ').map(function(site) {
    apidir.vm.addConnection(site);
});

setInterval(function() {
    // If redraw is really really cheap, we can do this to make
    // "#seconds old" timers count in real time.
    m.redraw();
}, 1000);
