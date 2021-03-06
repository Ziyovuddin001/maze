const { Engine, Render, Runner, World, Bodies, Body, Events } = Matter;
const engine = Engine.create();
const { world } = engine;
let render;
let runner;

maze();

function maze() {

  const cellsHorizontal = 12;
  const cellsVertical = 10;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const unitLengthX = width / cellsHorizontal;
  const unitLengthY = height / cellsVertical;

  engine.world.gravity.y = 0;
  render = Render.create({
    element: document.body,
    engine: engine,
    options: {
      wireframes: false,
      width,
      height,
    },
  });
  Render.run(render);
  runner = Runner.create();
  Runner.run(runner, engine);


  const walls = [
    Bodies.rectangle(width / 2, 0, width, 2, { isStatic: true }),
    Bodies.rectangle(0, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width, height / 2, 2, height, { isStatic: true }),
    Bodies.rectangle(width / 2, height, width, 2, { isStatic: true }),
  ];
  World.add(world, walls);

  const shuffle = arr => {
    let counter = arr.length;

    while (counter > 0) {
      const index = Math.floor(Math.random() * counter);
      counter--;
      [arr[index], arr[counter]] = [arr[counter], arr[index]];
    }

    return arr;
  };



  const grid = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const verticals = Array(cellsVertical)
    .fill(null)
    .map(() => Array(cellsHorizontal - 1).fill(false));

  const horizontals = Array(cellsVertical - 1)
    .fill(null)
    .map(() => Array(cellsHorizontal).fill(false));

  const startRow = Math.floor(Math.random() * cellsVertical);
  const startColumn = Math.floor(Math.random() * cellsHorizontal);

  const iterateThroughCells = (row, column) => {

    if (grid[row][column]) {
      return;
    }


    grid[row][column] = true;


    const neighbors = shuffle([
      [row - 1, column, 'up'],
      [row + 1, column, 'down'],
      [row, column - 1, 'left'],
      [row, column + 1, 'right'],
    ]);


    for (let neighbor of neighbors) {
      const [nextRow, nextColumn, direction] = neighbor;

      if (
        nextRow < 0 ||
        nextRow >= cellsVertical ||
        nextColumn < 0 ||
        nextColumn >= cellsHorizontal
      ) {
        continue;
      }


      if (grid[nextRow][nextColumn]) {
        continue;
      }


      if (direction === 'left') {
        verticals[row][column - 1] = true;
      } else if (direction === 'right') {
        verticals[row][column] = true;
      } else if (direction === 'up') {
        horizontals[row - 1][column] = true;
      } else if (direction === 'down') {
        horizontals[row][column] = true;
      }

      iterateThroughCells(nextRow, nextColumn);
    }

  };

  iterateThroughCells(startRow, startColumn);

  horizontals.forEach((row, indexRow) => {
    row.forEach((open, indexColumn) => {
      if (open) {
        return;
      }

      const wall = Bodies.rectangle(
        (indexColumn + 0.5) * unitLengthX,
        (indexRow + 1) * unitLengthY,
        unitLengthX,
        10,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: 'white',
          },
        }
      );
      World.add(world, wall);
    });
  });

  verticals.forEach((row, indexRow) => {
    row.forEach((open, indexColumn) => {
      if (open) return;

      const wall = Bodies.rectangle(
        (indexColumn + 1) * unitLengthX,
        (indexRow + 0.5) * unitLengthY,
        10,
        unitLengthY,
        {
          label: 'wall',
          isStatic: true,
          render: {
            fillStyle: 'white',
          },
        }
      );
      World.add(world, wall);
    });
  });

  // Goal

  const goal = Bodies.rectangle(
    (cellsHorizontal - 0.5) * unitLengthX,
    (cellsVertical - 0.5) * unitLengthY,
    unitLengthX * 0.7,
    unitLengthY * 0.7,
    {
      label: 'goal',
      isStatic: true,
      render: {
        fillStyle: 'Green',
      },
    }
  );

  World.add(world, goal);



  const ballRadius = Math.min(unitLengthX, unitLengthY) / 4;
  const ball = Bodies.circle(
    0.5 * unitLengthX,
    0.5 * unitLengthY,
    ballRadius,
    {
      label: 'ball',
      render: {
        fillStyle: 'CornflowerGrey',
      },
    }
  );

  World.add(world, ball);

  document.addEventListener('keydown', event => {
    const { x, y } = ball.velocity;

    if (event.keyCode === 38) {
      //go up
      Body.setVelocity(ball, { x, y: y - 5 });
    } else if (event.keyCode === 40) {
      //go down
      Body.setVelocity(ball, { x, y: y + 5 });
    } else if (event.keyCode === 39) {
      //go right
      Body.setVelocity(ball, { x: x + 5, y: y });
    } else if (event.keyCode === 37) {
      //go left
      Body.setVelocity(ball, { x: x - 5, y: y });
    }
  });

  //Won consition

  Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
      const labels = ['ball', 'goal'];

      if (
        labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
      ) {
        world.gravity.y = 1;
        document.querySelector('.winner').classList.remove('hidden');
        document.querySelector('button').addEventListener('click', event => {
          event.preventDefault();
          World.clear(world);
          Engine.clear(engine);
          Render.stop(render);
          Runner.stop(runner);
          render.canvas.remove();
          render.canvas = null;
          render.context = null;
          render.textures = {};
          document.querySelector('.winner').classList.add('hidden');
          maze();
        });

        world.bodies.forEach(body => {
          if (body.label === 'wall') {
            Body.setStatic(body, false);
          }
        });
      }
    });
  });
}
