// Data service backed by Arvados.
//
// c = new ArvadosConnection('xyzzy'); // connect to xyzzy.arvadosapi.com
// c.token('asdfasdf'); // set token
// c.state(); // 'loading'
// c.ready.then(function() { c.state() }); // 'ready'
//
// // This part needs a better API:
// nodelist = m.prop();
// c.ready.then(function() { c.Node.list().then(nodelist) });
//
// // Better?
// nodelist = m.deferred();
// nodelist = c.api('nodes.list', {filters: []}, nodelist);
// nodelist(); // undefined
// nodelist.then(function() { nodelist(); }); // [{uuid:...},...]

function ArvadosConnection(apiPrefix) {
    var connection = this;
    connection.discoveryDoc = m.prop();
    connection.state = m.prop('loading');
    connection.api = api;
    connection.find = find;
    connection.loginLink = loginLink;
    connection.token = token;

    // Initialize

    connection.ready = m.request({
        background: true,
        method: 'GET',
        url: 'https://' + apiPrefix + '.arvadosapi.com/discovery/v1/apis/arvados/v1/rest'
    });
    connection.ready.
        then(connection.discoveryDoc).
        then(setupModelClasses).
        then(m.redraw,
             function(err){connection.state('error: '+err); m.redraw();});

    // Public methods

    // URL that will initiate the login process, pass the new token to
    // localStorage via login-callback, then return to the current
    // route.
    function loginLink() {
        var dd = connection.discoveryDoc();
        if (!dd) return null;
        return dd.rootUrl + 'login?return_to=' + encodeURIComponent(
            (location.origin + '/?/login-callback?apiPrefix=' + apiPrefix +
             '&return_to=' + encodeURIComponent(m.route())));
    }

    // getter-setter, backed by localStorage. Currently supports only
    // one connection per apiPrefix.
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

    // Wait for discovery doc if necessary, then perform API call and
    // resolve the returned promise.
    //
    // modelClass: 'Collection', 'Node', etc.
    // action: 'get', 'list', 'update', etc.
    // params: {uuid:'foo',filters:[],...}
    // deferred (optional): deferred object for response. If not
    // supplied, a new one is created.
    function api(modelClass, action, params, deferred) {
        deferred = deferred || m.deferred();
        connection.ready.then(function() {
            connection[modelClass][action](params).
                then(updateStore).
                then(deferred.resolve, deferred.reject).
                then(m.redraw);
        }, deferred.reject);
        return deferred.promise;
    }

    // Private instance variables

    var store = {};
    var uuidInfixClassName = {};

    // Private methods

    function ModelClass(resourceName) {
        var resourceClass = function() {
            var model = this;
        };
        resourceClass.resourceName = resourceName;
        resourceClass.addAction = function(action, method) {
            resourceClass[action] = function(params) {
                var path, dd, postdata = {};
                params = params || {};
                dd = connection.discoveryDoc();
                Object.keys(params).map(function(key) {
                    if (params[key] instanceof Object)
                        postdata[key] = JSON.stringify(params[key]);
                    else
                        postdata[key] = params[key];
                });
                path = method.path.replace(/{(.*?)}/, function(_, key) {
                    var val = postdata[key];
                    delete postdata[key];
                    return encodeURIComponent(val);
                });
                path = dd.rootUrl + dd.servicePath + path;
                return request({
                    method: method.httpMethod,
                    url: path,
                    data: postdata,
                });
            };
        };
        resourceClass.find = function(uuid) {
            if (store[uuid]) return store[uuid];
            else return api(resourceName, 'get', {uuid:uuid});
        };
        return resourceClass;
    }

    function find(uuid) {
        if (!store[uuid]) store[uuid] = m.prop();
        connection.ready.then(function() {
            var infix = uuid.slice(6,11);
            var className = uuidInfixClassName[infix];
            var theClass = connection[className];
            if (!theClass) {
                throw new Error("No class for "+className+" for infix "+infix);
            }
            return theClass.find(uuid);
        });
        return store[uuid];
    }

    function request(args) {
        args.config = function(xhr) {
            xhr.setRequestHeader('Authorization', 'OAuth2 '+connection.token());
        };
        return m.request(args);
    }

    // Update local cache with data just received in API response.
    function updateStore(response) {
        if (response.items) {
            response.items.map(updateStore);
        } else if (response.uuid) {
            store[response.uuid] = store[response.uuid] || m.prop();
            store[response.uuid](response);
        }
        return response;
    }

    function setupModelClasses(x) {
        var schemas = connection.discoveryDoc().schemas;
        Object.keys(schemas).map(function(modelClassName) {
            if (modelClassName.search(/List$/) > -1) return;
            var modelClass = new ModelClass(modelClassName);
            modelClass.schema = schemas[modelClassName];
            connection[modelClassName] = modelClass;
            uuidInfixClassName[schemas[modelClassName].uuidPrefix] = modelClassName;
        });
        var resources = connection.discoveryDoc().resources;
        Object.keys(resources).map(function(ctrl) {
            var modelClassName;
            var methods = resources[ctrl].methods;
            try {
                modelClassName = resources[ctrl].methods.get.response.$ref;
            } catch(e) {
                console.log("Hm, could not handle resource '"+ctrl+"'");
                return;
            }
            if (!connection[modelClassName]) {
                console.log("Hm, no schema for response type '"+ctrl+"'");
                return;
            }
            Object.keys(methods).map(function(action) {
                connection[modelClassName].addAction(action, methods[action]);
            });
        });
        connection.state('ready');
    }
}
ArvadosConnection.connections = {};
ArvadosConnection.make = function(connectionId, apiPrefix) {
    var conns = ArvadosConnection.connections;
    apiPrefix = apiPrefix || connectionId;
    if (!conns[connectionId]) {
        conns[connectionId] = new ArvadosConnection(apiPrefix);
    }
    return conns[connectionId];
}
