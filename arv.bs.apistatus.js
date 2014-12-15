function ArvBsApistatus(connection, apiPrefix) {
    var apistatus = {};
    apistatus.vm = (function() {
        var vm = {};
        vm.connection = connection;
        vm.dd = connection.discoveryDoc;
        vm.apiPrefix = apiPrefix;
        vm.dirty = true;
        vm.init = function() {
            if (vm.dirty)
                vm.refresh();
            vm.dirty = false;
        };
        vm.refresh = function() {
            vm.nodes = vm.connection.api(
                'Node', 'list', {});
            vm.keepServices = vm.connection.api(
                'KeepService', 'list', {});
        };
        vm.logout = function() {
            vm.connection.token(undefined);
        };
        vm.ddSummary = function() {
            return !vm.dd() ? {} : {
                apiVersion: vm.dd().version + ' (' + vm.dd().revision + ')',
                sourceVersion: m('a', {
                    href: 'https://arvados.org/projects/arvados/repository/changes?rev=' + vm.dd().source_version
                }, vm.dd().source_version),
                generatedAt: vm.dd().generatedAt,
                websocket: util.choose(vm.connection.webSocket.readyState, {
                    0: m('span.label.label-warning', ['connecting']),
                    1: m('span.label.label-success', ['OK']),
                    2: m('span.label.label-danger', ['closing']),
                    3: m('span.label.label-danger', ['closed']),
                }) || m('span.label.label-danger',
                        {title: ('advertised websocketUrl: ' +
                                 vm.dd().websocketUrl)}, ['none'])
            }
        };
        return vm;
    })();
    apistatus.controller = function() {
        apistatus.vm.init(connection, apiPrefix);
    };
    apistatus.view = function() {
        var vm = apistatus.vm;
        var ddSummary = vm.ddSummary();
        return m('.panel.panel-info.arv-bs-api-status', [
            m('.panel-heading', [
                vm.apiPrefix,
                !vm.dd() ? '' : m('.pull-right', [
                    util.choose(!!vm.connection.token(), {
                        true: [function() {
                            return m('a.btn.btn-xs.btn-default',
                                     {onclick: vm.logout}, 'Log out');
                        }],
                        false: [function() {
                            return m('a.btn.btn-xs.btn-primary',
                                     {href: vm.connection.loginLink()}, 'Log in');
                        }]
                    }),
                ]),
            ]),
            m('.panel-body', !vm.dd() ? vm.connection.state() : (
                m('.row', [
                    m('.col-md-4',
                      Object.keys(ddSummary).map(function(key) {
                          return m('.row', [
                              m('.col-sm-4.lighten', key),
                              m('.col-sm-8', ddSummary[key]),
                          ]);
                      })),
                    m('.col-md-4', [
                        !vm.keepServices() ? '' : m('ul', [
                            '' + vm.keepServices().length + ' Keep services',
                            vm.keepServices().map(function(keepService) {
                                return m('li', [
                                    m('span.label.label-default',
                                      keepService().service_type),
                                    ' ',
                                    m('a',
                                      {href: '/show/'+keepService().uuid,
                                       config: m.route}, [
                                           keepService().service_host,
                                           ':',
                                           keepService().service_port,
                                       ]),
                                ]);
                            }),
                        ]),
                    ]),
                    m('.col-md-4', [
                        !vm.nodes() ? '' : m('ul', [
                            '' + vm.nodes().length + ' worker nodes',
                            vm.nodes().filter(function(node) {
                                return node().crunch_worker_state != 'down';
                            }).map(function(node) {
                                return m('li', [
                                    m('span.label.label-default', [
                                        node().crunch_worker_state,
                                    ]),
                                    ' ',
                                    m('a', {href: '/show/'+node().uuid,
                                            config: m.route},
                                      node().hostname),
                                    ' ',
                                    m('span.label.label-info', {title: 'time since last ping'}, [
                                        ((new Date() - Date.parse(node().last_ping_at))/1000).toFixed(),
                                        's'
                                    ]),
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
        vm.widgets = [];
        vm.init = function() {
            // Don't reinitialize when reused.
        };
        vm.addConnection = function(apiPrefix) {
            vm.widgets.push(new ArvBsApistatus(
                ArvadosConnection.make(apiPrefix), apiPrefix));
        };
        return vm;
    })();
    apidirectory.controller = function() {
        apidirectory.vm.init();
    };
    apidirectory.view = function() {
        return m('div',
                 apidirectory.vm.widgets.map(function(widget) {
                     return widget.view(widget.controller());
                 }));
    };
    return apidirectory;
}
