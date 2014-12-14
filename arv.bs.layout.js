function ArvBsLayout(components) {
    var layout = {};
    layout.controller = function() {
        layout.components = components.map(function(component) {
            return {
                controller: component.controller(),
                view: component.view
            };
        });
    };
    layout.view = function() {
        return [
            m('div.navbar.navbar-default', {role: 'navigation'}, [
                m('div.container', [
                    m('div.navbar-header', [
                        m('button.navbar-toggle.collapsed',
                          {'data-toggle': 'collapse', 'data-target': '#navbar'},
                          [0,0,0].map(function() {
                              return m('span.icon-bar');
                          })),
                        m('a.navbar-brand', {href: '#'}, 'Arvados::Backstage'),
                    ]),
                    m('div#navbar.navbar-collapse.collapse', [
                        m('ul.nav.navbar-nav', [
                            m('li.active', [
                                m('a', {href: '#'}, 'Sites'),
                            ]),
                        ]),
                    ]),
                ]),
            ]),
            m('div.container-fluid', layout.components.map(function(component) {
                return component.view(component.controller);
            })),
        ];
    };
    return layout;
}
