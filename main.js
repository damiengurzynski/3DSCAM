//GLOBAL CONSTANTS
const MOVESPEED = 0.02;
const MOUSESPEED = 0.0002;
const NEARCLIP = -2;

//GLOBAL VARIABLES
let canvas;
let ctx;
let prevMouseX = 0;
let prevMouseY = 0;
let frames = 0;
let fps = 0;


//OBJECTS
let camera = {x: 0, y: 0, z: -3, fov: 60};
let world = [];


//CLASSES
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

class Tri
{
  constructor(v1,v2,v3,col)
  {
    this.points = [v1, v2, v3];
    this.color = col;
    this.behind = false;
  }

  //triangle's normalized direction
  normal()
  {
    let v1 = this.points[1].sub(this.points[0]);
    let v2 = this.points[2].sub(this.points[0]);

    let n = v1.cross(v2);

    return n.normalize();
  }

  //check if tri is facing the camera and is in front of it
  facing()
  {
    let cam = new Vector3(camera.x,camera.y,camera.z);

    let n = this.normal();
    let vc = cam.sub(this.points[0]);
    let d = n.dot(vc);

    //if vc.z >= NEARCLIP tri is behind camera
    if (vc.z >= NEARCLIP) this.behind = true;
    else this.behind = false;

    //if d < 0 tri is facing 
    return d > 0;
  }

  //rotate tri around defined center
  rotate(ax,ay,center)
  {
    //convert to radians
    let x = ax * (180 / Math.PI);
    let y = ay * (180 / Math.PI);

    const cosX = Math.cos(x);
    const sinX = Math.sin(x);
    const cosY = Math.cos(y);
    const sinY = Math.sin(y);

    let nt = [];

    this.points.forEach(p =>
    {
      //translate to input center
      let point = {x: p.x - center.x, y: p.y - center.y, z: p.z - center.z};

      // Rotate around X-axis
      const y1 = point.y * cosX - point.z * sinX;
      const z1 = point.y * sinX + point.z * cosX;

      // Rotate around Y-axis
      const x2 = point.x * cosY + z1 * sinY;
      const z2 = -point.x * sinY + z1 * cosY;

      nt.push(new Vector3(x2 + center.x, y1 + center.y, z2 + center.z));
    });

    return new Tri(nt[0],nt[1],nt[2],this.color);
  }
}

class Mesh
{
  constructor(tris)
  {
    this.tris = tris;
    world.push(this);
  }

  //draw mesh to canvas
  draw()
  {
    this.tris.forEach(e=>
    {
      if (!e.facing() && !e.behind) draw(e);
    })
  }

  //rotate all tris in mesh around camera position
  rotate(ax,ay)
  {
    let rtris = [];

    //define camera position as center for rotation
    let center = {x: camera.x, y: camera.y, z: camera.z};

    /* rotate around center of Mesh
    this.tris.forEach(e=>
    {
      cx += (e.points[0].x + e.points[1].x + e.points[2].x);
      cy += (e.points[0].y + e.points[1].y + e.points[2].y);
      cz += (e.points[0].z + e.points[1].z + e.points[2].z);
    })
    cx = cx / (this.tris.length * 3);
    cy = cy / (this.tris.length * 3);
    cz = cz / (this.tris.length * 3);
    */

    this.tris.forEach(e=>
    {
      rtris.push(e.rotate(ax,ay,center));
    })
    this.tris = rtris;
  }
}

//FUNCTIONS
function init()
{
  canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';
  ctx = canvas.getContext('2d');

  //canvas.onclick = () => canvas.requestPointerLock();

  document.body.appendChild(canvas);
}

function project(point)
{
  let d = camera.z - point.z;
  let s = canvas.width / (2 * Math.tan((camera.fov * Math.PI) / 360) * d);
  let nx = canvas.width / 2 - point.x * s;
  let ny = canvas.height / 2 + point.y * s;

  return {x: nx, y: ny};
}

function draw(t)
{
  let pa = project(t.points[0]);
  let pb = project(t.points[1]);
  let pc = project(t.points[2]);
  
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

function mouseDir(e)
{
  let deltaX = e.movementX;
  let deltaY = e.movementY;
  let dir = {x: 0, y: 0};

  if (deltaX > 3) dir.x = 'right';
  if (deltaX < -3) dir.x = 'left';

  if (deltaY > 3) dir.y = 'down';
  if (deltaY < -3) dir.y = 'up';

  return dir;
}

// EVENT LISTENERS
//resize canvas with window
window.addEventListener('resize', e=>
{
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
})

//fps kb movements
window.addEventListener('keydown', e=>
{
  //move forward
  if (e.key == 'w') world.forEach(f=>
  {
    f.tris.forEach(g=>
    {
      g.points.forEach(h=>
      {
        h.z -= MOVESPEED * 2;
      })
    })
  })

  //move backwards
  if (e.key == 's') world.forEach(f=>
  {
    f.tris.forEach(g=>
    {
      g.points.forEach(h=>
      {
        h.z += MOVESPEED * 2;
      })
    })
  })

  //move left
  if (e.key == 'a') world.forEach(f=>
  {
    f.tris.forEach(g=>
    {
      g.points.forEach(h=>
      {
        h.x += MOVESPEED;
      })
    })
  })

  //move right
  if (e.key == 'd') world.forEach(f=>
  {
    f.tris.forEach(g=>
    {
      g.points.forEach(h=>
      {
        h.x -= MOVESPEED;
      })
    })
  })

  //move up
  if (e.key == 'q') world.forEach(f=>
  {
    f.tris.forEach(g=>
    {
      g.points.forEach(h=>
      {
        h.y -= MOVESPEED;
      })
    })
  })

  //move down
  if (e.key == 'e') world.forEach(f=>
  {
    f.tris.forEach(g=>
    {
      g.points.forEach(h=>
      {
        h.y += MOVESPEED;
      })
    })
  })

  //rotate left
  if (e.key == 'ArrowLeft')
  {
    world.forEach(e=>
    {
      e.rotate(0,MOUSESPEED);
    })
  }

  //rotate right
  if (e.key == 'ArrowRight')
  {
    world.forEach(e=>
    {
      e.rotate(0,-MOUSESPEED);
    })
  }

  //rotate up
  if (e.key == 'ArrowUp')
  {
    world.forEach(e=>
    {
      e.rotate(MOUSESPEED,0);
    })
  }

  //rotate down
  if (e.key == 'ArrowDown')
  {
    world.forEach(e=>
    {
      e.rotate(-MOUSESPEED,0);
    })
  }
})

/*
//fps mouse movements
window.addEventListener('mousemove', (e) =>
{
  let dir = mouseDir(e);

  world.forEach(e=>
  {
    if (dir.x == 'left') e.rotate(0, MOUSESPEED);
    if (dir.x == 'right') e.rotate(0, -MOUSESPEED);
    //if (dir.y == 'up') e.rotate(MOUSESPEED, 0);
    //if (dir.y == 'down') e.rotate(-MOUSESPEED, 0);
  })

  prevMouseX = e.clientX;
  prevMouseY = e.clientY;
});
*/


//RUNTIME
init();

// CCwise = front facing / Cwise = back facing
let cube = new Mesh([
  //front face CCW
  new Tri(new Vector3(1,1,0), new Vector3(0,0,0), new Vector3(1,0,0), 'salmon'),
  new Tri(new Vector3(0,1,0), new Vector3(0,0,0), new Vector3(1,1,0), 'salmon'),

  //back face CCW
  new Tri(new Vector3(0,1,1), new Vector3(1,1,1), new Vector3(0,0,1), 'mediumorchid'),
  new Tri(new Vector3(1,0,1), new Vector3(0,0,1), new Vector3(1,1,1), 'mediumorchid'),
  
  //top face CCW
  new Tri(new Vector3(0,1,0), new Vector3(1,1,0), new Vector3(0,1,1), 'gold'),
  new Tri(new Vector3(1,1,1), new Vector3(0,1,1), new Vector3(1,1,0), 'gold'),

  //bottom face CW
  new Tri(new Vector3(0,0,0), new Vector3(0,0,1), new Vector3(1,0,0), 'cyan'),
  new Tri(new Vector3(1,0,1), new Vector3(1,0,0), new Vector3(0,0,1), 'cyan'),

  //left face CCW
  new Tri(new Vector3(0,0,0), new Vector3(0,1,0), new Vector3(0,0,1), 'red'),
  new Tri(new Vector3(0,1,1), new Vector3(0,0,1), new Vector3(0,1,0), 'red'),

  //right face CCW
  new Tri(new Vector3(1,0,0), new Vector3(1,0,1), new Vector3(1,1,0), 'blue'),
  new Tri(new Vector3(1,1,1), new Vector3(1,1,0), new Vector3(1,0,1), 'blue'),
]);

let update = ()=>
{
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  //draw meshes
  cube.draw();

  //print fps
  ctx.fillStyle = 'white';
  ctx.font = '20px Arial';
  ctx.fillText(`${fps} fps`, 20, 40);

  frames++;
  requestAnimationFrame(update);
}
requestAnimationFrame(update);

setInterval(()=>
{
  fps = frames;
  frames = 0;
}, 1000);