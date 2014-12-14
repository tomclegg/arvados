var ArvBsApistatus = function() {
    var apistatus = {};
    apistatus.vm = (function() {
        var vm = {};
        vm.init = function(client, apiPrefix) {
            vm.client = client;
            vm.apiPrefix = apiPrefix;
        };
        vm.logout = function() {
            vm.client.token(undefined);
        };
        return vm;
    })();
    apistatus.controller = function(client, apiPrefix) {
        apistatus.vm.init(client, apiPrefix);
    };
    apistatus.view = function(ctrl) {
        var vm = apistatus.vm;
        var dd = vm.client.discoveryDoc();
        var show = !dd ? {} : {
            apiVersion: dd.version + ' (' + dd.revision + ')',
            sourceVersion: m('a', {
                href: 'https://arvados.org/projects/arvados/repository/changes?rev=' + dd.source_version
            }, dd.source_version),
            generatedAt: dd.generatedAt
        };
        var content = !dd ? vm.client.state() : Object.keys(show).map(function(key) {
            return m('div.row', [
                m('div.col-sm-4.lighten', key),
                m('div.col-sm-8', show[key]),
            ]);
        });
        var logInOrOut = vm.client.token() ? ((
            m('a.btn.btn-xs.btn-default.pull-right',
              {onclick: vm.logout}, 'Log out')
        )) : ((
            m('a.btn.btn-xs.btn-primary.pull-right',
              {href: vm.client.loginLink()}, 'Log in')
        ))
        return m('div.panel.panel-info.arv-bs-api-status', [
            m('div.panel-heading', [
                vm.apiPrefix,
                logInOrOut,
            ]),
            m('div.panel-body', content),
        ]);
    };
    return apistatus;
};

var ArvBsApidirectory = function() {
    var apidirectory = {};
    apidirectory.vm = (function() {
        var vm = {};
        vm.init = function() {
            vm.statusWidgets = [];
        };
        vm.addClient = function(apiPrefix) {
            var widget = {};
            widget.component = new ArvBsApistatus();
            widget.controller = new widget.component.controller(
                new ArvadosClient(apiPrefix), apiPrefix);
            vm.statusWidgets.push(widget);
        };
        return vm;
    })();
    apidirectory.controller = function() {
        apidirectory.vm.init();
    };
    apidirectory.view = function(ctrl) {
        return m('div', {style: 'width: 400px; display: inline-block'},
                 apidirectory.vm.statusWidgets.map(function(widget) {
                     return widget.component.view(widget.controller);
                 }));
    };
    return apidirectory;
}
