var ArvBsShow = function() {
    var show = {};
    show.vm = (function() {
        var vm = {};
        vm.connection = null;
        vm.model = null;
        vm.uuid = null;
        vm.init = function(uuid) {
            vm.uuid = uuid;
            vm.connection = ArvadosConnection.make(uuid.slice(0,5));
            vm.model = vm.connection.find(uuid);
        };
        return vm;
    })();
    show.controller = function() {
        show.vm.init(m.route.param('uuid'));
    };
    show.view = function() {
        return [
            m('.row', [m('.col-sm-12', show.vm.uuid)]),
            Object.keys(show.vm.model() || {}).map(function(key) {
                return m('.row', [
                    m('.col-sm-2.lighten', key),
                    m('.col-sm-10', show.vm.model()[key]),
                ]);
            }),
        ];
    };
    return show;
};
