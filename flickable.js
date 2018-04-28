(function(exports) {
  var Flickable = function() {
    this.init.apply(this, arguments);
  };

  // global variable
  var supportTouch = 'ontouchend' in document;

  var EVENT_POINT_START = (supportTouch) ? 'touchstart' : 'mousedown';
  var EVENT_POINT_MOVE  = (supportTouch) ? 'touchmove'  : 'mousemove';
  var EVENT_POINT_END   = (supportTouch) ? 'touchend'   : 'mouseup';

  // 本体
  Flickable.prototype = {

    init: function(element, options) {

      this._listener = [];
      // メンバ変数
      this.element = element; // click した要素
      this.index = 0;
      this.starting = false; // 動いているかどうか
      this.firstFinger = null; // 最初にタッチした指
      
      this.direction = options.direction || 'any'; // どっち方向にフリックするか('vertical', 'horizontal', 'any')
      this.threshold = options.threshold || 5;
      this.distance = options.distance || 5;

      this.reset();

      // start
      this.element.addEventListener(EVENT_POINT_START, function(e) {
        this._onstart(e);
      }.bind(this));
      
      // move
      this.element.addEventListener(EVENT_POINT_MOVE, function(e) {
        this._onmove(e);
      }.bind(this));

    
      // END
      this.element.addEventListener(EVENT_POINT_END, function(e) {
        this._onend(e);
      }.bind(this));
      
      // マウスが要素を出た時
      this.element.addEventListener('mouseleave', function(e) {
        if (!this.starting) return ;

        // 発火
        this.fire('end', this._createEvent(e));
        this.starting = false;
      }.bind(this));
      
      // ドラッグ時の挙動は常にキャンセル
      this.element.addEventListener('dragstart', function(e) {
        e.preventDefault();
      });

      // PCだった場合には、クリックイベント
      if (!supportTouch) {
        this.element.addEventListener('click', function(e) {
          if (this.dx !== 0 || this.dy !== 0) {
            e.preventDefault();
            e.stopPropagation();
          }
        }.bind(this), true);
      }
      return this;
    },

    reset: function() {
      // 初期位置
      this.sx = this.sy = 0;
      // 現在地
      this.x = this.y = 0;
      // 移動値
      this.dx = this.dy = 0;
      // トータルの移動値
      this.mx = this.my = 0;
      // 前の値
      this.px = this.py = 0;
    },

    update: function(x, y) {
      // 現在地
      this.x = x;
      this.y = y;

      // 前フレームからの移動量
      this.dx = x - this.px;
      this.dy = y - this.py;
      
      // 移動量
      this.mx = x - this.sx;
      this.my = y - this.sy;

      // 更新
      this.px = x;
      this.py = y;
    },

    setIndex: function(index) {
      var max = this.element.scrollWidth / this.element.clientWidth;
      index = Math.min(index, max);
      index = Math.max(index, 0);
      this.index = index;

      this.fire('index');
    },

    _onstart: function(e) {
      if (this.starting) return ;
      this.starting = true;

      this.reset();

      var p = this.toPoint(e);

      // 現在地
      this.x = p.clientX;
      this.y = p.clientY;

      // 現在地をスタート地点として設定
      this.sx = this.x;
      this.sy = this.y;
      
      // 現在地を前の移動地として設定
      this.px = this.x;
      this.py = this.y;

      // 発火。
      this.fire('start', this._createEvent(e));
    },

    _onmove: function(e) {
      // 動き始めていなかったら何もしない
      if (!this.starting) return;
      
      // 横方向に軸指定してる場合で縦に動きすぎたら,イベント発火させない;
      if (this.direction === 'horizon') {
        if (Math.abs(this.dx) < Math.abs(this.dy)) {
          // dx = dy = 0;
          return ;
        }
      }

      // 縦方向に軸指定してる場合で横に動きすぎたら,イベント発火させない
      if (this.direction === 'vertical') {
        if (Math.abs(this.dy) < Math.abs(this.dx)) {
          // dx = dy = 0;
          return ;
        }
      }
      
      // 動かしている指の中に、最初にタッチした指がなかったら何もしない
      var p = this.toPoint(e);
      if (!p) return ;

      this.update(p.clientX, p.clientY);
      
      // 発火
      if (this.getDistance() > this.distance) {
        this.fire('move', this._createEvent(e));
      }
    },

    _onend: function(e) {
      // 離された指が最初にタッチされた指だった時だけ end イベント
      var p = this.toPoint(e);
      if (!p) return ;

      // スライド判定
      var widthThreshold = this.element.clientWidth/this.threshold;
      var dx = this.sx - this.x;
      if (widthThreshold < Math.abs(dx)) {
        this.fire('flick', this._createEvent(e));
        if (this.x > this.sx) {
          this.setIndex(this.index-1);
        }
        else {
          this.setIndex(this.index+1);
        }
      }
      else {
        this.setIndex(this.index);
      }
    
      // 発火
      this.fire('end', this._createEvent(e));
      
      // 終了フラグをオンにする。
      this.starting = false;
      this.firstFinger = null;
    },

    // イベント作成用
    _createEvent: function(e) {
      return {
        event: e,
        currentTarget: e.currentTarget,
        x: this.x, // 現在地
        y: this.y,
        sx: this.sx, // スタート地点
        sy: this.sy,
        dx: this.dx, // 移動量
        dy: this.dy,
      }
    },

    toPoint: function(e) {
      var touches = e.changedTouches;
      // SP
      if (touches) {
        if (!this.firstFinger) {
          return this.firstFinger = touches[0];
        }
        else {
          return Array.prototype.find.call(touches, function(touch) {
            return touch.identifier === this.firstFinger.identifier;
          }.bind(this));
        }
      }
      // PC
      else {
        return e;
      }
    },

    getDistance: function() {
      return Math.abs(this.mx);
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


  exports.flickable = function(element, options) {
    return new Flickable(element, options);
  };


})(window);