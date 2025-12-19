(() => {
  if (CanvasRenderingContext2D.prototype.unscaledStroke) return;

  CanvasRenderingContext2D.prototype.unscaledStroke = function (thickness = 1) {
    const ctx = this;
    const m = ctx.getTransform();

    const scale = Math.sqrt(Math.sqrt(
      (m.a * m.a + m.b * m.b) *
      (m.c * m.c + m.d * m.d)
    )) || 1;

    ctx.save();

    ctx.lineWidth = thickness / scale;

    const dash = ctx.getLineDash();
    if (dash.length) ctx.setLineDash(dash.map(v => v / scale));
    ctx.lineDashOffset = ctx.lineDashOffset / scale;

    ctx.stroke();
    ctx.restore();
  };
})();

//Canvas extensions from MJS
(() => {
  if (CanvasRenderingContext2D.prototype.polygon) return;

  CanvasRenderingContext2D.prototype.polygon = function (x,y,r,n=5,t=0){
    var m = t+Math.PI*2;
    var px = x - r * Math.sin(t);
    var py = y - r * Math.cos(t);
    this.beginPath();
    this.moveTo(px,py);
    while (t<m){
        px = x - r * Math.sin(t);
        py = y - r * Math.cos(t);
        t += Math.PI*2 / n;
        this.lineTo(px,py);
    }
    this.closePath();
  };
})();

(() => {
  if (CanvasRenderingContext2D.prototype.star) return;

  CanvasRenderingContext2D.prototype.star = function (x,y,r,ratio=0.5,n=5,t=0){
    var m = t + Math.PI * 2;
    var px = x - r * Math.sin(t);
    var py = y - r * Math.cos(t);
    var dt = Math.PI / n;
    this.beginPath();
    this.moveTo(px, py);
    t += dt ;
    px = x - ratio * r * Math.sin(t);
    py = y - ratio * r * Math.cos(t);
    t += dt;
    this.lineTo(px, py);
    while (t < m) {
        px = x - r * Math.sin(t);
        py = y - r * Math.cos(t);
        this.lineTo(px, py);
        t += dt;
        px = x - ratio * r * Math.sin(t);
        py = y - ratio * r * Math.cos(t);
        this.lineTo(px, py);
        t += dt;
    }
    this.closePath();
  };
})();


function inpel(index=0) {
    return jslab_get_text_input(jslab_main.children[index]);
}

function outel(index=0) {
    return jslab_get_output_div(jslab_main.children[index]);
}

function inp(index=0) {
    return jslab_get_text_input(jslab_main.children[index]).value;
}

function out(index=0) {
    var d = jslab_get_output_div(jslab_main.children[index]);
    if (d.childElementCount) {
        return d.children[0];
    } else {
        return d.innerHTML;
    }
}

function id(i) {
    return document.getElementById(id);
}

function makeElement(tagname="div",className="",id="") {
  const e = document.createElement(tagname);
  e.className=className;
  e.id=id;
  return e;
}

function makeCanvas(width = floor(inpel().getBoundingClientRect().width) , height=256, {id = "", className="", update=a=>a}={}) {
  const c = makeElement("canvas",className,id);
  c.width=width;
  c.height=height;
  c.ctx=c.getContext("2d");
  c.update=update;
  function updater() {
    c.update(c);
    requestAnimationFrame(updater);
  };
  updater()
  return c;
}

function plotFunction(fn=a=>a,canvas=makeCanvas(),{
    center:{x:centerX=0,y:centerY=0}={},
    yRange=2,
    xRange=(yRange*canvas.width/canvas.height),
    showAxes=true,
    axesStyle="#8008",
    axesThickness=2,
    plotStyle="#000a",
    plotThickness=3,
    clearFirst=true
  }={}) {
    const ctx = canvas.ctx;
    ctx.save()
    if (clearFirst) {
        ctx.clearRect(0,0,canvas.width,canvas.height)
    }
    const xScale = (canvas.width-plotThickness)/xRange;
    const yScale = (canvas.height-plotThickness)/yRange;

    ctx.translate(canvas.width/2,canvas.height/2)
    ctx.scale(xScale,-yScale)
    ctx.translate(-centerX,-centerY)

    if (showAxes==true) {
        ctx.strokeStyle=axesStyle;
        ctx.beginPath();
        ctx.moveTo(0,centerY-yRange/2);
        ctx.lineTo(0,centerY+yRange/2);
        ctx.moveTo(centerX-xRange/2,0);
        ctx.lineTo(centerX+xRange/2,0);        
        ctx.unscaledStroke(axesThickness)
    }

    ctx.strokeStyle=plotStyle;

    ctx.beginPath();
    const stepSize = xRange/canvas.width;

    for (let tx = centerX-xRange; tx<centerX+xRange; tx+=stepSize) {
        let ty= fn(tx);
        ctx.lineTo(tx,ty)
    }
    ctx.unscaledStroke(plotThickness);

    ctx.restore();
    return canvas;
}
