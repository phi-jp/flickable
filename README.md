# flickable
enable flick library for js



## HOW TO USE

```
var flick = new Flickable(elem, direction) // direction -> 'vertical' or 'horizon'

flick.on('start', function(e) {
});
flick.on('move', function(e) {
  // e.x, e.y   // Current position
  // e.sx, e.sy // Start position
  // e.dx, e.dy // Diffrence of start position
  // e.prevX, e.prevY // Previous frame position
  // e.movementX, e.movementY  // diffrence of Previous frame position
});
flick.on('end', function(e) {});

```