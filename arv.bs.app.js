var apidir = new ArvBsApidirectory();
apidir.controller();

m.route(document.body, '/', {
    '/': ArvBsLayout([apidir]),
    '/login-callback': ArvBsLoginCallback(),
});

'4xphq qr1hi 9tee4 su92l bogus'.split(' ').map(function(site) {
    apidir.vm.addClient(site);
});
