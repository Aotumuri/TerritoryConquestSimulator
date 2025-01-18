document.addEventListener('DOMContentLoaded', () => {
    // 初期設定
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const regenerateButton = document.getElementById('regenerateButton');

    let cells = [];
    let capitals = new Map(); // 首都データ
    let cities = []; // 都市データ
    let expansionMultipliers = {}; // 拡張倍率
    let selectedCell = null; // 選択されたセル

    // 地図生成関数
    function generateAndDrawMap(numCells, mergeIterations) {
        console.log('地図生成を開始します');

        cells = generateVoronoiCells(numCells, canvas.width, canvas.height);
        console.log(`生成されたセル数: ${cells.length}`);

        const capitalToggle = document.getElementById('capitalToggle');
        if (capitalToggle && capitalToggle.checked) {
            setCapitals();
        }

        for (let i = 0; i < mergeIterations; i++) {
            mergeAdjacentCells();
        }

        drawCells();
    }

    // Voronoiセルを生成
    function generateVoronoiCells(numCells, width, height) {
        const points = Array.from({ length: numCells }, () => ({
            x: Math.random() * width,
            y: Math.random() * height
        }));

        const delaunay = d3.Delaunay.from(points.map(p => [p.x, p.y]));
        const voronoi = delaunay.voronoi([0, 0, width, height]);

        return points.map((_, i) => {
            const polygon = voronoi.cellPolygon(i);
            if (!polygon) return null;

            return {
                points: closeGaps(polygon),
                color: '#FFFFFF', // 初期色は白
                neighbors: Array.from(delaunay.neighbors(i)),
                isWater: false
            };
        }).filter(cell => cell);
    }

    // セルを描画
    function drawCells() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cells.forEach(cell => {
            ctx.fillStyle = cell.color;
            ctx.beginPath();
            ctx.moveTo(cell.points[0][0], cell.points[0][1]);
            cell.points.forEach(([x, y], index) => {
                if (index > 0) ctx.lineTo(x, y);
            });
            ctx.closePath();
            ctx.fill();

            ctx.lineWidth = 1;
            ctx.strokeStyle = 'black';
            ctx.stroke();
        });
    }

    // セルの端を調整（画面外に出ないようにする）
    function closeGaps(points) {
        return points.map(([x, y]) => [
            Math.min(Math.max(x, 0), canvas.width),
            Math.min(Math.max(y, 0), canvas.height)
        ]);
    }

    // セル吸収処理
    function mergeAdjacentCells() {
        cells.forEach(cell => {
            const neighborColors = cell.neighbors
                .map(index => cells[index]?.color)
                .filter(color => color && color !== cell.color);

            if (neighborColors.length > 0) {
                cell.color = neighborColors[Math.floor(Math.random() * neighborColors.length)];
            }
        });
    }

    // 首都を設定
    function setCapitals() {
        const uniqueColors = [...new Set(cells.map(cell => cell.color))];
        uniqueColors.forEach(color => {
            const colorCells = cells.filter(cell => cell.color === color);
            if (colorCells.length > 0) {
                capitals.set(colorCells[0], color);
            }
        });
    }

    // クリックイベントでセルを選択し色を変更
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        selectedCell = cells.find(cell => isPointInsidePolygon(x, y, cell.points));

        if (selectedCell) {
            selectedCell.color = prompt('セルの新しい色 (HEX形式, 例: #FF0000):', selectedCell.color) || selectedCell.color;
            drawCells();
        }
    });

    // ポリゴン内部判定
    function isPointInsidePolygon(x, y, points) {
        let inside = false;
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
            const xi = points[i][0], yi = points[i][1];
            const xj = points[j][0], yj = points[j][1];

            const intersect = ((yi > y) !== (yj > y)) &&
                (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    // 地図再生成ボタンのイベントリスナー
    regenerateButton.addEventListener('click', () => {
        const numCells = parseInt(document.getElementById('numCells').value) || 100;
        const mergeIterations = parseInt(document.getElementById('mergeIterations').value) || 0;
        generateAndDrawMap(numCells, mergeIterations);
    });

    // 初期地図生成
    generateAndDrawMap(100, 0);
});
