function ArvadosClient(apiPrefix) {
    var client = this;
    client.discoveryDoc = m.prop();
    client.state = m.prop('loading');
    client.token = token;
    client.loginLink = loginLink;

    // Initialize

    client.ready = m.request({
        background: true,
        method: 'GET',
        url: 'https://' + apiPrefix + '.arvadosapi.com/discovery/v1/apis/arvados/v1/rest'
    });
    client.ready.
        then(client.discoveryDoc).
        then(setupModelClasses).
        then(m.redraw, function(err){client.state('error: '+err); m.redraw();});

    // Public methods

    function loginLink() {
        var dd = client.discoveryDoc();
        if (!dd) return null;
        return dd.rootUrl + 'login?return_to=' + encodeURIComponent(
            (location.origin + '/?/login-callback?apiPrefix=' + apiPrefix +
             '&return_to=' + encodeURIComponent(m.route())));
    }

    // Private methods

    function token(newToken) {
        var tokens;
        try {
            tokens = JSON.parse(window.localStorage.tokens);
        } catch(e) {
            tokens = {};
        }
        if (arguments.length === 0) {
            return tokens[apiPrefix];
        } else {
            tokens[apiPrefix] = newToken;
            window.localStorage.tokens = JSON.stringify(tokens);
            return newToken;
        }
    }

    function ModelClass(resourceName) {
        var resourceClass = function() {
            var model = this;
        };
        resourceClass.resourceName = resourceName;
        resourceClass.addAction = function(action, method) {
            resourceClass[action] = function(data) {
                var dd = client.discoveryDoc();
                var path = method.path.replace(/{(.*?)}/, function(_, key) {
                    var val = data[key];
                    delete data[key];
                    return encodeURIComponent(val);
                });
                path = dd.rootUrl + dd.servicePath + path;
                data = data || {};
                // console.log(['Perform action', action, method, 'on', this, ':', method.httpMethod, path, data]);
                return request({
                    method: method.httpMethod,
                    url: path
                });
            };
            // console.log(['Added action', action, method]);
        };
        // console.log('Created resource '+resourceName);
        return resourceClass;
    }

    function request(args) {
        args.config = function(xhr) {
            xhr.setRequestHeader('Authorization', 'OAuth2 '+client.token());
        };
        return m.request(args);
    }

    function setupModelClasses(x) {
        var schemas = client.discoveryDoc().schemas;
        Object.keys(schemas).map(function(modelClassName) {
            if (modelClassName.search(/List$/) > -1) return;
            var modelClass = new ModelClass(modelClassName);
            modelClass.schema = schemas[modelClassName];
            client[modelClassName] = modelClass;
        });
        var resources = client.discoveryDoc().resources;
        Object.keys(resources).map(function(ctrl) {
            var modelClassName;
            var methods = resources[ctrl].methods;
            try {
                modelClassName = resources[ctrl].methods.get.response.$ref;
            } catch(e) {
                console.log("Hm, could not handle resource '"+ctrl+"'");
                return;
            }
            if (!client[modelClassName]) {
                console.log("Hm, no schema for response type '"+ctrl+"'");
                return;
            }
            Object.keys(methods).map(function(action) {
                client[modelClassName].addAction(action, methods[action]);
            });
        });
        client.state('ready');
    }
}
