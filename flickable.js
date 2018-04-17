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
    return e.clientX;
  };

  var pointY = function(e) {
    return e.clientY;
  };

  // 最初にタッチした指を検知する
  var getFirstFinger = function(touches, firstFinger) {
    if (!firstFinger) return;
    return Array.prototype.find.call(touches, function(touch) {
      return touch.identifier === firstFinger.identifier;
    });
  };
  

  // 本体
  Flickable.prototype = {

    init: function(args) {

      this._listener = [];
      // メンバ変数
      this.elm = args[0]; // click した要素
      this.starting; // 動いているかどうか

      this.dx = 0; // x座標の移動量
      this.dy = 0; // y座標の移動量
      this.sx = 0; // 最初のx地点
      this.sy = 0; // 最初のy地点
      
      this.direction = args[1] || 'any'; // どっち方向にフリックするか('vertical', 'horizontal', 'any')
      
      this.firstFinger = null; // 最初にタッチした指

      if (!args[0]) {
        // エラー処理
      }

      // start
      this.elm.addEventListener(EVENT_POINT_START, function(e) {
        if (this.starting) return ;

        this.starting = true;
        this.dx = this.dy = 0;

        var point = e;

        // タッチだった場合は最初にタッチした指を取得
        if (supportTouch) {
          this.firstFinger = e.changedTouches[0];
          point = this.firstFinger;
        }
      
        this.sx = pointX(point);
        this.sy = pointY(point);

        this.fire('start', {
          event: e,
          currentTarget: e.currentTarget,
          sx: this.sx,
          sy: this.sy,
        });

      }.bind(this));
      
      // move
      this.elm.addEventListener(EVENT_POINT_MOVE, function(e) {
        // 動き始めていなかったら何もしない
        if (!this.starting) return;
        
        // 横方向に軸指定してる場合で縦に動きすぎたら,イベント発火させない;
        if (this.direction === 'horizon') {
          if (Math.abs(dx) < Math.abs(dy)) {
            // dx = dy = 0;
            return ;
          }
        }

        // 縦方向に軸指定してる場合で横に動きすぎたら,イベント発火させない
        if (this.direction === 'vertical') {
          if (Math.abs(dy) < Math.abs(dx)) {
            // dx = dy = 0;
            return ;
          }
        }
        

        var point = e;

        // 動かしている指の中に、最初にタッチした指がなかったら何もしない。
        if (supportTouch) {
          point = getFirstFinger(e.changedTouches, this.firstFinger);
          if (!point) {
            return;
          }
        }

        // 動いた移動量
        this.dx = pointX(point) - this.sx;
        this.dy = pointY(point) - this.sy;

        this.fire('move',{
          event: e,
          currentTarget: e.currentTarget,
          sx: this.sx,
          sy: this.sy,
          dx: this.dx,
          dy: this.dy,
        });
      }.bind(this));

      // END
      this.elm.addEventListener(EVENT_POINT_END, function(e) {
        

        // 離された指が最初にタッチされた指だった時だけ end イベント
        if (supportTouch) {
          var t = getFirstFinger(e.changedTouches, this.firstFinger);
          if (!t) return;
        }

        this.fire('end', {
          event: e,
          currentTarget: event.currentTarget,
          sx: this.sx,
          sy: this.sy,
          dx: this.dx,
          dy: this.dy,
        });
        
        this.starting = false;
        
      }.bind(this));

      
      // マウスが要素を出た時
      this.elm.addEventListener('mouseleave', function(e) {
        this.fire('end', {
          event: e,
          currentTarget: event.currentTarget,
          sx: this.sx,
          sy: this.sy,
          dx: this.dx,
          dy: this.dy,
        });
        this.starting = false;


      }.bind(this));
      
      // ドラッグ時の挙動は常にキャンセル
      this.elm.addEventListener('dragstart', function(e) {
        e.preventDefault();
      });

      // PCだった場合には、クリックイベント
      if (!supportTouch) {
        this.elm.addEventListener('click', function(e) {
          if (this.dx !== 0 || this.dy !== 0) {
            e.preventDefault();
            e.stopPropagation();
          }
        }.bind(this), true);
      }
      return this;
    },

    // on, off, one, fire
    on: function(type, func) {
      if (!this._listener[type]) this._listener[type] = [];
      this._listener[type].push(func);

      return this;
    },
    one: function(type, func) {
      var temp = function() {
        func.apply(this, arguments);
        this.off(type, temp);
      }.bind(this);
      
      this.on(type, temp);
      
      return this;
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