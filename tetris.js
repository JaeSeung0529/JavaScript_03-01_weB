const startButton = document.getElementById('startButton');
const startGameButton = document.getElementById('startGameButton');
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
const next1Canvas = document.getElementById('next1');
const next1Context = next1Canvas.getContext('2d');
const next2Canvas = document.getElementById('next2');
const next2Context = next2Canvas.getContext('2d');
const scoreElement = document.getElementById('score');
const speedLevelElement = document.getElementById('speedLevel');
const gameOverScreen = document.getElementById('gameOver');
const playAgainButton = document.getElementById('playAgainButton');

// 캔버스 크기 조정
[context, next1Context, next2Context].forEach(ctx => ctx.scale(20, 20));

let score = 0;
let speedLevel = 1;
let dropCounter = 0;
let dropInterval = 1000;
let lastTime = 0;

// 게임 시작 버튼 클릭 이벤트
startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    gameContainer.style.display = 'flex';
});

startGameButton.addEventListener('click', () => {
    startGameButton.style.display = 'none';
    playerReset();
    update();
});

playAgainButton.addEventListener('click', () => {
    gameOverScreen.style.display = 'none';
    startButton.style.display = 'block';
});

// 게임 영역 생성 함수
function createMatrix(width, height) {
    return Array.from({ length: height }, () => Array(width).fill(0));
}

const arena = createMatrix(12, 20);

// 색상 배열
const colors = [
    null, 'purple', 'yellow', 'orange', 'blue', 'cyan', 'green', 'red'
];

// 피스 생성 함수
function createPiece(type) {
    const pieces = {
        'T': [
            [0, 0, 0],
            [1, 1, 1],
            [0, 1, 0],
        ],
        'O': [
            [2, 2],
            [2, 2],
        ],
        'L': [
            [0, 3, 0],
            [0, 3, 0],
            [0, 3, 3],
        ],
        'J': [
            [0, 4, 0],
            [0, 4, 0],
            [4, 4, 0],
        ],
        'I': [
            [0, 0, 0, 0],
            [5, 5, 5, 5],
            [0, 0, 0, 0],
            [0, 0, 0, 0],
        ],
        'S': [
            [0, 6, 6],
            [6, 6, 0],
            [0, 0, 0],
        ],
        'Z': [
            [7, 7, 0],
            [0, 7, 7],
            [0, 0, 0],
        ]
    };
    return pieces[type];
}

// 매트릭스 그리기 함수
function drawMatrix(matrix, offset, ctx = context) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                ctx.fillStyle = colors[value];
                ctx.fillRect(x + offset.x, y + offset.y, 1, 1);
            }
        });
    });
}

// 업데이트 함수
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// 화면 그리기 함수
function draw() {
    context.fillStyle = '#fff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
    drawNextPieces();
    drawBorder();
}

// 게임 영역 경계선 그리기 함수
function drawBorder() {
    context.strokeStyle = 'black';
    context.lineWidth = 0.05;
    context.strokeRect(0, 1, arena[0].length, 1);
}

// 다음 피스들 그리기 함수
function drawNextPieces() {
    [next1Context, next2Context].forEach(ctx => {
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, next1Canvas.width, next1Canvas.height);
    });

    drawMatrix(nextPieces[0], calculateOffset(nextPieces[0]), next1Context);
    drawMatrix(nextPieces[1], calculateOffset(nextPieces[1]), next2Context);
}

// 피스 위치 계산 함수
function calculateOffset(piece) {
    const x = (next1Canvas.width / 20 - piece[0].length) / 2;
    const y = (next1Canvas.height / 20 - piece.length) / 2;
    return { x, y };
}

// 플레이어 정보
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
};

// 다음 피스들 배열
const nextPieces = [createPiece('T'), createPiece('O')];

// 플레이어 드롭 함수
function playerDrop() {
    player.pos.y++;
    score++;
    updateScore();
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        increaseSpeed();
    }
    dropCounter = 0;
}

// 충돌 감지 함수
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 && (arena[y + o.y] && arena[y + o.y][x + o.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// 매트릭스 병합 함수
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// 플레이어 리셋 함수
function playerReset() {
    player.matrix = nextPieces.shift();
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0);

    if (collide(arena, player)) {
        gameOver();
    }

    nextPieces.push(createPiece('TJLZOSI'[Math.random() * 7 | 0])); 
}

// 게임 오버 처리 함수
function gameOver() {
    arena.forEach(row => row.fill(0));
    score = 0;
    speedLevel = 1;
    dropInterval = 1000;
    updateScore();
    updateSpeedLevel();
    gameContainer.style.display = 'none';
    gameOverScreen.style.display = 'flex';
}

// 라인 클리어 함수
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        score += rowCount * 10;
        rowCount *= 2;
    }
    updateScore();
}

// 속도 증가 처리 함수
function increaseSpeed() {
    if (score >= speedLevel * 150) { // 속도 레벨 증가 조건 수정
        speedLevel++;
        dropInterval *= 0.9; 
        updateSpeedLevel();
    }
}

// 점수 업데이트 함수
function updateScore() {
    scoreElement.innerText = score;
}

// 속도 레벨 업데이트 함수
function updateSpeedLevel() {
    speedLevelElement.innerText = speedLevel;
}

// 키 이벤트 처리
document.addEventListener('keydown', event => {
    const keyActions = {
        37: () => playerMove(-1), // 왼쪽 키
        39: () => playerMove(1),  // 오른쪽 키
        40: playerDrop,          // 아래 키
        38: () => playerRotate(1), // 위쪽 키 (회전)
        81: () => playerRotate(-1), // Q 키 (반시계 방향 회전)
        87: () => playerRotate(1)   // W 키 (시계 방향 회전)
    };

    if (keyActions[event.keyCode]) {
        keyActions[event.keyCode]();
    }
});

// 플레이어 이동 함수
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    }
}

// 플레이어 회전 함수
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir);
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
}

// 매트릭스 회전 함수
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }
    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}
