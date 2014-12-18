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
    var dd = m.prop();
    connection.discoveryDoc = dd;
    connection.state = m.prop('loading');
    connection.api = api;
    connection.find = find;
    connection.loginLink = loginLink;
    connection.token = token;
    connection.webSocket = m.prop({});

    // Initialize

    connection.ready = m.request({
        background: true,
        method: 'GET',
        url: 'https://' + apiPrefix + '.arvadosapi.com/discovery/v1/apis/arvados/v1/rest'
    });
    connection.ready.
        then(connection.discoveryDoc).
        then(setupModelClasses).
        then(setupWebSocket).
        then(m.redraw,
             function(err){connection.state('error: '+err); m.redraw();});

    // Public methods

    // URL that will initiate the login process, pass the new token to
    // localStorage via login-callback, then return to the current
    // route.
    function loginLink() {
        if (!dd()) return null;
        return dd().rootUrl + 'login?return_to=' + encodeURIComponent(
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
                var path, postdata = {};
                params = params || {};
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
                path = dd().rootUrl + dd().servicePath + path;
                return request({
                    method: method.httpMethod,
                    url: path,
                    data: postdata,
                });
            };
        };
        resourceClass.find = function(uuid, refreshFlag) {
            if (!refreshFlag && store[uuid]) return store[uuid];
            else return api(resourceName, 'get', {uuid:uuid});
        };
        return resourceClass;
    }

    function find(uuid, refreshFlag) {
        refreshFlag = refreshFlag || !store[uuid];
        connection.ready.then(function() {
            var infix = uuid.slice(6,11);
            var className = uuidInfixClassName[infix];
            var theClass = connection[className];
            if (!theClass) {
                throw new Error("No class for "+className+" for infix "+infix);
            }
            theClass.find(uuid, refreshFlag);
        });
        store[uuid] = store[uuid] || m.prop();
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
        var items;
        if (response.items) {
            // Return an array of getters, with extra properties
            // (items_available, etc.) tacked on to the array.
            items = response.items.map(updateStore);
            Object.keys(response).map(function(key) {
                if (key !== 'items') {
                    items[key] = response[key];
                }
            });
            return items;
        } else if (response.uuid) {
            store[response.uuid] = store[response.uuid] || m.prop();
            store[response.uuid](response);
            store[response.uuid]()._cacheTime = new Date();
            return store[response.uuid];
        } else {
            return response;
        }
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

    function setupWebSocket() {
        var ws;
        if (!connection.token()) {
            // No sense trying to connect without a valid token.
            return connection.webSocket({});
        }
        ws = new WebSocket(
            dd().websocketUrl + '?api_token=' + connection.token());
        ws.startedAt = new Date();
        ws.sendJson = function(object) {
            ws.send(JSON.stringify(object));
        };
        ws.onopen = function(event) {
            // TODO: subscribe to logs about uuids in
            // connection.store, not everything.
            ws.sendJson({method:'subscribe'});
        };
        ws.onmessage = function(event) {
            var message = JSON.parse(event.data);
            var newAttrs;
            var objectProp;
            if (typeof message.object_uuid === 'string' &&
                message.event_type === 'update' &&
                message.object_uuid.slice(0,5) === apiPrefix &&
                (objectProp = store[message.object_uuid])) {
                newAttrs = message.properties.new_attributes;
                if (objectProp()) {
                    // A local copy exists. Update whatever attributes
                    // we see in the message.
                    Object.keys(newAttrs).map(function(key) {
                        objectProp()[key] = newAttrs[key];
                    });
                } else {
                    // We have a getter-setter ready for this object,
                    // but it has no content yet. TODO: make the
                    // server send a full API response, not just the
                    // database columns, with these update messages.
                    objectProp(newAttrs);
                }
                objectProp()._cacheTime = new Date();
                m.redraw();
            }
        };
        ws.onclose = function(event) {
            if (new Date() - ws.startedAt < 60000) {
                // If the last connection lasted less than 60 seconds,
                // there's probably something wrong -- it's not just
                // the expected occasional server reset or network
                // interruption -- so we should make sure to use a
                // pessimistic retry delay of at least 60 seconds, and
                // use ever-increasing delays until the connection
                // starts staying alive for more than a minute at a
                // time.
                setupWebSocket.backoff = Math.min(
                    (setupWebSocket.backoff || 30), 30) * 2 + 1;
            }
            else {
                // The last connection lasted more than a
                // minute. Let's assume this is just a brief
                // interruption and things are going well most of the
                // time: delay 5 seconds, then try again.
                setupWebSocket.backoff = 5;
            }
            console.log("Websocket closed at " + new Date() +
                        " with code=" + event.code +
                        ", retry in "+setupWebSocket.backoff+"s");
            window.setTimeout(setupWebSocket, setupWebSocket.backoff*1000);
        };
        return connection.webSocket(ws);
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
