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
    const saveLoadModal = document.getElementById('saveLoadModal');
    const closeModalButton = document.getElementById('closeModal');
    const elevationToggle = document.getElementById('elevationToggle');

    let showBordersOnly = false; // 初期設定はオフ
    let globalSortedColors = []; // グローバル変数として定義
    let expansionMultipliers = []; // 色ごとの領土拡張倍率

    // チェックボックスの設定イベントリスナー
    document.getElementById('showBordersOnlyToggle').addEventListener('change', (e) => {
        showBordersOnly = e.target.checked;
        drawCells(); // 設定変更後に再描画
    });

    // 標高表示の切り替え
    elevationToggle.addEventListener('change', () => {
        drawCells();
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
        test: { numCells: 5000, mergeIterations: 0, tickInterval: 25 },
        test2: { numCells: 10000, mergeIterations: 0, tickInterval: 1 }
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
            if (document.getElementById('absorptionPattern').value == 'random') {
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
        } else if (presetName === 'test2') {
            // 他のプリセットを設定
            const preset = presets[presetName];
            document.getElementById('numCells').value = preset.numCells;
            document.getElementById('mergeIterations').value = preset.mergeIterations;
            document.getElementById('tickInterval').value = preset.tickInterval;
            document.getElementById('capitalToggle').checked = true;
            document.getElementById('cityToggle').checked = true;
            document.getElementById('cityRequirement').value = 500;
            document.getElementById('randomAbsorptionToggle').checked = true;
            document.getElementById('absorptionPattern').value = 'custom-weighted';
            document.getElementById('showBordersOnlyToggle').checked = true;
            document.getElementById('elevationToggle').checked = true;
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
        if (presetName === 'test2') {
            showBordersOnly = document.getElementById('showBordersOnlyToggle').checked
            // 現在の設定を取得して地図を再生成
            applySpecialGeneration('battleRoyale')
            console.log(`applyPreset called with preset: ${presetName}`);
            autoMergeRunning = true;
            const tickInterval = parseInt(document.getElementById('tickInterval').value);
            autoMergeLoop(tickInterval);
        }
        else {
            showBordersOnly = document.getElementById('showBordersOnlyToggle').checked
            // 現在の設定を取得して地図を再生成
            const numCells = parseInt(document.getElementById('numCells').value);
            const mergeIterations = parseInt(document.getElementById('mergeIterations').value);
            generateAndDrawMap(numCells, mergeIterations);
            console.log(`applyPreset called with preset: ${presetName}`);
        }
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

    // モーダルを表示する関数
    function showSaveLoadModal() {
        saveLoadModal.style.display = 'flex';
    }

    // モーダルを閉じる関数
    function closeSaveLoadModal() {
        saveLoadModal.style.display = 'none';
    }

    // ボタンをクリックしてモーダルを表示
    document.getElementById('saveloadMapButton').addEventListener('click', showSaveLoadModal);

    // 閉じるボタンでモーダルを閉じる
    closeModalButton.addEventListener('click', closeSaveLoadModal);

    // 地図と設定をキャッシュに保存
document.getElementById('saveToCache').addEventListener('click', () => {
    const settings = {
        numCells: document.getElementById('numCells').value,
        mergeIterations: document.getElementById('mergeIterations').value,
        tickInterval: document.getElementById('tickInterval').value,
        absorptionPattern: absorptionPatternSelect.value,
        capitalToggle: capitalToggle.checked,
        cityToggle: cityToggle.checked,
        randomAbsorptionToggle: randomAbsorptionToggle.checked,
        cityRequirement: document.getElementById('cityRequirement').value,
        showBordersOnly: document.getElementById('showBordersOnlyToggle').checked,
        elevationToggle: document.getElementById('elevationToggle').checked // 追加
    };

    const mapData = {
        cells: cells.map(cell => ({
            points: cell.points,
            color: cell.color,
            elevation: cell.elevation,
            elevationColor: cell.elevationColor,
            neighbors: cell.neighbors
        })),
        capitals: Array.from(capitals.entries()).map(([cell, color]) => ({
            cellIndex: cells.indexOf(cell),
            color
        })),
        cities: cities.map(city => cells.indexOf(city)),
        settings: settings
    };

    localStorage.setItem('savedMapAndSettings', JSON.stringify(mapData));
    alert('地図と設定がキャッシュに保存されました！');
    closeSaveLoadModal();
});
// 地図と設定をファイルに保存
document.getElementById('saveToFile').addEventListener('click', () => {
    const settings = {
        numCells: document.getElementById('numCells').value,
        mergeIterations: document.getElementById('mergeIterations').value,
        tickInterval: document.getElementById('tickInterval').value,
        absorptionPattern: absorptionPatternSelect.value,
        capitalToggle: capitalToggle.checked,
        cityToggle: cityToggle.checked,
        randomAbsorptionToggle: randomAbsorptionToggle.checked,
        cityRequirement: document.getElementById('cityRequirement').value,
        showBordersOnly: document.getElementById('showBordersOnlyToggle').checked,
        elevationToggle: document.getElementById('elevationToggle').checked // 追加
    };

    const mapData = {
        cells: cells.map(cell => ({
            points: cell.points,
            color: cell.color,
            elevation: cell.elevation,
            elevationColor: cell.elevationColor,
            neighbors: cell.neighbors
        })),
        capitals: Array.from(capitals.entries()).map(([cell, color]) => ({
            cellIndex: cells.indexOf(cell),
            color
        })),
        cities: cities.map(city => cells.indexOf(city)),
        settings: settings
    };

    const blob = new Blob([JSON.stringify(mapData)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'TCS-MapAndSettings.json';
    link.click();
    closeSaveLoadModal();
});
// キャッシュからロード
document.getElementById('loadFromCache').addEventListener('click', () => {
    const savedData = localStorage.getItem('savedMapAndSettings');
    if (savedData) {
        try {
            const mapData = JSON.parse(savedData);

            // 地図データのロード
            cells = mapData.cells.map(cellData => ({
                points: cellData.points,
                color: cellData.color,
                elevation: cellData.elevation,
                elevationColor: cellData.elevationColor,
                neighbors: cellData.neighbors
            }));

            // 首都データの復元
            capitals.clear();
            mapData.capitals.forEach(({ cellIndex, color }) => {
                if (cells[cellIndex]) {
                    capitals.set(cells[cellIndex], color);
                }
            });

            // 都市データの復元
            cities = mapData.cities.map(index => cells[index]).filter(cell => cell);

            // 設定のロード
            const settings = mapData.settings;
            document.getElementById('numCells').value = settings.numCells;
            document.getElementById('mergeIterations').value = settings.mergeIterations;
            document.getElementById('tickInterval').value = settings.tickInterval;
            absorptionPatternSelect.value = settings.absorptionPattern;
            capitalToggle.checked = settings.capitalToggle;
            cityToggle.checked = settings.cityToggle;
            randomAbsorptionToggle.checked = settings.randomAbsorptionToggle;
            document.getElementById('cityRequirement').value = settings.cityRequirement;
            document.getElementById('showBordersOnlyToggle').checked = settings.showBordersOnly;
            document.getElementById('elevationToggle').checked = settings.elevationToggle; // 追加

            // 地図の再描画
            showBordersOnly = settings.showBordersOnly;
            elevationToggle = settings.elevationToggle; // 状態を反映
            drawCells();

            alert('地図と設定がキャッシュからロードされました！');
        } catch (e) {
            alert('キャッシュからの読み込みに失敗しました。');
        }
    } else {
        alert('キャッシュに保存された地図と設定が見つかりません。');
    }
    closeSaveLoadModal();
});
// ファイルからロード
document.getElementById('loadFromFile').addEventListener('click', () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const mapData = JSON.parse(reader.result);

                // 地図データのロード
                cells = mapData.cells.map(cellData => ({
                    points: cellData.points,
                    color: cellData.color,
                    elevation: cellData.elevation,
                    elevationColor: cellData.elevationColor,
                    neighbors: cellData.neighbors
                }));

                // 首都データの復元
                capitals.clear();
                mapData.capitals.forEach(({ cellIndex, color }) => {
                    if (cells[cellIndex]) {
                        capitals.set(cells[cellIndex], color);
                    }
                });

                // 都市データの復元
                cities = mapData.cities.map(index => cells[index]).filter(cell => cell);

                // 設定のロード
                const settings = mapData.settings;
                document.getElementById('numCells').value = settings.numCells;
                document.getElementById('mergeIterations').value = settings.mergeIterations;
                document.getElementById('tickInterval').value = settings.tickInterval;
                absorptionPatternSelect.value = settings.absorptionPattern;
                capitalToggle.checked = settings.capitalToggle;
                cityToggle.checked = settings.cityToggle;
                randomAbsorptionToggle.checked = settings.randomAbsorptionToggle;
                document.getElementById('cityRequirement').value = settings.cityRequirement;
                document.getElementById('showBordersOnlyToggle').checked = settings.showBordersOnly;
                document.getElementById('elevationToggle').checked = settings.elevationToggle; // 追加

                // 地図の再描画
                showBordersOnly = settings.showBordersOnly;
                elevationToggle = settings.elevationToggle; // 状態を反映
                drawCells();

                alert('地図と設定がロードされました！');
            } catch (e) {
                alert('ファイルの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    });
    input.click();
    closeSaveLoadModal();
});


    // 背景クリックでモーダルを閉じる
    window.addEventListener('click', (event) => {
        if (event.target === saveLoadModal) {
            closeSaveLoadModal();
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
        // console.log(expansionMultipliers)
        // console.log('initializeExpansionMultipliers 開始');
        // initializeExpansionMultipliers()
        // console.log('initializeExpansionMultipliers 完了');

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

        // ノイズマップの生成
        const noiseWidth = 50; // ノイズ領域の横幅
        const noiseHeight = 50; // ノイズ領域の高さ
        const noiseMap = generateNoiseMap(width, height, noiseWidth, noiseHeight, 0.05);

        const cells = points.map((_, i) => {
            const cell = voronoi.cellPolygon(i);
            const selectedColor = getRandomColor();
            return cell ? {
                points: closeGaps(cell),
                color: selectedColor,
                neighbors: Array.from(delaunay.neighbors(i)),
                elevation: 0,          // 初期値
                elevationColor: null,  // 初期値
            } : null;
        }).filter(cell => cell);

        // セルに標高データと色を割り当てる
        assignElevationAndColorToCells(cells, noiseMap, width, height);

        return cells;
    }

    function assignElevationAndColorToCells(cells, noiseMap, canvasWidth, canvasHeight) {
        cells.forEach(cell => {
            // セルの重心座標を計算
            const centroid = cell.points.reduce(
                (acc, [x, y]) => {
                    acc.x += x;
                    acc.y += y;
                    return acc;
                },
                { x: 0, y: 0 }
            );

            centroid.x /= cell.points.length;
            centroid.y /= cell.points.length;

            // ノイズマップから標高値を取得
            const gridX = Math.floor((centroid.x / canvasWidth) * noiseMap[0].length);
            const gridY = Math.floor((centroid.y / canvasHeight) * noiseMap.length);
            const elevation = noiseMap[gridY][gridX];

            // 標高をセルに保存
            cell.elevation = elevation;

            // 標高に基づく色を計算して保存
            cell.elevationColor = elevationToColor(elevation);
        });
    }


    function elevationToColor(elevation) {
        // 標高値をグレーの濃さに変換
        const grayValue = Math.floor(255 * (1 - elevation)); // 255 (白) 〜 0 (黒) にスケーリング
        const color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`; // グレースケール
        // console.log(`Elevation: ${elevation}, Color: ${color}`); // 色のログを確認
        return color;
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
                selectedColor = selectColorByPattern(neighborColors, absorptionPattern, cell.color, index);
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
    function selectColorByPattern(neighborColors, pattern, selfColor, selfIndex) {
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

            const neighborIndices = cells.neighbors || [];
            if (elevationToggle) {
                const selfElevation = cells[selfIndex]?.elevation || 0; // 現在のセルの標高
                const neighborElevations = neighborIndices.map(i => cells[i]?.elevation || 0); // 隣接セルの標高
                const dominantElevation = neighborElevations[neighborColors.indexOf(dominantColor)] || 0;

                // 標高差を計算
                const elevationDifference = Math.abs(dominantElevation - selfElevation);

                // 標高差に基づいて優先度を調整
                if (dominantElevation > selfElevation) {
                    // 自分より高い場合、差が大きいほど優先度を強化
                    colorCounts[dominantColor] *= 0.65 + elevationDifference; // 差が1なら2倍、0.5なら1.5倍
                } else if (dominantElevation < selfElevation) {
                    // 自分より低い場合、差が大きいほど優先度を弱化
                    colorCounts[dominantColor] /= 0.65 + elevationDifference; // 差が1なら半減、0.5なら1.33倍
                }
            }

            if (selfColorCount == dominantColor) {
                return selfColor;
            }
            else {
                // 自分自身が接している色の数

                const selfDiversity = globalSortedColors[selfColor]?.length * 10 || 1; // 自分の隣接色の数
                const dominantDiversity = globalSortedColors[dominantColor]?.length * 10 || 1; // 相手の隣接色の数


                // console.log(`隣接色（自分）: ${selfDiversity}, 隣接色（敵）: ${dominantDiversity}`);

                // グローバルカウントを取得
                const selfGlobalCount = expansionMultipliers[selfColor] * (colorCount[selfColor] || 0) / selfDiversity;
                const dominantGlobalCount = expansionMultipliers[dominantColor] * (colorCount[dominantColor] || 0) / dominantDiversity;

                const totalDifferenceFactor = dominantGlobalCount / (selfGlobalCount + 1);
                // console.log(`selfGlobalCount: ${selfGlobalCount}, dominantGlobalCount: ${dominantGlobalCount}`);
                // console.log(`selfColor: ${selfColor} (count: ${selfGlobalCount}), dominantColor: ${dominantColor} (count: ${dominantGlobalCount})`);
                // console.log(`Total Difference Factor: ${totalDifferenceFactor}`);
                if (selfGlobalCount * 100 < dominantGlobalCount) {
                    return dominantColor;
                }
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

            if (selfColorCount == dominantColor) {
                return selfColor;
            }
            else {
                const selfGlobalCount = expansionMultipliers[selfColor] * colorCount[selfColor] || 0;
                const dominantGlobalCount = expansionMultipliers[dominantColor] * colorCount[dominantColor] || 0;

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
            if (selfColorCount == dominantColor) {
                return selfColor;
            }
            else {
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
        const selectedColor = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
        expansionMultipliers[selectedColor] = 1; // 初期値を1に設定
        return selectedColor;
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
            expansionMultipliers['#0000FF'] = 1;
            expansionMultipliers['#FF0000'] = 1;
            expansionMultipliers['#00FF00'] = 1;
            expansionMultipliers['#FFFF00'] = 1; // 初期値を1に設定
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
        } else if (type === 'battleRoyale2') {
            // Battle Royale Mode: Set 100 random colors, rest white
            const randomColorSet = Array.from({ length: 250 }, () => getRandomColor());
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
        const zoomFactor = Math.min(Math.max(0.5, scale + zoomAmount), 3) / scale;

        // マウス座標を取得
        const mouseX = e.clientX - canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - canvas.getBoundingClientRect().top;

        // ズームの中心を計算
        origin.x -= (mouseX - origin.x) * (zoomFactor - 1);
        origin.y -= (mouseY - origin.y) * (zoomFactor - 1);

        // ズーム倍率を更新
        scale = Math.min(Math.max(0.5, scale + zoomAmount), 3);
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();

        // ズームとドラッグを反映
        ctx.translate(origin.x, origin.y);
        ctx.scale(scale, scale);

        const useElevation = document.getElementById('elevationToggle').checked;

        // 1. 標高を背景に描画
        if (useElevation) {
            cells.forEach(cell => {
                ctx.fillStyle = cell.elevationColor; // 保存された色を使用
                ctx.beginPath();
                ctx.moveTo(cell.points[0][0], cell.points[0][1]);
                for (let i = 1; i < cell.points.length; i++) {
                    ctx.lineTo(cell.points[i][0], cell.points[i][1]);
                }
                ctx.closePath();
                ctx.fill();
            });
        }

        // 2. 半透明でセルの色を重ねる
        ctx.globalAlpha = 0.5; // 半透明度を設定
        cells.forEach(cell => {
            ctx.fillStyle = cell.color; // セルの色を設定
            ctx.beginPath();
            ctx.moveTo(cell.points[0][0], cell.points[0][1]);
            for (let i = 1; i < cell.points.length; i++) {
                ctx.lineTo(cell.points[i][0], cell.points[i][1]);
            }
            ctx.closePath();
            ctx.fill();
        });
        ctx.globalAlpha = 1.0; // 透明度をリセット

        // 国境線の描画（異なる色のセル間の境界のみ）
        cells.forEach(cell => {
            cell.neighbors.forEach(neighborIndex => {
                const neighbor = cells[neighborIndex];
                if (!neighbor) return;

                if (showBordersOnly && cell.color === neighbor.color) return;

                ctx.beginPath();
                const points = cell.points;
                for (let i = 0; i < points.length; i++) {
                    const start = points[i];
                    const end = points[(i + 1) % points.length];
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
            // 拡張倍率を取得し、実質領地数を計算
            const multiplier = expansionMultipliers[color] || 1; // 倍率（初期値1）

            const adjustedCount = count * multiplier; // 実質領地数

            // ランキング項目を作成
            const listItem = document.createElement('p');
            console.log(color);
            console.log(`実質倍率${expansionMultipliers[color]}`);
            console.log(expansionMultipliers);

            if (expansionMultipliers[color] == 1) {
                listItem.innerHTML = `
                    <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                    <span>${count} 領地</span>
                `;
            }
            else {
                listItem.innerHTML = `
                <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                <span>${count} 領地</span>
                <span style="margin-left: 10px;">(倍率: ${multiplier.toFixed(2)}, 実質: ${adjustedCount.toFixed(2)} 領地)</span>
            `;
            }
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
    // function initializeExpansionMultipliers() {
    //     const colors = new Set(cells.map(cell => cell.color));
    //     colors.forEach(color => {
    //         expansionMultipliers[color] = 1; // 初期値を1に設定
    //     });
    // }
    document.getElementById('setMultiplierButton').addEventListener('click', () => {
        const color = document.getElementById('colorPicker').value;
        const multiplier = parseFloat(document.getElementById('multiplierInput').value);

        if (isNaN(multiplier) || multiplier < 0) {
            alert("倍率は0以上の数値を入力してください。");
            return;
        }

        expansionMultipliers[color] = multiplier; // 倍率を更新
        alert(`色 ${color} の倍率を ${multiplier} に設定しました。`);
    });

    function generateNoiseMap(mapWidth, mapHeight, noiseWidth = 50, noiseHeight = 50, scale = 0.05) {
        const simplex = new SimplexNoise();
        const noiseMap = [];

        // 小さなノイズ領域を生成
        for (let y = 0; y < noiseHeight; y++) {
            const row = [];
            for (let x = 0; x < noiseWidth; x++) {
                const noiseValue = simplex.noise2D(x * scale, y * scale);
                const normalizedValue = (noiseValue + 1) / 2; // 0〜1に正規化
                row.push(normalizedValue);
            }
            noiseMap.push(row);
        }

        // マップの幅・高さに合わせてスケーリング
        const scaledNoiseMap = [];
        for (let y = 0; y < mapHeight; y++) {
            const row = [];
            for (let x = 0; x < mapWidth; x++) {
                // ノイズ領域をスケールしてアクセス
                const noiseX = Math.floor((x / mapWidth) * noiseWidth);
                const noiseY = Math.floor((y / mapHeight) * noiseHeight);
                row.push(noiseMap[noiseY][noiseX]);
            }
            scaledNoiseMap.push(row);
        }

        return scaledNoiseMap;
    }

    // 現在選択中のセルを保持
    let selectedCell = null;

    // クリックイベントでセルを選択し、カラーピッカーに反映
    canvas.addEventListener('click', (event) => {
        const rect = canvas.getBoundingClientRect();

        // マウスクリック位置を取得（CSSピクセル座標系）
        const cssX = event.clientX - rect.left;
        const cssY = event.clientY - rect.top;

        // キャンバスの描画座標系に変換
        const mapX = (cssX - origin.x) / scale;
        const mapY = (cssY - origin.y) / scale;

        console.log(`クリック座標 (地図座標系): (${mapX.toFixed(2)}, ${mapY.toFixed(2)})`);

        // 該当するセルを検索
        selectedCell = cells.find(cell => isPointInsidePolygon(mapX, mapY, cell.points));

        if (selectedCell) {
            console.log(`選択したセルの色: ${selectedCell.color}`);
            // カラーピッカーにセルの色を反映
            const colorPicker = document.getElementById('colorPicker');
            if (colorPicker) {
                colorPicker.value = rgbToHex(selectedCell.color); // RGBを16進数に変換して設定
            }
            // セルを強調表示
            // highlightCell(selectedCell, ctx);
        } else {
            console.log('クリック位置にセルが見つかりませんでした。');
        }
    });

    // カラーピッカーの値が変更されたときにセルの色を更新
    const colorPicker = document.getElementById('colorPicker');
    colorPicker.addEventListener('input', (event) => {
        if (selectedCell) {
            // セルの色をカラーピッカーの色に変更
            selectedCell.color = event.target.value;
            console.log(`セルの色を ${selectedCell.color} に変更しました`);
            drawCells(); // 色変更後に再描画
        }
    });

    function highlightCell(cell, context) {
        context.save();
        context.translate(origin.x, origin.y); // パンの適用
        context.scale(scale, scale); // ズームの適用

        context.lineWidth = 3 / scale; // ズームに応じた線の太さ
        context.strokeStyle = 'red';

        context.beginPath();
        const points = cell.points;
        context.moveTo(points[0][0], points[0][1]);
        for (let i = 1; i < points.length; i++) {
            context.lineTo(points[i][0], points[i][1]);
        }
        context.closePath();
        context.stroke();

        context.restore();
    }

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

    // RGB値をHexコードに変換
    function rgbToHex(color) {
        // 既に16進数形式の場合、そのまま返す
        if (color.startsWith('#') && color.length === 7) {
            return color;
        }

        // RGB形式の場合に16進数に変換
        const rgbArray = color.match(/\d+/g);

        if (!rgbArray || rgbArray.length !== 3) {
            console.error(`無効なRGB形式: ${color}`);
            return '#000000'; // デフォルトは黒
        }

        return `#${rgbArray
            .map(c => parseInt(c, 10).toString(16).padStart(2, '0'))
            .join('')}`;
    }



    window.addEventListener('resize', resizeCanvas);
    resizeCanvas(); // 初期化時にもキャンバスサイズを設定

    // 初期地図の生成
    generateAndDrawMap(100, 0);
    centerMap();

    updateColorAdjacencyRanking(10);
});
