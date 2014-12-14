var ArvBsApistatus = function() {
    var apistatus = {};
    apistatus.vm = (function() {
        var vm = {};
        vm.init = function(connection, apiPrefix) {
            vm.connection = connection;
            vm.apiPrefix = apiPrefix;
            vm.refresh();
        };
        vm.refresh = function() {
            vm.keepDisks = m.prop({items:[]});
            vm.nodes = m.prop({items:[]});
            vm.connection.ready.then(function() {
                vm.connection.Node.list().then(vm.nodes);
                vm.connection.KeepDisk.list().then(vm.keepDisks);
            });
        };
        vm.logout = function() {
            vm.connection.token(undefined);
        };
        return vm;
    })();
    apistatus.controller = function(connection, apiPrefix) {
        apistatus.vm.init(connection, apiPrefix);
    };
    apistatus.view = function(ctrl) {
        var vm = apistatus.vm;
        var dd = vm.connection.discoveryDoc();
        var show = !dd ? {} : {
            apiVersion: dd.version + ' (' + dd.revision + ')',
            sourceVersion: m('a', {
                href: 'https://arvados.org/projects/arvados/repository/changes?rev=' + dd.source_version
            }, dd.source_version),
            generatedAt: dd.generatedAt
        };
        var content = !dd ? vm.connection.state() : (
            m('div.row', [
                m('div.col-md-4',
                  Object.keys(show).map(function(key) {
                      return m('div.row', [
                          m('div.col-sm-4.lighten', key),
                          m('div.col-sm-8', show[key]),
                      ]);
                  })),
                m('div.col-md-4', [
                    m('ul', [
                        '' + vm.keepDisks().items.length + ' disks',
                        vm.keepDisks().items.map(function(keepDisk) {
                            return m('li', keepDisk.uuid);
                        }),
                     ]),
                ]),
                m('div.col-md-4', [
                    m('ul', [
                        '' + vm.nodes().items.length + ' nodes',
                        vm.nodes().items.filter(function(node) {
                            return true;
                        }).map(function(node) {
                            return m('li', [
                                m('span.label.label-default', [
                                    node.crunch_worker_state,
                                ]),
                                ' ',
                                node.uuid
                            ]);
                        }),
                    ]),
                ]),
            ]));
        var logInOrOut = vm.connection.token() ? ((
            m('a.btn.btn-xs.btn-default.pull-right',
              {onclick: vm.logout}, 'Log out')
        )) : ((
            m('a.btn.btn-xs.btn-primary.pull-right',
              {href: vm.connection.loginLink()}, 'Log in')
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
        vm.addConnection = function(apiPrefix) {
            var widget = {};
            widget.component = new ArvBsApistatus();
            widget.controller = new widget.component.controller(
                new ArvadosConnection(apiPrefix), apiPrefix);
            vm.statusWidgets.push(widget);
        };
        return vm;
    })();
    apidirectory.controller = function() {
        apidirectory.vm.init();
    };
    apidirectory.view = function(ctrl) {
        return m('div',
                 apidirectory.vm.statusWidgets.map(function(widget) {
                     return widget.component.view(widget.controller);
                 }));
    };
    return apidirectory;
}
