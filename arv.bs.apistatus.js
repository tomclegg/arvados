var ArvBsApistatus = function(client, apiPrefix) {
    var apistatus = {};
    apistatus.vm = {
    };
    apistatus.controller = function() {
    };
    apistatus.view = function() {
        var dd = client.discoveryDoc();
        var show = !dd ? {} : {
            apiVersion: dd.version + ' (' + dd.revision + ')',
            sourceVersion: m('a', {
                href: 'https://arvados.org/projects/arvados/repository/changes?rev=' + dd.source_version
            }, dd.source_version),
            generatedAt: dd.generatedAt
        };
        var content = !dd ? client.state() : Object.keys(show).map(function(key) {
            return m('div.row', [
                m('div.col-sm-4.lighten', key),
                m('div.col-sm-8', show[key]),
            ]);
        });
        return m('div.panel.panel-info.arv-bs-api-status', [
            m('div.panel-heading', apiPrefix),
            m('div.panel-body', content),
        ]);
    };
    return apistatus;
};

var ArvBsApidirectory = function() {
    var apidirectory = {};
    apidirectory.vm = {
        clients: [],
        addClient: function(apiPrefix) {
            apidirectory.vm.clients.push(
                new ArvBsApistatus(
                    new ArvadosClient(apiPrefix), apiPrefix));
        }
    };
    apidirectory.controller = function() {};
    apidirectory.view = function() {
        return m('div', {style: 'width: 400px; display: inline-block'},
                 apidirectory.vm.clients.map(function(client) {
                     return client.view();
                 }));
    };
    return apidirectory;
}
