function ArvadosClient(apiPrefix) {
    var client = this;
    client.discoveryDoc = m.prop();
    client.state = m.prop('loading');
    m.request({
        background: true,
        method: 'GET',
        url: 'https://' + apiPrefix + '.arvadosapi.com/discovery/v1/apis/arvados/v1/rest'
    }).
        then(client.discoveryDoc, function(err){client.state('error: '+err)}).
        then(setupModels).
        then(m.redraw);

    function ArvadosResource(resourceName) {
        var resourceClass = function() {
            var model = this;
        };
        resourceClass.resourceName = resourceName;
        resourceClass.addAction = function(action, method) {
            resourceClass.prototype[action] = function(data) {
                var path = method.path.replace(/{(.*?)}/, function(_, key) {
                    var val = data[key];
                    delete data[key];
                    return encodeURIComponent(val);
                });
                // console.log(['Perform action', action, method, 'on', this, ':', method.httpMethod, path, data]);
            };
            // console.log(['Added action', action, method]);
        };
        // console.log('Created resource '+resourceName);
        return resourceClass;
    }

    function setupModels(x) {
        var resources = client.discoveryDoc().resources;
        Object.keys(resources).map(function(ctrl) {
            var resourceClass = new ArvadosResource(ctrl);
            var methods = resources[ctrl].methods;
            Object.keys(methods).map(function(action) {
                resourceClass.addAction(action, methods[action]);
            });
        });
        client.state('ready');
    }
}
