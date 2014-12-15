var util = {};
// util.choose('a', {a: 'A', b: 'B'}) --> return 'A'
// util.choose('a', {a: [console.log, 'foo']}) --> return console.log('foo')
util.choose = function(key, options) {
    var option = options[key];
    if (option instanceof Array && option[0] instanceof Function)
        return option[0].apply(this, option.slice(1));
    else
        return option;
};
