function ArvBsLayout(components) {
    var layout = {};
    layout.vm = (function() {
        var vm = {};
        vm.components = components;
        return vm;
    })();
    layout.controller = function() {
    };
    layout.view = function() {
        return [
            m('.navbar.navbar-default', {role: 'navigation'}, [
                m('.container', [
                    m('.navbar-header', [
                        m('button.navbar-toggle.collapsed',
                          {'data-toggle': 'collapse', 'data-target': '#navbar'},
                          [0,0,0].map(function() {
                              return m('span.icon-bar');
                          })),
                        m('a.navbar-brand', {href:'/',config:m.route},
                          'Arvados::Backstage'),
                    ]),
                    m('#navbar.navbar-collapse.collapse', [
                        m('ul.nav.navbar-nav', [
                            m('li', [
                                m('a', {href:'/', config:m.route},
                                  'Dashboard'),
                            ]),
                        ]),
                    ]),
                ]),
            ]),
            m('.container-fluid', layout.vm.components.map(function(component) {
                return component.view(component.controller());
            })),
        ];
    };
    return layout;
}
