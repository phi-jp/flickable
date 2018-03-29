(function(exports) {
  var Flickable = function() {
    this.init.apply(this, arguments);
  };

  // global variable
  var supportTouch = 'ontouchend' in document;

  var EVENT_POINT_START = (supportTouch) ? 'touchstart' : 'mousedown';
  var EVENT_POINT_MOVE  = (supportTouch) ? 'touchmove'  : 'mousemove';
  var EVENT_POINT_END   = (supportTouch) ? 'touchend'   : 'mouseup';

  // global function
  var pointX = function(e) {
    return e.clientX || e.clientX === 0 || e.touches[0].clientX;
  };

  var pointY = function(e) {
    return e.clientY || e.touches[0].clientY;
  };

  // 本体
  Flickable.prototype = {
    _listener: [],
    init: function(args) {

      // メンバ変数
      var elm = args[0]; // click した要素
      var starting; // 動いているかどうか

      var dx = 0; // x軸座標の移動量
      var dy = 0; // y軸座標の移動量
      var sx = 0; // 最初のx地点
      var sy = 0; // 最初のy地点

      var direction = args[1] || 'any'; // どっち方向にフリックするか('vertical', 'horizontal', 'any')
    
      if (!args[0]) {
      
      }

      
      // start
      elm.addEventListener(EVENT_POINT_START, function(e) {
        starting = true;
        dx = dy = 0;


        sx = pointX(e);
        sy = pointY(e);
        this.fire('start', {
          event: e,
          currentTarget: e.currentTarget,
          sx: sx,
          sy: sy,
        });

      }.bind(this));
      
      // move
      elm.addEventListener(EVENT_POINT_MOVE, function(e) {
        
        
        // 横方向に軸指定してる場合で縦に動きすぎたら,イベント発火させない;
        if (direction === 'horizon') {
          if (Math.abs(dx) < Math.abs(dy)) {
            // dx = dy = 0;
            return ;
          }
        }

        // 縦方向に軸指定してる場合で横に動きすぎたら,イベント発火させない
        if (direction === 'vertical') {
          if (Math.abs(dy) < Math.abs(dx)) {
            // dx = dy = 0;
            return ;
          }
        }
        // 動き始めていなかったら何もしない
        if (!starting) return;

        dx = pointX(e) - sx;
        dy = pointY(e) - sy;

        this.fire('move',{
          event: e,
          currentTarget: e.currentTarget,
          sx: sx,
          sy: sy,
          dx: dx,
          dy: dy,
        });
      }.bind(this));

      // END
      elm.addEventListener(EVENT_POINT_END, function(e) {
        


        // for(item in e.changedTouches) {
        //   console.log(item.item);
        // };
        this.fire('end', {
          event: e,
          currentTarget: event.currentTarget,
          sx: sx,
          sy: sy,
          dx: dx,
          dy: dy,
        });
        starting = false;
        
      }.bind(this));
      

      // PCだった場合には、クリックイベントを発火させる
      if (!supportTouch) {
        elm.addEventListener('click', function(e) {
          if (dx !== 0 || dy !== 0) {
            e.preventDefault();
            e.stopPropagation();
          }
        }.bind(this), true);
      }

      elm.addEventListener('mouseleave', function() {
        starting = false;
      });

      elm.addEventListener('dragstart', function(e) {
        e.preventDefault();
      });

      return this;
    },

    // on, off, one, fire
    on: function(type, func) {
      if (!this._listener[type]) this._listener[type] = [];
      this._listener[type].push(func);

      return this;
    },
    one: function(type, func) {
      
    }, 
    off: function(type, func) {
      if (!this._listener[type]) return;
      var i = this._listener.indexOf(func);
      if (i !== -1) {
        this._listener.splice(id, 1);
      }
      return this;
    },
    fire: function(type, args) {
      if (!this._listener[type]) return this;
      
      this._listener[type].forEach(function(func) {
        func.call(this, args);
      }.bind(this)); 
    },

  };


  exports.flickable = function() {
    return new Flickable(arguments);
  };


})(window);