'use strict';

function Shaco (options) {
  this.$el = document.querySelector(options.el); // 元素节点
  this.$data = options.data; // 需要劫持的数据
  this.$save = []; // 模板解析 {node, value, text} 
  // 数据劫持
  observe(this.$data, this);
  // 模板解析
  this.$compile = new Compile(this.$el, this);
}

// 数据劫持
function Observer (data, vm) {
  this.init(data, vm);
}

Observer.prototype = {
  init: function (data, vm) {
    Object.keys(data).forEach(function (val) {
      var key = val;
      var val = data[key];
      observe(val, vm);
      Object.defineProperty(data, key, {
        enumerable: true,
        configurable: false,
        get: function () {
          return val;
        },
        set: function (newVal) {
          if (newVal === val) {
            return;
          }
          var oldData = JSON.parse(JSON.stringify(vm.$data));
          val = newVal;
          
          observe(val, vm);
          updater.updateText(vm, oldData);
        }
      });
    })
  }
};

function observe (data, vm) {
  if (typeof data !== 'object') {
    return;
  }
  return new Observer(data, vm);
}

// 解析
function Compile (el, vm) {
  this.compile(el, vm);
}

Compile.prototype = {
  compile: function (node, vm) {
    var that = this;
    var childNodes = node.childNodes;
    
    [].slice.call(childNodes).forEach(function(node){
      if (that.isElement(node)) {
        that.compile(node, vm);
        return;
      } else if (that.isText(node)) {
        that.compileText(node, vm)
      }
    });
  },
  compileText: function (node, vm) {
    var reg = /\{\{(.*?)\}\}/g;
    node.nodeValue = node.nodeValue.replace(reg, function (match, p1) {
      vm.$save.push({node, value: p1, text: node.nodeValue}); // 压入含有变量的节点
      return eval('vm.$data.' + p1);
    })
  },
  isElement: function (node) {
    return node.nodeType === 1;
  },
  isText: function (node) {
    return node.nodeType === 3;
  }
};

var updater = {
  updateText: function (vm, oldData) {
    var newData = vm.$data;
    var save = vm.$save;
    for (var i = 0; i < vm.$save.length; i++) {
      var value = save[i].value;
      var node = save[i].node;
      var text = save[i].text;
      if (eval('newData.' + value + '!==' + 'oldData.' + value)) {
        var reg = /\{\{(.*?)\}\}/g;
        node.nodeValue = text.replace(reg, function (match, p1) {
          return eval('vm.$data.' + p1);
        })
      }
    }
  }
};