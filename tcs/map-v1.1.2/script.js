document.addEventListener('DOMContentLoaded', () => {
    // 初期表示として「地図設定」タブを表示
    showTab('settingsTab');
    // 必須要素の取得
    const WHITE_COLOR = '#FFFFFF'; // 空白地帯の色
    let cities = [];
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const regenerateButton = document.getElementById('regenerateButton');
    const saveButton = document.getElementById('saveButton');
    const loadButton = document.getElementById('loadButton');
    const singleMergeButton = document.getElementById('singleMergeButton');
    const multiMergeButton = document.getElementById('multiMergeButton');
    const toggleAutoMergeButton = document.getElementById('toggleAutoMergeButton');
    const randomAbsorptionToggle = document.getElementById('randomAbsorptionToggle');
    const capitalToggle = document.getElementById('capitalToggle');
    const cityToggle = document.getElementById('cityToggle');
    const cityRequirementContainer = document.getElementById('cityRequirementContainer');
    const absorptionPatternSelect = document.getElementById('absorptionPattern');

    let showBordersOnly = false; // 初期設定はオフ
    let globalSortedColors = []; // グローバル変数として定義


    // チェックボックスの設定イベントリスナー
    document.getElementById('showBordersOnlyToggle').addEventListener('change', (e) => {
        showBordersOnly = e.target.checked;
        drawCells(); // 設定変更後に再描画
    });
    // チェックボックスの変更に応じて表示・非表示を切り替え
    cityToggle.addEventListener('change', () => {
        if (cityToggle.checked) {
            cityRequirementContainer.style.display = 'block';
        } else {
            cityRequirementContainer.style.display = 'none';
        }
    });
    
    //要素チェック
    if (!canvas || !ctx || !regenerateButton || !saveButton || !loadButton || !singleMergeButton || !multiMergeButton || !toggleAutoMergeButton || !randomAbsorptionToggle || !capitalToggle || !absorptionPatternSelect) {
        console.error("必要な要素が見つかりませんでした。HTMLを確認してください。");
        return;
    }

    // プリセット設定
    const presets = {
        default: { numCells: 500, mergeIterations: 0, tickInterval: 75 },
        large: { numCells: 1000, mergeIterations: 0, tickInterval: 75 },
        dense: { numCells: 2000, mergeIterations: 0, tickInterval: 75 },
        test: { numCells: 5000, mergeIterations: 0, tickInterval: 25 }

    };

    document.getElementById('cityToggle').addEventListener('change', toggleModifiedWeightedOption);
    document.getElementById('capitalToggle').addEventListener('change', toggleModifiedWeightedOption);
    // 都市・首都の設定に応じて「修正重みつき吸収」のオプションを表示・非表示
    function toggleModifiedWeightedOption() {
        const isCityEnabled = document.getElementById('cityToggle').checked;
        const isCapitalEnabled = document.getElementById('capitalToggle').checked;
        const modifiedWeightedOption = document.getElementById('modifiedWeightedOption');

        // 都市または首都が有効なときのみ表示
        if (isCityEnabled || isCapitalEnabled) {
            modifiedWeightedOption.style.display = 'block';
        } else {
            modifiedWeightedOption.style.display = 'none';

            // 「修正重みつき吸収」が選択されている場合、デフォルトのオプションに戻す
            const absorptionPatternSelect = document.getElementById('absorptionPattern');
            if (absorptionPatternSelect.value === 'modified-weighted') {
                absorptionPatternSelect.value = 'weighted'; // デフォルトの「ランダム吸収」に戻す
            }
        }
    }
    
    window.applyPreset = (presetName) => {
        if (presetName === 'random') {
            // ランダムプリセット：各項目をランダムに設定
            document.getElementById('numCells').value = Math.floor(Math.random() * 1000) + 500; // 500 ～ 10000
            document.getElementById('mergeIterations').value = 0;
            document.getElementById('tickInterval').value = 75;
            document.getElementById('capitalToggle').checked = Math.random() < 0.5;// 50%の確率で都市の配置を有効化
            document.getElementById('cityToggle').checked = Math.random() < 0.5; 
            document.getElementById('cityRequirement').value = Math.floor(Math.random() * 50) + 1; // 1 ～ 50
            document.getElementById('randomAbsorptionToggle').checked = Math.random() < 0.5; // 50%の確率でランダム吸収
            document.getElementById('absorptionPattern').value = ['majority', 'weighted', 'combined', 'modified-weighted', 'global-modified-weighted'][Math.floor(Math.random() * 4)];
            document.getElementById('showBordersOnlyToggle').checked = Math.random() < 0.5; 
            if(document.getElementById('absorptionPattern').value == 'random')
            {
                document.getElementById('mergeIterations').value = 100;
            }
            
        } else if (presetName === 'test') {
            // 他のプリセットを設定
            const preset = presets[presetName];
            document.getElementById('numCells').value = preset.numCells;
            document.getElementById('mergeIterations').value = preset.mergeIterations;
            document.getElementById('tickInterval').value = preset.tickInterval;
            document.getElementById('capitalToggle').checked = true;
            document.getElementById('cityToggle').checked = true;
            document.getElementById('cityRequirement').value = 500;
            document.getElementById('randomAbsorptionToggle').checked = true;
            document.getElementById('absorptionPattern').value = 'global-modified-weighted';
            document.getElementById('showBordersOnlyToggle').checked = true;
        } else {
            // 他のプリセットを設定
            const preset = presets[presetName];
            document.getElementById('numCells').value = preset.numCells;
            document.getElementById('mergeIterations').value = preset.mergeIterations;
            document.getElementById('tickInterval').value = preset.tickInterval;
            document.getElementById('capitalToggle').checked = false;
            document.getElementById('cityToggle').checked = false;
            document.getElementById('cityRequirement').value = 10;
            document.getElementById('randomAbsorptionToggle').checked = false;
            document.getElementById('absorptionPattern').value = 'modified-weighted';
            document.getElementById('showBordersOnlyToggle').checked = true;
        }
        showBordersOnly = document.getElementById('showBordersOnlyToggle').checked
        // 現在の設定を取得して地図を再生成
        const numCells = parseInt(document.getElementById('numCells').value);
        const mergeIterations = parseInt(document.getElementById('mergeIterations').value);
        generateAndDrawMap(numCells, mergeIterations);
        console.log(`applyPreset called with preset: ${presetName}`);
    };
    
    
    let cells = [];
    let capitals = new Map(); // 各領地の首都セル
    let autoMergeRunning = false;
    let autoMergeInterval = null;
    let lastTick = 0;

    // 地図再生成ボタン
    regenerateButton.addEventListener('click', () => {
        const numCells = parseInt(document.getElementById('numCells').value);
        const mergeIterations = parseInt(document.getElementById('mergeIterations').value);
        generateAndDrawMap(numCells, mergeIterations);

    });

    // 設定保存ボタン
    saveButton.addEventListener('click', () => {
        const settings = {
            numCells: document.getElementById('numCells').value,
            mergeIterations: document.getElementById('mergeIterations').value,
            tickInterval: document.getElementById('tickInterval').value,
            absorptionPattern: absorptionPatternSelect.value,
            capitalToggle: capitalToggle.checked,
            randomAbsorptionToggle: randomAbsorptionToggle.checked
        };
        localStorage.setItem('mapSettings', JSON.stringify(settings));
        alert('設定が保存されました！');
    });

    // 設定ロードボタン
    loadButton.addEventListener('click', () => {
        const savedSettings = localStorage.getItem('mapSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            document.getElementById('numCells').value = settings.numCells;
            document.getElementById('mergeIterations').value = settings.mergeIterations;
            document.getElementById('tickInterval').value = settings.tickInterval;
            absorptionPatternSelect.value = settings.absorptionPattern;
            capitalToggle.checked = settings.capitalToggle;
            randomAbsorptionToggle.checked = settings.randomAbsorptionToggle;
            generateAndDrawMap(settings.numCells, settings.mergeIterations);
            alert('設定がロードされました！');
        } else {
            alert('保存された設定がありません。');
        }
    });

    // 吸収処理を一回実行するボタン
    singleMergeButton.addEventListener('click', () => {
        mergeAdjacentCells();
        drawCells();
    });

    // 吸収処理を複数回実行するボタン
    multiMergeButton.addEventListener('click', () => {
        const mergeIterations = parseInt(document.getElementById('mergeIterations').value);
        for (let i = 0; i < mergeIterations; i++) {
            mergeAdjacentCells();
        }
        drawCells();
    });

    // 自動吸収開始/停止ボタン
    toggleAutoMergeButton.addEventListener('click', () => {
        autoMergeRunning = !autoMergeRunning;
        if (autoMergeRunning) {
            const tickInterval = parseInt(document.getElementById('tickInterval').value);
            autoMergeLoop(tickInterval);
        } else {
            clearInterval(autoMergeInterval);
            autoMergeInterval = null;
        }
    });

    // 吸収処理用のループ
    function autoMergeLoop(tickInterval) {
        if (!autoMergeRunning) return;
        requestAnimationFrame((timestamp) => {
            if (timestamp - lastTick >= tickInterval) {
                mergeAdjacentCells();
                updateColorRanking();
                drawCells();
                lastTick = timestamp;
                updateColorAdjacencyRanking(10);
            }
            autoMergeLoop(tickInterval);
        });
    }
    // // 地図を生成し描画する関数
    // function generateAndDrawMap(numCells, mergeIterations) {
    //     capitals.clear();
    //     cells = generateVoronoiCells(numCells, canvas.width, canvas.height);

    //     window.cells = cells; // cellsをグローバル変数に設定
    
    //     // 首都の設定が有効な場合にのみ首都を設定
    //     if (capitalToggle.checked && cells.length > 0) {
    //         setCapitals();
    //     }
    //     // 吸収処理を実行
    //     for (let i = 0; i < mergeIterations; i++) {
    //         mergeAdjacentCells();
    //     }
    
    //     drawCells(); // 生成後に描画
    // }
    function generateAndDrawMap(numCells, mergeIterations) {
        console.log('generateAndDrawMap 開始');
        capitals.clear();
    
        console.log('セルを生成');
        cells = generateVoronoiCells(numCells, canvas.width, canvas.height);
        console.log('セル生成完了, セル数:', cells.length);
    
        window.cells = cells;
    
        // 首都の設定が有効な場合にのみ首都を設定
        if (capitalToggle.checked && cells.length > 0) {
            console.log('首都を設定');
            setCapitals();
        }
    
        console.log('吸収処理開始');
        for (let i = 0; i < mergeIterations; i++) {
            console.log(`吸収処理 ${i + 1} 回目`);
            mergeAdjacentCells();
        }
    
        console.log('セルを描画');
        drawCells();
        console.log('generateAndDrawMap 完了');
    }

    // 各領地の首都を設定
    function setCapitals() {
        const colors = new Set(cells.map(cell => cell.color));
        colors.forEach(color => {
            const colorCells = cells.filter(cell => cell.color === color);
            const capitalCell = colorCells[Math.floor(Math.random() * colorCells.length)];
            capitals.set(capitalCell, color);
        });
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
            const cell = voronoi.cellPolygon(i);
            return cell ? {
                points: closeGaps(cell),
                color: getRandomColor(),
                neighbors: Array.from(delaunay.neighbors(i))
            } : null;
        }).filter(cell => cell);
    }

    // 画面外に出ないようセルの端を調整
    function closeGaps(points) {
        return points.map(([x, y]) => [
            Math.min(Math.max(x, 0), canvas.width),
            Math.min(Math.max(y, 0), canvas.height)
        ]);
    }

    // 吸収処理を行う
    function mergeAdjacentCells() {

        if (document.getElementById('cityToggle').checked) {
            generateCities(); // ← ここで都市を生成
            handleDuplicateCapitals();
        }
        const merged = new Set();
        const absorptionPattern = absorptionPatternSelect.value;
        const randomAbsorptionEnabled = randomAbsorptionToggle.checked;
        const capitalIsEnabled = capitalToggle.checked;
    
        // 白色セルの処理：隣接セルの色を吸収
        cells.forEach((cell, index) => {
            if (cell.color === WHITE_COLOR) {
                const neighborColors = getNeighborColors(cell, merged);
                if (neighborColors.length > 0) {
                    cell.color = neighborColors[Math.floor(Math.random() * neighborColors.length)];
                    merged.add(index);
                }
            }
        });
    
        // 通常のセル吸収処理
        cells.forEach((cell, index) => {
            if (cell.color === WHITE_COLOR || merged.has(index)) return;
    
            const neighborColors = getNeighborColors(cell, merged);
            let selectedColor;
    
            // ランダム吸収（10%の確率）　(ランダムは無視)
            if (randomAbsorptionEnabled && Math.random() < 0.1 || (absorptionPattern === 'random')) {
                selectedColor = neighborColors[Math.floor(Math.random() * neighborColors.length)];
            } else {
                selectedColor = selectColorByPattern(neighborColors, absorptionPattern, cell.color);
            }
    
            if (selectedColor) {
                // 都市の陥落処理：都市セルが別の色に吸収された場合、都市から除外
                if (cities.includes(cell) && cell.color !== selectedColor) {
                    cities.splice(cities.indexOf(cell), 1);
                    addMapLog(selectedColor, "の都市を奪いました", cell.color);
                }
    
                // 首都セルが吸収された場合の処理
                if (capitals.has(cell) && capitals.get(cell) !== selectedColor) {
                    capitals.delete(cell); // 旧首都を削除
                    addMapLog(selectedColor, "の首都を奪いました", cell.color);
                
                    // 新しい首都を設定する条件チェック
                    const sameColorCells = cells.filter(c => c.color === cell.color);
                    const remainingCities = sameColorCells.filter(c => cities.includes(c));
                
                    // 同じ色の領地に都市が存在する場合、最初の都市を新しい首都に昇格
                    if (remainingCities.length > 0 && capitalIsEnabled) {
                        const newCapitalCell = remainingCities[0];
                        capitals.set(newCapitalCell, cell.color); // 新しい都市に首都を設定
                        addMapLog(cell.color, "は他の都市に首都を移転しました。");
                    } else {
                        addMapLog(cell.color, "は滅亡しました。");
                    }
                }
    
                // 吸収後のセル色の設定
                cell.color = selectedColor;
                merged.add(index);
            }
        });
    
        // 複数の首都が発生しないようチェック
        if (capitalIsEnabled) {
            const capitalsByColor = new Map();
            capitals.forEach((color, cell) => {
                if (!capitalsByColor.has(color)) {
                    capitalsByColor.set(color, []);
                }
                capitalsByColor.get(color).push(cell);
            });
    
            // 色ごとに1つ以上の首都があった場合、最初の首都を残し他は削除
            capitalsByColor.forEach((capitalCells, color) => {
                if (capitalCells.length > 1) {
                    for (let i = 1; i < capitalCells.length; i++) {
                        capitals.delete(capitalCells[i]);
                        if (!cities.includes(capitalCells[i])) {
                            cities.push(capitalCells[i]); // 重複した首都を都市に戻す
                        }
                    }
                }
            });
        }
    
        // 首都が存在しない領地を白色化
        if (capitalIsEnabled) {
            cells.forEach(cell => {
                if (cell.color !== WHITE_COLOR && !Array.from(capitals.values()).includes(cell.color)) {
                    cell.color = WHITE_COLOR;
                }
            });
        }
    }
    // selectColorByPattern：neighborColors, pattern, selfColorだけで動作するように変更
    function selectColorByPattern(neighborColors, pattern, selfColor) {
        if (!neighborColors.length) return null;
        // 隣接セルの色の出現頻度をカウント
        const colorCounts = neighborColors.reduce((acc, color) => {
            acc[color] = (acc[color] || 0) + 1;
            return acc;
        }, {});
        // console.log(`${selfColor}, ${neighborColors}`);

        const totalWeight = Object.values(colorCounts).reduce((sum, count) => sum + count, 0);
        const isCityEnabled = document.getElementById('cityToggle').checked;
        const isCapitalEnabled = document.getElementById('capitalToggle').checked;

        // 孤立しているかの判定
        // const isIsolated = !neighborColors.includes(selfColor);
        if (pattern === 'custom-weighted') {
            const selfColorCount = colorCounts[selfColor] || 0;
            // colorCounts から最も頻度の高い色を取得
            let dominantColor = Object.keys(colorCounts).reduce((a, b) =>
                colorCounts[a] > colorCounts[b] ? a : b
            );
            // dominantColor が selfColor と同じ場合、50%の確率で colorCounts のランダムな色を選択
            if (dominantColor === selfColor) {
                if (Math.random() < 0.75) {
                    const colors = Object.keys(colorCounts);
                    // ランダムに colorCounts のキー（色）を選択
                    dominantColor = colors[Math.floor(Math.random() * colors.length)];
                }
            }

            if(selfColorCount == dominantColor)
            {
                return selfColor;
            }
            else
            {
                // 自分自身が接している色の数

                const selfDiversity = globalSortedColors[selfColor]?.length * 10|| 1; // 自分の隣接色の数
                const dominantDiversity = globalSortedColors[dominantColor]?.length * 10|| 1; // 相手の隣接色の数
                
                // console.log(`隣接色（自分）: ${selfDiversity}, 隣接色（敵）: ${dominantDiversity}`);

                // グローバルカウントを取得
                const selfGlobalCount = (colorCount[selfColor] || 0) / selfDiversity;
                const dominantGlobalCount = (colorCount[dominantColor] || 0) / dominantDiversity;
        
                const totalDifferenceFactor = dominantGlobalCount / (selfGlobalCount + 1);
                // console.log(`selfGlobalCount: ${selfGlobalCount}, dominantGlobalCount: ${dominantGlobalCount}`);
                // console.log(`selfColor: ${selfColor} (count: ${selfGlobalCount}), dominantColor: ${dominantColor} (count: ${dominantGlobalCount})`);
                // console.log(`Total Difference Factor: ${totalDifferenceFactor}`);

                if (Math.random() < Math.pow(totalDifferenceFactor, 1.2) / 3) {
                    return dominantColor;
                }
        
                if (Math.random() < selfColorCount / totalWeight) {
                    return selfColor;
                }
        
                return neighborColors.find(c => Math.random() < colorCounts[c] / totalWeight);
            }
        }
        // 孤立している場合は他の色に吸収されやすくする
        // if (isIsolated) {
        //     return neighborColors.find(c => Math.random() < (colorCounts[c] / totalWeight) * 1.5);
        // }
        if (pattern === 'global-modified-weighted') {
            const selfColorCount = colorCounts[selfColor] || 0;
            // colorCounts から最も頻度の高い色を取得
            let dominantColor = Object.keys(colorCounts).reduce((a, b) =>
                colorCounts[a] > colorCounts[b] ? a : b
            );
            // dominantColor が selfColor と同じ場合、50%の確率で colorCounts のランダムな色を選択
            if (dominantColor === selfColor) {
                if (Math.random() < 0.75) {
                    const colors = Object.keys(colorCounts);
                    // ランダムに colorCounts のキー（色）を選択
                    dominantColor = colors[Math.floor(Math.random() * colors.length)];
                }
            }

            if(selfColorCount == dominantColor)
            {
                return selfColor;
            }
            else
            {
                const selfGlobalCount = colorCount[selfColor] || 0;
                const dominantGlobalCount = colorCount[dominantColor] || 0;
        
                const totalDifferenceFactor = dominantGlobalCount / (selfGlobalCount + 1);
                // console.log(`selfGlobalCount: ${selfGlobalCount}, dominantGlobalCount: ${dominantGlobalCount}`);
                // console.log(`selfColor: ${selfColor} (count: ${selfGlobalCount}), dominantColor: ${dominantColor} (count: ${dominantGlobalCount})`);
                // console.log(`Total Difference Factor: ${totalDifferenceFactor}`);

                if (Math.random() < Math.pow(totalDifferenceFactor, 1.2) / 3) {
                    return dominantColor;
                }
        
                if (Math.random() < selfColorCount / totalWeight) {
                    return selfColor;
                }
        
                return neighborColors.find(c => Math.random() < colorCounts[c] / totalWeight);
            }
        }
        // 修正重みつき吸収パターン
        if (pattern === 'modified-weighted' && (isCityEnabled || isCapitalEnabled)) {
            const selfColorCount = colorCounts[selfColor] || 0;
            const dominantColor = Object.keys(colorCounts).reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b);
            if(selfColorCount == dominantColor)
            {
                return selfColor;
            }
            else
            {
                const dominantColorCount = colorCounts[dominantColor];

                // 圧倒的な戦力差がある場合は、他の色に吸収されやすくする
                const overwhelmingDifference = dominantColorCount > selfColorCount * 2;

                if (overwhelmingDifference && dominantColor !== selfColor) {
                    return dominantColor; // 圧倒的な色に変わりやすくする
                }

                // 通常の重みつき吸収
                if (Math.random() < selfColorCount / totalWeight) {
                    return selfColor;
                }

                return neighborColors.find(c => Math.random() < colorCounts[c] / totalWeight);
            }
        }

        // 通常の重みつき吸収パターン
        if (pattern === 'weighted') {
            const selfColorCount = colorCounts[selfColor] || 0;

            if (Math.random() < selfColorCount / totalWeight) {
                return selfColor;
            }

            return neighborColors.find(c => Math.random() < colorCounts[c] / totalWeight);
        }

        // 他のパターン
        // if (pattern === 'random') {
        //     return neighborColors[Math.floor(Math.random() * neighborColors.length)];
        // }

        if (pattern === 'majority') {
            return Object.keys(colorCounts).reduce((a, b) => colorCounts[a] > colorCounts[b] ? a : b);
        }

        // デフォルトでランダム
        return neighborColors[Math.floor(Math.random() * neighborColors.length)];
    }
    
    // 隣接セルの色を取得
    function getNeighborColors(cell, merged) {
        return cell.neighbors
            .filter(neighborIndex => !merged.has(neighborIndex) && cells[neighborIndex].color !== WHITE_COLOR)
            .map(neighborIndex => cells[neighborIndex].color);
    }

    // 地図を描画
    function drawCells() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        cells.forEach(cell => {
            ctx.fillStyle = cell.color;
            ctx.beginPath();
            ctx.moveTo(cell.points[0][0], cell.points[0][1]);
            for (let i = 1; i < cell.points.length; i++) {
                ctx.lineTo(cell.points[i][0], cell.points[i][1]);
            }
            ctx.closePath();
            ctx.fill();
    
            // 首都セルは赤い枠で囲む
            if (capitals.has(cell) && capitals.get(cell) === cell.color) {
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'red';
            } 
            // 都市セルは青い枠で囲む
            else if (cities.includes(cell)) {
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'blue';
            } else {
                ctx.lineWidth = 1;
                ctx.strokeStyle = 'black';
            }
            ctx.stroke();
        });
    }

    // ランダムな色を生成
    function getRandomColor() {
        return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
    }
    
    // 2つのセル間の距離を計算する関数
    function calculateDistance(cell1, cell2) {
        // 各セルに有効なポイントが存在するか確認
        if (!cell1.points || !cell2.points || cell1.points.length === 0 || cell2.points.length === 0) {
            return null; // 無効なセルの場合はnullを返す
        }
        const dx = cell1.points[0][0] - cell2.points[0][0];
        const dy = cell1.points[0][1] - cell2.points[0][1];
        return Math.sqrt(dx * dx + dy * dy);
    }
    

    // 都市を生成
    function generateCities() {
        if (!document.getElementById('cityToggle').checked) {
            cities = [];
            return;
        }
    
        const cityRequirement = parseInt(document.getElementById('cityRequirement').value, 10) || 10;
        const minDistance = 50; // 最小距離を指定
    
        const colorGroups = new Map();
        cells.forEach(cell => {
            if (!colorGroups.has(cell.color)) {
                colorGroups.set(cell.color, []);
            }
            colorGroups.get(cell.color).push(cell);
            
        });
    
        colorGroups.forEach((cellsOfColor, color) => {
            const existingCitiesInColor = cities.filter(city => city.color === color);
            const requiredCities = Math.floor(cellsOfColor.length / cityRequirement);
    
            while (existingCitiesInColor.length < requiredCities) {
                const randomCell = cellsOfColor[Math.floor(Math.random() * cellsOfColor.length)];
    
                const isFarEnough = cities.every(city => {
                    const distance = calculateDistance(randomCell, city);
                    return distance === null || distance >= minDistance; // distanceがnullの場合無視
                }) && (!capitals.has(randomCell) || calculateDistance(randomCell, capitals.get(randomCell)) >= minDistance);
    
                if (!cities.includes(randomCell) && !capitals.has(randomCell) && isFarEnough) {
                    cities.push(randomCell);
                    existingCitiesInColor.push(randomCell);
                    addMapLog(color, "に都市が追加されました");
                }
            }
        });
    }
    
    
    function handleDuplicateCapitals() {
        const capitalIsEnabled = document.getElementById('capitalToggle').checked;
    
        // 色ごとに首都の重複を確認
        const capitalsByColor = new Map();
        capitals.forEach((color, cell) => {
            if (!capitalsByColor.has(color)) {
                capitalsByColor.set(color, []);
            }
            capitalsByColor.get(color).push(cell);
        });
    
        // 各色について重複する首都を処理
        capitalsByColor.forEach((capitalCells, color) => {
            if (capitalCells.length > 1) {
                // 複数首都がある場合、1つを残して他を処理
                for (let i = 1; i < capitalCells.length; i++) {
                    const cell = capitalCells[i];
                    
                    if (capitalIsEnabled) {
                        // 首都機能が有効な場合、重複した首都を都市に変換
                        if (!cities.includes(cell)) {
                            cities.push(cell);
                        }
                    } else {
                        // 首都機能が無効な場合、重複した首都を通常のセルに戻す
                        capitals.delete(cell);
                        if (cities.includes(cell)) {
                            cities.splice(cities.indexOf(cell), 1); // 都市からも削除
                        }
                    }
                }
            }
        });
    }
// Special Generation Function without resetting cells
function applySpecialGeneration(type) {
    const numCells = parseInt(document.getElementById('numCells').value);

    // セルが生成されていない場合のみ、新規に生成する
    if (!cells || cells.length === 0 || cells.length !== numCells) {
        cells = generateVoronoiCells(numCells, canvas.width, canvas.height);
        window.cells = cells; // cellsをグローバル変数に設定
    }

    // Special generation pattern
    if (type === 'whiteWithFourColors') {
        // Set most cells to white, with four specific colors for four cells
        const colors = ['#0000FF', '#FF0000', '#00FF00', '#FFFF00'];
        cells.forEach(cell => cell.color = '#FFFFFF'); // All cells to white
        colors.forEach(color => {
            const randomCell = cells[Math.floor(Math.random() * cells.length)];
            randomCell.color = color;
        });
    } else if (type === 'battleRoyale') {
        // Battle Royale Mode: Set 100 random colors, rest white
        const randomColorSet = Array.from({ length: 100 }, () => getRandomColor());
        cells.forEach(cell => cell.color = '#FFFFFF'); // Set all to white
        randomColorSet.forEach(color => {
            const randomCell = cells[Math.floor(Math.random() * cells.length)];
            randomCell.color = color;
        });
    }

    // Update capitals if enabled
    if (capitalToggle.checked) {
        setCapitalsForSpecialGeneration();
    }

    drawCells(); // Redraw the updated map
    updateColorRanking(); // Ensure ranking is updated after color changes
}

// Function to set capitals on random cells of each color
function setCapitalsForSpecialGeneration() {
    capitals.clear(); // Clear any existing capitals
    const uniqueColors = new Set(cells.map(cell => cell.color).filter(color => color !== '#FFFFFF')); // Ignore white

    // Set one capital for each unique color
    uniqueColors.forEach(color => {
        const colorCells = cells.filter(cell => cell.color === color);
        if (colorCells.length > 0) {
            const capitalCell = colorCells[Math.floor(Math.random() * colorCells.length)];
            capitals.set(capitalCell, color); // Set the cell as capital
        }
    });
}

// Add applySpecialGeneration to the global window object
window.applySpecialGeneration = applySpecialGeneration;

    
    let scale = 1.5; // 初期のズームスケール
    let origin = { x: 0, y: 0 }; // キャンバスのドラッグ開始点
    let isDragging = false;
    
    // ズーム機能（ホイール操作およびピンチ操作）
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomAmount = e.deltaY * -0.001; 
        scale += zoomAmount;
        scale = Math.min(Math.max(0.5, scale), 3); // ズーム範囲を制限
        drawCells();
    });

    // タッチズーム（ピンチ）対応
    let lastDistance = null;
    canvas.addEventListener('touchmove', (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            if (lastDistance) {
                const zoomAmount = (currentDistance - lastDistance) * 0.005;
                scale += zoomAmount;
                scale = Math.min(Math.max(0.5, scale), 3);
                drawCells();
            }
            lastDistance = currentDistance;
        }
    });

    canvas.addEventListener('touchend', () => {
        lastDistance = null;
    });

    let lastPosition = { x: 0, y: 0 };

    canvas.addEventListener('mousedown', (e) => {
        isDragging = true;
        lastPosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const dx = e.clientX - lastPosition.x;
            const dy = e.clientY - lastPosition.y;
            origin.x += dx;
            origin.y += dy;
            lastPosition = { x: e.clientX, y: e.clientY };
            drawCells();
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            isDragging = true;
            lastPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            const dx = e.touches[0].clientX - lastPosition.x;
            const dy = e.touches[0].clientY - lastPosition.y;
            origin.x += dx;
            origin.y += dy;
            lastPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            drawCells();
        }
    });

    canvas.addEventListener('touchend', () => {
        isDragging = false;
    });
    function centerMap() {
        origin.x = (canvas.width - canvas.width * scale) / 2;
        origin.y = (canvas.height - canvas.height * scale) / 2;
        drawCells(); // 中心設定後に再描画
    }
        
    // drawCells関数を更新してズームとドラッグを反映
    function drawCells() {
        //設定系
        toggleModifiedWeightedOption();


        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
    
        // ズームとドラッグを反映
        ctx.translate(origin.x, origin.y);
        ctx.scale(scale, scale);
    
        // 全セルを塗りつぶして表示
        cells.forEach(cell => {
            ctx.fillStyle = cell.color;
            ctx.beginPath();
            ctx.moveTo(cell.points[0][0], cell.points[0][1]);
            for (let i = 1; i < cell.points.length; i++) {
                ctx.lineTo(cell.points[i][0], cell.points[i][1]);
            }
            ctx.closePath();
            ctx.fill();
        });
    
        // 国境線の描画（異なる色のセル間の境界のみ）
        cells.forEach(cell => {
            cell.neighbors.forEach(neighborIndex => {
                const neighbor = cells[neighborIndex];
                if (!neighbor) return;
    
                // 国境のみを表示する設定の場合、異なる色のセル間のみ線を描画
                if (showBordersOnly && cell.color === neighbor.color) {
                    return; // 同じ色の隣接セル間には線を引かない
                }
    
                // 境界線の描画
                ctx.beginPath();
                const points = cell.points;
                for (let i = 0; i < points.length; i++) {
                    const start = points[i];
                    const end = points[(i + 1) % points.length];
    
                    // 隣接セルの境界線のみ描画
                    if (isSharedEdge(cell, neighbor, start, end)) {
                        ctx.moveTo(start[0], start[1]);
                        ctx.lineTo(end[0], end[1]);
                    }
                }
                ctx.lineWidth = 1.5;
                ctx.strokeStyle = '#333';
                ctx.stroke();
            });
        });
    
        // 特殊セル（首都・都市の枠線）の描画
        cells.forEach(cell => {
            if (capitals.has(cell)) {
                // 首都セルを赤枠で描画
                ctx.lineWidth = 3;
                ctx.strokeStyle = 'red';
                ctx.beginPath();
                ctx.moveTo(cell.points[0][0], cell.points[0][1]);
                for (let i = 1; i < cell.points.length; i++) {
                    ctx.lineTo(cell.points[i][0], cell.points[i][1]);
                }
                ctx.closePath();
                ctx.stroke();
            } else if (cities.includes(cell)) {
                // 都市セルを青枠で描画
                ctx.lineWidth = 2;
                ctx.strokeStyle = 'blue';
                ctx.beginPath();
                ctx.moveTo(cell.points[0][0], cell.points[0][1]);
                for (let i = 1; i < cell.points.length; i++) {
                    ctx.lineTo(cell.points[i][0], cell.points[i][1]);
                }
                ctx.closePath();
                ctx.stroke();
            }
        });
    
        ctx.restore();
    }
    
    function addMapLog(color, message, defenderColor = null) {
        // 白色のログは無視
        if (color.toLowerCase() === '#ffffff' || (defenderColor && defenderColor.toLowerCase() === '#ffffff')) return;
    
        const logList = document.getElementById('logList');
        const logItem = document.createElement('li');
    
        if (defenderColor) {
            logItem.innerHTML = `
                <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 5px;"></span>
                <span>が</span>
                <span class="color-box" style="background-color: ${defenderColor}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 5px;"></span>
                <span>${message}</span>
            `;
        } else {
            logItem.innerHTML = `
                <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                <span>${message}</span>
            `;
        }
    
        // 最新のログを上に追加
        logList.insertBefore(logItem, logList.firstChild);
    
        // ログの保存数を取得し、超過分を削除
        const logLimitInput = document.getElementById('logLimit');
        const logLimit = parseInt(logLimitInput.value) || 10;
    
        while (logList.children.length > logLimit) {
            logList.removeChild(logList.lastChild); // 最も古いログを削除
        }
    }
    
    function showTab(tabId) {
        document.querySelectorAll('.tabContent').forEach(tab => {
            tab.style.display = 'none';
        });
        
        document.querySelectorAll('.tabButton').forEach(button => {
            button.classList.remove('active');
        });
        
        document.getElementById(tabId).style.display = 'block';
        document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
    }
    
    // 初期表示として「地図設定」タブを表示
    document.addEventListener('DOMContentLoaded', () => {
        showTab('settingsTab');
    });

    let colorCount = {};
    // 色のランキングを更新する関数
    function updateColorRanking() {
        colorCount = {};
        const cells = window.cells || [];
    
        // 各セルの色をカウント
        cells.forEach(cell => {
            if (!cell || !cell.color) return;
            colorCount[cell.color] = (colorCount[cell.color] || 0) + 1;
        });
    
        // 表示する上位数を設定（デフォルトは10）
        const topCountInput = document.getElementById('topCount');
        const topCount = topCountInput ? parseInt(topCountInput.value) || 10 : 10;
    
        // 領地数の多い順にソートし、指定した数だけ取得
        const sortedColors = Object.entries(colorCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, topCount);
    
        // リストを表示する要素を取得
        const rankingList = document.getElementById('rankingList');
        rankingList.innerHTML = ""; // 一度内容をクリア
    
        // ソートされた色と領地数を <p> 要素で表示
        sortedColors.forEach(([color, count]) => {
            const listItem = document.createElement('p');
            listItem.innerHTML = `
                <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                <span>${count} 領地</span>
            `;
            rankingList.appendChild(listItem);
        });
    }
    
    // グローバルにアクセスできるように関数を window に追加
    window.showTab = showTab;
    window.updateColorRanking = updateColorRanking;
    
    // 隣接セルとの共有エッジを確認する関数
    function isSharedEdge(cell1, cell2, start, end) {
        // cell2 のポイントが cell1 と同じエッジを持っているかチェック
        return cell2.points.some((point, i) => {
            const nextPoint = cell2.points[(i + 1) % cell2.points.length];
            return (point[0] === start[0] && point[1] === start[1] &&
                    nextPoint[0] === end[0] && nextPoint[1] === end[1]) ||
                   (point[0] === end[0] && point[1] === end[1] &&
                    nextPoint[0] === start[0] && nextPoint[1] === start[1]);
        });
    }

    // ウィンドウサイズ変更時にキャンバスサイズを更新
    function resizeCanvas() {
        canvas.width = window.innerWidth - document.getElementById('sidebar').offsetWidth;
        canvas.height = window.innerHeight;
        drawCells(); // キャンバスサイズ変更後に再描画
    }

    function updateColorAdjacencyRanking(limit) {
        const adjacencyList = generateColorAdjacencyList(); // 隣接色リストを生成
        console.log("Adjacency List:", adjacencyList); // 隣接リストの確認
    
        const sortedColors = sortColorsByAdjacency(adjacencyList); // 隣接色が多い順に並べ替え
        console.log("Sorted Colors:", sortedColors); // ソート後の確認
    
        // グローバル変数に保存
        globalSortedColors = adjacencyList; // 隣接リストそのものを保存
    
        const tableBody = document.getElementById('adjacencyTable').querySelector('tbody');
        tableBody.innerHTML = ''; // テーブルの中身をリセット
    
        // 上位指定数をHTMLに追加
        sortedColors.slice(0, limit).forEach((entry, index) => {
            const row = document.createElement('tr');
    
            // 順位
            const rankCell = document.createElement('td');
            rankCell.textContent = index + 1;
            row.appendChild(rankCell);
    
            // 色
            const colorCell = document.createElement('td');
            colorCell.textContent = entry.color;
            colorCell.style.backgroundColor = entry.color; // 背景色として色を表示
            row.appendChild(colorCell);
    
            // 接している色数
            const countCell = document.createElement('td');
            countCell.textContent = entry.count;
            row.appendChild(countCell);
    
            // 隣接色
            const neighborsCell = document.createElement('td');
            neighborsCell.textContent = entry.neighbors.join(', ');
            row.appendChild(neighborsCell);
    
            tableBody.appendChild(row);
        });
    }
    
    
    function generateColorAdjacencyList() {
        const adjacencyList = {}; // 色ごとの隣接色リスト
    
        cells.forEach(cell => {
            if (cell.color === WHITE_COLOR) return;
    
            const neighbors = getNeighbors(cell);
            neighbors.forEach(neighborIndex => {
                const neighborColor = cells[neighborIndex]?.color;
    
                if (!neighborColor || neighborColor === WHITE_COLOR || neighborColor === cell.color) {
                    return;
                }
    
                if (!adjacencyList[cell.color]) {
                    adjacencyList[cell.color] = new Set();
                }
                adjacencyList[cell.color].add(neighborColor);
            });
        });
    
        // SetをArrayに変換
        Object.keys(adjacencyList).forEach(color => {
            adjacencyList[color] = Array.from(adjacencyList[color]);
        });
    
        return adjacencyList;
    }
    function sortColorsByAdjacency(adjacencyList) {
        const sortedColors = Object.entries(adjacencyList)
            .map(([color, neighbors]) => ({
                color,
                neighbors,
                count: neighbors.length
            }))
            .sort((a, b) => b.count - a.count); // 降順にソート
    
        return sortedColors;
    }
    function getNeighbors(cell) {
        const neighbors = [];
        cell.neighbors.forEach(neighborIndex => {
            if (neighborIndex >= 0 && neighborIndex < cells.length) {
                neighbors.push(neighborIndex);
            }
        });
        return neighbors;
    }
        
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // 初期化時にもキャンバスサイズを設定
    
    // 初期地図の生成
    generateAndDrawMap(100, 0);
    centerMap();

    updateColorAdjacencyRanking(10);
});
