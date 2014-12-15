function ArvBsApistatus(connection, apiPrefix) {
    var apistatus = {};
    apistatus.vm = (function() {
        var vm = {};
        vm.init = function(connection, apiPrefix) {
            vm.connection = connection;
            vm.apiPrefix = apiPrefix;
            vm.refresh();
        };
        vm.refresh = function() {
            vm.nodes = vm.connection.api(
                'Node', 'list', {});
            vm.keepDisks = vm.connection.api(
                'KeepDisk', 'list', {});
        };
        vm.logout = function() {
            vm.connection.token(undefined);
        };
        vm.ddSummary = function() {
            var dd = vm.connection.discoveryDoc();
            return !dd ? {} : {
                apiVersion: dd.version + ' (' + dd.revision + ')',
                sourceVersion: m('a', {
                    href: 'https://arvados.org/projects/arvados/repository/changes?rev=' + dd.source_version
                }, dd.source_version),
                generatedAt: dd.generatedAt
            }
        };
        return vm;
    })();
    apistatus.vm.init(connection, apiPrefix);
    apistatus.controller = function() {
    };
    apistatus.view = function() {
        var vm = apistatus.vm;
        var dd = vm.connection.discoveryDoc();
        var ddSummary = vm.ddSummary();
        return m('.panel.panel-info.arv-bs-api-status', [
            m('.panel-heading', [
                vm.apiPrefix,
                !dd ? '' : util.choose(!!vm.connection.token(), {
                    true: [function() {
                        return m('a.btn.btn-xs.btn-default.pull-right',
                                 {onclick: vm.logout}, 'Log out');
                    }],
                    false: [function() {
                        return m('a.btn.btn-xs.btn-primary.pull-right',
                                 {href: vm.connection.loginLink()}, 'Log in');
                    }]
                }),
            ]),
            m('.panel-body', !dd ? vm.connection.state() : (
                m('.row', [
                    m('.col-md-4',
                      Object.keys(ddSummary).map(function(key) {
                          return m('.row', [
                              m('.col-sm-4.lighten', key),
                              m('.col-sm-8', ddSummary[key]),
                          ]);
                      })),
                    m('.col-md-4', [
                        !vm.keepDisks() ? '' : m('ul', [
                            '' + vm.keepDisks().items.length + ' disks',
                            vm.keepDisks().items.map(function(keepDisk) {
                                return m('li', [
                                    m('a', {href: '/show/'+keepDisk.uuid,
                                            config: m.route},
                                      keepDisk.uuid),
                                ]);
                            }),
                        ]),
                    ]),
                    m('.col-md-4', [
                        !vm.nodes() ? '' : m('ul', [
                            '' + vm.nodes().items.length + ' nodes',
                            vm.nodes().items.filter(function(node) {
                                return node.crunch_worker_state != 'down';
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
                ]))
             ),
        ]);
    };
    return apistatus;
};

var ArvBsApidirectory = function() {
    var apidirectory = {};
    apidirectory.vm = (function() {
        var vm = {};
        vm.init = function() {
            vm.widgets = [];
        };
        vm.addConnection = function(apiPrefix) {
            vm.widgets.push(new ArvBsApistatus(
                ArvadosConnection.make(apiPrefix), apiPrefix));
        };
        return vm;
    })();
    apidirectory.vm.init();
    apidirectory.controller = function() {
    };
    apidirectory.view = function() {
        return m('div',
                 apidirectory.vm.widgets.map(function(widget) {
                     return widget.view(widget.controller());
                 }));
    };
    return apidirectory;
}
