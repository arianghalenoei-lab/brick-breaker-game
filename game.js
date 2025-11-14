/* This code runs after the HTML page has loaded.
We get the 'canvas' element from the HTML and its '2D context', 
which is the tool we use to draw on it.
*/
window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // --- Canvas and Sizing ---
    // We set a fixed size for the canvas.
    // getWidth() and getHeight() are replaced with canvas.width and canvas.height
    canvas.width = 640;
    canvas.height = 480;

    /* Constants for bricks */
    const NUM_ROWS = 8;
    const BRICK_TOP_OFFSET = 10;
    const BRICK_SPACING = 2;
    const NUM_BRICKS_PER_ROW = 10;
    const BRICK_HEIGHT = 10;
    const SPACE_FOR_BRICKS = canvas.width - (NUM_BRICKS_PER_ROW + 1) * BRICK_SPACING;
    const BRICK_WIDTH = SPACE_FOR_BRICKS / NUM_BRICKS_PER_ROW;

    /* Constants for ball and paddle */
    const PADDLE_WIDTH = 80;
    const PADDLE_HEIGHT = 15;
    const PADDLE_OFFSET = 10;
    const BALL_RADIUS = 10; // Slightly smaller for better visuals

    /* Ball speed */
    const DX = 4;
    const DY = 4;

    /* Global variables */
    // Instead of CodeHS objects, we use simple JavaScript objects
    let ball = {
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: BALL_RADIUS
    };
    
    let paddle = {
        x: (canvas.width - PADDLE_WIDTH) / 2,
        y: canvas.height - PADDLE_OFFSET - PADDLE_HEIGHT,
        width: PADDLE_WIDTH,
        height: PADDLE_HEIGHT
    };
    
    let dx = DX;
    let dy = DY;

    // We use an array to store our brick objects
    let bricks = [];
    let bricksRemaining = NUM_ROWS * NUM_BRICKS_PER_ROW;

    // --- Game Flags ---
    let gameOver = false;
    let gameWon = false;

    // --- Main Function (Initialization) ---
    function main() {
        createBricks();
        
        // Replaces mouseMoveMethod()
        canvas.addEventListener('mousemove', movePaddle);
        
        // Replaces setTimer(). requestAnimationFrame is smoother for games.
        requestAnimationFrame(update);
    }

    // --- Brick Creation ---
    // This function creates the brick objects and stores them in our array
    function createBricks() {
        for (let row = 0; row < NUM_ROWS; row++) {
            let color = getBrickColor(row);
            for (let col = 0; col < NUM_BRICKS_PER_ROW; col++) {
                let x = BRICK_SPACING + col * (BRICK_WIDTH + BRICK_SPACING);
                let y = BRICK_TOP_OFFSET + row * (BRICK_HEIGHT + BRICK_SPACING);
                
                bricks.push({
                    x: x,
                    y: y,
                    width: BRICK_WIDTH,
                    height: BRICK_HEIGHT,
                    color: color,
                    alive: true // We'll use this to check if it's broken
                });
            }
        }
    }
    
    // Returns color strings instead of CodeHS Color objects
    function getBrickColor(row) {
        let colorIndex = Math.floor(row % 8 / 2);
        if (colorIndex === 0) return "red";
        if (colorIndex === 1) return "orange";
        if (colorIndex === 2) return "green";
        return "blue";
    }

    // --- Paddle Controls ---
    function movePaddle(e) {
        // We need to get the mouse's X position *relative to the canvas*
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left - PADDLE_WIDTH / 2;

        // Same boundary logic as before
        x = Math.max(0, Math.min(canvas.width - PADDLE_WIDTH, x));
        paddle.x = x;
    }

    // --- Game Loop (Update) ---
    // This is the main game loop, called on every frame
    function update() {
        if (gameOver || gameWon) return; // Stop the game

        // 1. Update Logic
        ball.x += dx;
        ball.y += dy;

        checkWallCollision();
        checkPaddleCollision();
        checkBrickCollision();
        checkGameStatus();

        // 2. Clear and Draw
        clearCanvas();
        drawBricks();
        drawPaddle();
        drawBall();

        // 3. Continue Loop
        requestAnimationFrame(update);
    }
    
    // --- Collision Detection ---
    function checkWallCollision() {
        // Wall collisions
        if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= canvas.width) {
            dx *= -1;
        }
        if (ball.y - ball.radius <= 0) {
            dy *= -1;
        }
    }
    
    function checkPaddleCollision() {
        // Paddle collision
        if (ball.y + ball.radius >= paddle.y &&
            ball.y - ball.radius <= paddle.y + paddle.height && // Check vertical overlap
            ball.x + ball.radius >= paddle.x &&
            ball.x - ball.radius <= paddle.x + paddle.width &&
            dy > 0) {
            dy *= -1;
            // Nudge ball out of paddle to prevent sticking
            ball.y = paddle.y - ball.radius; 
        }
    }
    
    function checkBrickCollision() {
        // This replaces getElementAt(). We loop through our bricks array.
        for (let brick of bricks) {
            if (!brick.alive) continue; // Skip broken bricks

            // Check for collision (AABB - Axis-Aligned Bounding Box)
            if (
                ball.x + ball.radius > brick.x &&
                ball.x - ball.radius < brick.x + brick.width &&
                ball.y + ball.radius > brick.y &&
                ball.y - ball.radius < brick.y + brick.height
            ) {
                brick.alive = false; // "Remove" the brick
                bricksRemaining--;
                dy *= -1; // Bounce
                break; // Only break one brick per frame
            }
        }
    }

    function checkGameStatus() {
        // Bottom (falling off)
        if (ball.y + ball.radius >= canvas.height) {
            setText("Game Over");
            gameOver = true;
        }

        // Win condition
        if (bricksRemaining === 0) {
            setText("You Win!");
            gameWon = true;
        }
    }

    // --- Drawing Functions ---
    // Clears the whole canvas before each new frame
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Draws the ball (a circle)
    function drawBall() {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.closePath();
    }

    // Draws the paddle (a rectangle)
    function drawPaddle() {
        ctx.fillStyle = "black";
        ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    }

    // Loops through the bricks array and draws the 'alive' ones
    function drawBricks() {
        for (let brick of bricks) {
            if (brick.alive) {
                ctx.fillStyle = brick.color;
                ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            }
        }
    }
    
    // Replaces the CodeHS Text object
    function setText(msg) {
        ctx.fillStyle = "black";
        ctx.font = "30pt Arial";
        ctx.textAlign = "center"; // Centers the text
        ctx.fillText(msg, canvas.width / 2, canvas.height / 2);
    }

    // --- Start the game ---
    main();
};
