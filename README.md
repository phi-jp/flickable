# flickable
enable flick library for js



## HOW TO USE
```
var flick = new Flickable(elem, direction) // direction -> 'vertical' or 'horizon'

flick.on('start', function(e) {
  // e.sx, e.sy
})
flick.on('move', function(e) {
  // e.sx, e.sy
  // e.dx, e.dy
})
flick.on('end', function(e) {})

```