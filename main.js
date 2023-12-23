//GLOBAL VARIABLES

let canvas;
let ctx;


//OBJECTS

let camera = {x: 0, y: 0, z: -10, fov: 50, p: 0, y: 0};


//CLASSES

class Tri
{
  constructor(v1,v2,v3,col)
  {
    this.a = v1;
    this.b = v2;
    this.c = v3;
    this.color = col;
  }

  normal()
  {
    let v1 = this.b.sub(this.a);
    let v2 = this.c.sub(this.a);

    let n = v1.cross(v2);
    return n.normalize();
  }

  facing()
  {
    let cam = new Vector3(camera.x,camera.y,camera.z);

    let n = this.normal();
    let vc = cam.sub(this.a);
    let d = n.dot(vc);

    return d > 0;
  }
}

class Mesh
{
  constructor(tris)
  {
    this.tris = tris;
  }

  draw()
  {
    this.tris.forEach(e=>
    {
      if (!e.facing()) draw(e);
    })
  }

  rotate(ax,ay)
  {
    let rtris = [];

    //find center
    let cx = 0;
    let cy = 0;
    let cz = 0;
    this.tris.forEach(e=>
    {
      cx += (e.a.x + e.b.x + e.c.x);
      cy += (e.a.y + e.b.y + e.c.y);
      cz += (e.a.z + e.b.z + e.c.z);
    })
    cx = cx / (this.tris.length * 3);
    cy = cy / (this.tris.length * 3);
    cz = cz / (this.tris.length * 3);

    let center = {x: cx, y: cy, z: cz};

    this.tris.forEach(e=>
    {
      rtris.push(rotate(e,ax,ay,center));
    })
    this.tris = rtris;
  }
}

class Vector3
{
  constructor(x,y,z)
  {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  add(v)
  {
    return new Vector3(
      this.x + v.x,
      this.y + v.y,
      this.z + v.z
    )
  }

  sub(v)
  {
    return new Vector3(
      this.x - v.x,
      this.y - v.y,
      this.z - v.z
    )
  }

  cross(v)
  {
    return new Vector3(
      this.y * v.z - this.z * v.y,
      this.z * v.x - this.x * v.z,
      this.x * v.y - this.y * v.x,
    )
  }

  dot(v)
  {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  normalize()
  {
    let m = Math.sqrt(this.x ** 2 + this.y ** 2 + this.z ** 2);

      return new Vector3(
        this.x / m,
        this.y / m,
        this.z / m,
      )
  }
}

//FUNCTIONS

function init()
{
  canvas = document.createElement('canvas');
  canvas.width = 500;
  canvas.height = 500;
  canvas.style.border = '1px solid white';
  ctx = canvas.getContext('2d');
  document.body.appendChild(canvas);
}

function project(point)
{
  let d = camera.z - point.z;
  let s = camera.fov / d;
  let nx = canvas.width / 2 - point.x * s;
  let ny = canvas.height / 2 + point.y * s;

  return {x: nx, y: ny};
}

//put this in Tri()
function rotate(t,ax,ay,center)
{
  let x = ax * (180 / Math.PI);
  let y = ay * (180 / Math.PI);

  const cosX = Math.cos(x);
  const sinX = Math.sin(x);
  const cosY = Math.cos(y);
  const sinY = Math.sin(y);

  let nt = [];

  Object.values(t).forEach(p =>
  {
    //translate to center
    let point = {x: p.x - center.x, y: p.y - center.y, z: p.z - center.z};

    // Rotate around X-axis
    const y1 = point.y * cosX - point.z * sinX;
    const z1 = point.y * sinX + point.z * cosX;

    // Rotate around Y-axis
    const x2 = point.x * cosY + z1 * sinY;
    const z2 = -point.x * sinY + z1 * cosY;

    nt.push(new Vector3(x2 + center.x, y1 + center.y, z2 + center.z));
  });

  return new Tri(nt[0],nt[1],nt[2],t.color);
}

function draw(t)
{
  let pa = project(t.a);
  let pb = project(t.b);
  let pc = project(t.c);
  
  ctx.strokeStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(pa.x, pa.y);
  ctx.lineTo(pb.x, pb.y);
  ctx.lineTo(pc.x, pc.y);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = t.color;
  ctx.fill();
}


//RUNTIME

init();

// CCwise = front facing / Cwise = back facing
let plane = new Mesh([
  //front face CCW
  new Tri(new Vector3(10,10,0), new Vector3(0,0,0), new Vector3(10,0,0), 'salmon'),
  new Tri(new Vector3(0,10,0), new Vector3(0,0,0), new Vector3(10,10,0), 'salmon'),

  //back face CCW
  new Tri(new Vector3(0,10,10), new Vector3(10,10,10), new Vector3(0,0,10), 'mediumorchid'),
  new Tri(new Vector3(10,0,10), new Vector3(0,0,10), new Vector3(10,10,10), 'mediumorchid'),
  
  //top face CCW
  new Tri(new Vector3(0,10,0), new Vector3(10,10,0), new Vector3(0,10,10), 'gold'),
  new Tri(new Vector3(10,10,10), new Vector3(0,10,10), new Vector3(10,10,0), 'gold'),

  //bottom face CW
  new Tri(new Vector3(0,0,0), new Vector3(0,0,10), new Vector3(10,0,0), 'cyan'),
  new Tri(new Vector3(10,0,10), new Vector3(10,0,0), new Vector3(0,0,10), 'cyan'),
]);

plane.draw();


setInterval(()=>
{
  ctx.clearRect(0,0, canvas.width, canvas.height)
  plane.rotate(0.001,0);
  plane.draw();
}, 100);
