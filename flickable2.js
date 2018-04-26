(function(exports) {

  var scrollAnimate = function(element, opts) {
  };
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
      this.parentElement = args[0]; // 親要素
      this.children = this.parentElement.children; // 子要素
      this.childWidth = this.children[0].clientWidth; // 子要素の横幅
      this.index = 0;
      
      this.opts = args[1];

      this.starting; // 動いているかどうか
      
      this.x = this.y = 0; // 現在地
      this.sx = this.sy = 0; // 最初の地点
      this.dx = this.dy = 0; // 移動量
      this.prevX = this.prevY = 0; // 前フレームの地点
      this.movementX = this.movementY = 0; // 前フレームの移動量
      
      this.direction = args[1] || 'any'; // どっち方向にフリックするか('vertical', 'horizontal', 'any')
      
      this.firstFinger = null; // 最初にタッチした指


      if (!args[0]) {
        // エラー処理
      }

      var self = this;

      // 親要素のスタイリング
      this.parentElement.style.overflow = 'hidden';
      this.parentElement.style.display = 'flex';
      this.parentElement.style.height = '100%';
      
      // 子要素のスタイリング
      this._addDefaultChildStyle(this.children);
    


      // ループするために先頭の子要素と最後の子要素を複製して前後に挿入。
      var firstElement = this.children[0].cloneNode(true);
      var lastElement = this.children[this.children.length-1].cloneNode(true);
      this.parentElement.appendChild(lastElement);
      this.parentElement.insertBefore(lastElement, this.parentElement.firstChild);

      // this.parent.appendChild(document.createElement('div'));
      // start
      this.parentElement.addEventListener(EVENT_POINT_START, function(e) {
        if (this.starting) return ;

        this.starting = true;

        this.dx = this.dy = 0; // 移動量0
        this.movementX = this.movementY = 0; // 前フレームからの移動量も0
        this.currentDirection = undefined;

        var point = e;

        // タッチだった場合は最初にタッチした指を取得
        if (supportTouch) {
          this.firstFinger = e.changedTouches[0];
          point = this.firstFinger;
        }
        
        // 現在地
        this.x = pointX(point); 
        this.y = pointY(point);

        // 現在地をスタート地点として設定
        this.sx = this.x;
        this.sy = this.y;
        
        // 現在地を前の移動地として設定
        this.prevX = this.x;
        this.prevY = this.y;

        // 発火。
        // this.fire('start', this._createEvent(e));

      }.bind(this));
      
      // move
      this.parentElement.addEventListener(EVENT_POINT_MOVE, function(e) {
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
        

        var point = e;

        // 動かしている指の中に、最初にタッチした指がなかったら何もしない。
        if (supportTouch) {
          point = getFirstFinger(e.changedTouches, this.firstFinger);
          if (!point) {
            return;
          }
        }

        // 現在地
        this.x = pointX(point);
        this.y = pointY(point);
        
        // 移動量
        this.dx = pointX(point) - this.sx;
        this.dy = pointY(point) - this.sy;

        // 前フレームからの移動量
        this.movementX = this.x - this.prevX;
        this.movementY = this.y - this.prevY;
        
        // 発火
        // this.fire('move', this._createEvent(e));

        // 要素をスクロールさせる
        this.parentElement.scrollLeft -= this.movementX;


        // 更新
        this.prevX = this.x;
        this.prevY = this.y;
        
      }.bind(this));

      // // END
      this.parentElement.addEventListener(EVENT_POINT_END, function(e) {
        

        // 離された指が最初にタッチされた指だった時だけ end イベント
        if (supportTouch) {
          var t = getFirstFinger(e.changedTouches, this.firstFinger);
          if (!t) return;
        }

        if (Math.abs(this.dx) < Math.abs(this.dy)) {
          this.currentDirection = 'vertical';
        }
        
        if (Math.abs(this.dy) < Math.abs(this.dx)) {
          this.currentDirection = 'horizon';
        }
      
        // 発火
        // this.fire('end', this._createEvent(e));
        // スクロールするかどうかの判定
        var rate = this.movementX / 5;
        var baseWidth = this.parentElement.offsetWidth * 0.5; // 半分の長さ

      
        rate += this.dx / baseWidth; 
      
        if (rate >= 1) {
          this.index = Math.max(this.index - 1, 0);
        }
        else if (rate <= -1) {
          this.index = Math.min(this.index + 1, this.children.length - 1);
        }


        var duration = 256;
        var currentElement = this.children[this.index];
        
  

        // var easingLinear = function(currentTime, startValue, changeValue, duration) {
        //   return changeValue * currentTime / duration + startValue;
        // };

        var startTime = Date.now();
        function scrollTo(element, to, duration) {
            if (duration <= 0) return;

            var difference = to - element.scrollLeft;
            // var easing = easingLinear(currentTime, element.scrollLeft, 8, 512);
            var perTick = difference / duration * 10;
        
            requestAnimationFrame(function() {
                element.scrollLeft = element.scrollLeft + perTick;
                if (element.scrollLeft === to) return;
                scrollTo(element, to, duration - 10);
            });
        }
        scrollTo(this.parentElement, currentElement.offsetLeft, duration);
        
        // 終了フラグをオンにする。
        this.starting = false;
        
      }.bind(this));

      
      // マウスが要素を出た時
      this.parentElement.addEventListener('mouseleave', function(e) {
        // 発火
        this.fire('end', this._createEvent(e));
        this.starting = false;

      }.bind(this));
      
      // ドラッグ時の挙動は常にキャンセル
      this.parentElement.addEventListener('dragstart', function(e) {
        e.preventDefault();
      });

      // PCだった場合には、クリックイベント
      if (!supportTouch) {
        this.parentElement.addEventListener('click', function(e) {
          if (this.dx !== 0 || this.dy !== 0) {
            e.preventDefault();
            e.stopPropagation();
          }
        }.bind(this), true);
      }


      /*
      // 子要素を監視
      // 子要素に追加や削除があった場合、それを反映させる。
      */

      var self = this;
      var observer = new MutationObserver(function(records, ob) {
        console.log('要素に変更がありました。');
        console.log(records[0].target);
        console.log(records[0].addedNodes);
        console.log(records[0].removedNodes);
        
        // 親要素
        var target = records[0].target;

        //  子要素に変更を適用
        self._addDefaultChildStyle(target.children);

        // 追加
        self.parent = target;

      });

      observer.observe(this.parentElement, {
        childList: true // 子ノードの追加・削除の監視を指定。
      });


      return this;
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
        prevX: this.prevX, // 前フレームの位置
        prevY: this.prevY,
        movementX: this.movementX, // 前フレームからの移動量 
        movementY: this.movementY,
        direction: this.currentDirection,
      }
    },
    _addDefaultChildStyle: function(children) {
      // 子要素のスタイリング
      Array.prototype.forEach.call(children, function(child) {
        child.style.width = '100%';
        child.style.height = '100%';

        // flex fixed
        child.style['-webkit-flex-grow'] = '0';
        child.style['-moz-flex-grow'] = '0';
        child.style['flex-grow'] = '0';
        child.style['-webkit-flex-shrink'] = '0';
        child.style['-moz-flex-shrink'] = '0';
      });

    },
    //on, off, one, fire
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