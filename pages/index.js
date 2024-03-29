import dynamic from "next/dynamic";
import { useEffect, useState, useRef } from "react";
import styles from "../styles/Snake.module.css";

const Config = {
  height: 25,
  width: 25,
  cellSize: 32,
};

const CellType = {
  Snake: "snake",
  Food: "food",
  Empty: "empty",
};

const Direction = {
  Left: { x: -1, y: 0 },
  Right: { x: 1, y: 0 },
  Top: { x: 0, y: -1 },
  Bottom: { x: 0, y: 1 },
};

const Cell = ({ x, y, type }) => {
  const getStyles = () => {
    switch (type) {
      case CellType.Snake:
        return {
          backgroundColor: "yellowgreen",
          borderRadius: 8,
          padding: 2,
        };

      case CellType.Food:
        return {
          backgroundColor: "darkorange",
          borderRadius: 20,
          width: 32,
          height: 32,
        };

      default:
        return {};
    }
  };
  return (
    <div
      className={styles.cellContainer}
      style={{
        left: x * Config.cellSize,
        top: y * Config.cellSize,
        width: Config.cellSize,
        height: Config.cellSize,
      }}
    >
      <div className={styles.cell} style={getStyles()}></div>
    </div>
  );
};

const getRandomCell = () => ({
  x: Math.floor(Math.random() * Config.width),
  y: Math.floor(Math.random() * Config.width),
});

const Snake = () => {
  const getDefaultSnake = () => [
    { x: 8, y: 12 },
    { x: 7, y: 12 },
    { x: 6, y: 12 },
  ];

  const getTime = () => {
    let date = new Date();
    return date.getTime();
  };

  const grid = useRef();

  // snake[0] is head and snake[snake.length - 1] is tail
  const [snake, setSnake] = useState(getDefaultSnake());
  const [direction, setDirection] = useState(Direction.Right);

  const [food, setFood] = useState([{ x: 4, y: 10, date: getTime() }]);
  const [score, setScore] = useState(0);

  // move the snake
  useEffect(() => {
    const runSingleStep = () => {
      setSnake((snake) => {
        const head = snake[0];
        const newHead = { x: head.x + direction.x, y: head.y + direction.y };
        const modifiedHead = pushedIntoBoundary(newHead);
        // make a new snake by extending head
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        const newSnake = [modifiedHead, ...snake];

        // remove tail
        newSnake.pop();

        if(hitSnakeBody()) {
          setScore(0);
          return getDefaultSnake();
        }
        return newSnake;
      });
    };

    runSingleStep();
    const timer = setInterval(runSingleStep, 500);

    return () => clearInterval(timer);
  }, [direction, food]);

  // update score whenever head touches a food
  useEffect(() => {
    const head = snake[0];
    if (isFood(head)) {
      setScore((score) => {
        return score + 1;
      });

      const newFood = getNewFoodPosition();
      const newFoods = food.filter(({ x, y }) => x != snake[0].x || y != snake[0].y );
      const modifiedFoods = [newFood, ...newFoods];
      setFood(modifiedFoods);

      const updatedSnake = [...snake, {
        x: head.x + (snake.length * direction.x),
        y: head.y + (snake.length * direction.y)
      }];
      setSnake(updatedSnake);
    }
  }, [snake]);

  useEffect(() => {
    const handleNavigation = (event) => {
      setDirection(previous => {
        let direction = previous;
        switch (event.key) {
          case "ArrowUp":
            if(!isSameDirection(Direction.Bottom, previous)) {
              direction = Direction.Top;
            }
              break;
  
          case "ArrowDown":
            if(!isSameDirection(Direction.Top, previous)) {
              direction =  Direction.Bottom;
            }
            break;
  
          case "ArrowLeft":
            if(!isSameDirection(Direction.Right, previous)) {
              direction =  Direction.Left;
            }
            break;
  
          case "ArrowRight":
            if(!isSameDirection(Direction.Left, previous)) {
              direction =  Direction.Right;
            }
            break;
        }
        return direction;
      });
    };
    window.addEventListener("keydown", handleNavigation);

    return () => window.removeEventListener("keydown", handleNavigation);
  }, []);

  useEffect(() => {
    const createNewFood = setInterval(() => {
      setFood((previous) => {
        const newFood = getNewFoodPosition();
        let newFoods = [newFood, ...previous];
        return newFoods;
      })
    }, 3000);

    const deleteFood = setInterval(() => {
      setFood((previous) => {
        const date = getTime();
        const newFoods = previous.filter((element) => {
          return getTimeDifference(element.date, date);
        });
        return newFoods;
      })
    }, 1000);

    return () => {
      clearInterval(createNewFood);
      clearInterval(deleteFood);
    }
  }, []);

  const isSameDirection = (direction1, direction2) => {
    if(direction1.x == direction2.x && direction1.y == direction2.y) {
      return true;
    }
    else {
      return false;
    }
  };

  const getTimeDifference = (time1, time2) => {
    const difference = Math.abs(time1 - time2);
    return difference < 10000;
  };

  const isFood = ({ x, y }) =>
    food.find((position) => position.x === x && position.y === y);

  const getNewFoodPosition = () => {
    let newFood = getRandomCell();
    while (isSnake(newFood) || isFood(newFood)) {
      newFood = getRandomCell();
    }
    const modifiedFood = {
      x : newFood.x,
      y : newFood.y,
      date : getTime()
    }
    //console.log("newfood ",modifiedFood);
    return modifiedFood;
  };

  const hitSnakeBody = () => {
    for(let i = 1; i < snake.length; i++) {
      if(snake[i].x === snake[0].x && snake[i].y === snake[0].y) {
        return true;
      }
    }
    return false;
  };

  const pushedIntoBoundary = ({ x, y }) => {
    if(x < 0) {
      x = Config.width - 1;
    }
    else if (x >= Config.width) {
      x = 0;
    }
    
    if(y < 0) {
      y = Config.height - 1;
    }
    else if (y >= Config.height) {
      y = 0;
    }

    return { x, y };
  };

  const isSnake = ({ x, y }) =>
    snake.find((position) => position.x === x && position.y === y);

  const cells = [];
  for (let x = 0; x < Config.width; x++) {
    for (let y = 0; y < Config.height; y++) {
      let type = CellType.Empty;
      if (isFood({ x, y })) {
        type = CellType.Food;
      } else if (isSnake({ x, y })) {
        type = CellType.Snake;
      }
      cells.push(<Cell key={`${x}-${y}`} x={x} y={y} type={type} />);
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.header}
        style={{ width: Config.width * Config.cellSize }}
      >
        Score: {score}
      </div>
      <div
        className={styles.grid}
        style={{
          height: Config.height * Config.cellSize,
          width: Config.width * Config.cellSize,
        }}
      >
        {cells}
      </div>
    </div>
  );
};

export default dynamic(() => Promise.resolve(Snake), {
  ssr: false,
});
