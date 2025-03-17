document.addEventListener('DOMContentLoaded', () => {

    /*きゃぁこんなところを見るなんて！
    さては中身を見ようとしたね！
    私もよくわかってないから大丈夫！
    スペースとかエンターとかコメントを削除して送信量を減らせという言葉は聞こえません
    */

    // 初期表示として「地図設定」タブを表示
    showTab('settingsTab');
    // 必須要素の取得
    const WHITE_COLOR = '#FFFFFF'; // 空白地帯の色
    let cities = [];
    const canvas = document.getElementById('mapCanvas');
    const ctx = canvas.getContext('2d');
    const regenerateButton = document.getElementById('regenerateButton');
    // const saveButton = document.getElementById('saveButton');
    // const loadButton = document.getElementById('loadButton');
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
    let elevationToggle = document.getElementById('elevationToggle');
    const waterToggle = document.getElementById('waterToggle');
    const oceanSlider = document.getElementById('oceanSlider');
    const initializeMapButton = document.getElementById('initializeMapButton');
    const toggleWaterModeButton = document.getElementById('toggleWaterModeButton');
    const sidebarButtons = document.querySelectorAll('#sidebar button'); // サイドバー内の全てのボタン
    const waterRangeSlider = document.getElementById('waterRange');
    const toggleRemoveWaterModeButton = document.getElementById('toggleRemoveWaterModeButton');
    let useRandomNames = document.getElementById('useRandomNamesToggle').checked;
    const elevationSlider = document.getElementById('elevationSlider');
    const uniformElevationButton = document.getElementById('uniformElevationButton');
    const modifyElevationSlider = document.getElementById('modifyElevationSlider');
    const modifyElevationModeButton = document.getElementById('modifyElevationModeButton');
    const applyCountryNameButton = document.getElementById('applyCountryNameButton');
    const countryNameInput = document.getElementById('countryNameInput');
    const selectedCountryName = document.getElementById('selectedCountryName');
    const nationColorPicker = document.getElementById('nationColorPicker');
    const nationNameLabel = document.getElementById('nationNameLabel');
    const nationNameInput = document.getElementById('nationNameInput');
    const applyNationNameButton = document.getElementById('applyNationNameButton');
    const toggleNationEditModeButton = document.getElementById('toggleNationEditMode');
    const toggleNationNameEditModeButton = document.getElementById('toggleNationNameEditMode');

    let isWaterModeActive = false;
    let isNationEditModeActive = false;

    // 名前リストの定義
    //自分用メモ https://ja.wikipedia.org/wiki/%E5%9C%B0%E5%90%8D%E6%8E%A5%E5%B0%BE%E8%BE%9E
    const prefixes = ["アルペルガ", "クログスタ", "ドルケスタ", "バルトラン", "エリタリア",//元ネタのない国達
        "オールグア", "フルナスタ", "ブルザリア", "ロアノース", "ドツロセン",//オーストリア　フランス　ブリタニア（イギリス） ロシア　ドイツ
        "ニホロニア", "ハルガスト", "スペニシア", "ポラノキガル", "イテレシア",//日本　ハンガリー　スペイン　ポルトガル　イタリア
        "アルメブルク", "カダラーナ", "メキロタリア", "ハーフルト", "トルカニカ",//アメリカ　カナダ　メキシコ　ハンガリー　トルコ
        "カルガリズム", "トホロウナ", "キアダム", "ノイブルク", "ヴァイマリカ",//ネタの集団ーカルガリズム 東北　近畿　九州　ドイツ国(ヴァイマール共和国)
        "ルーネ", "ソラー", "エーデル", "チョコ", "バウム"//ネタの集団 月(luna)　太陽(solaris) 地球(Erde) .w. .w.
    ];
    const suffixes = ["帝国", "王国", "共和国", "連邦共和国", "公国",
        "二重帝国", "自治領", "宗教国家", "共産国家", "軍事国家", "連邦",
        "合衆国", "鳥国", "国"];

    /*　ここを見てる人になんとなく説明！！！  wikiから引用してるのもあるよ。tyfr!
    帝国: 帝政を敷いている国、通常は広大な領地を持つ国を指します。
    王国: 国王を頂点とする国。
    共和国: 国民によって選ばれた政府が統治する国。
    連邦共和国: 複数の地域（州や国）が集まって一つの国家を形成する共和国。
    公国: 公（君主）が統治する比較的小規模な領地。
    二重帝国: 複数の国や地域が連合して形成された帝国（例: オーストリア＝ハンガリー帝国）。
    自治領: 自治権を持つ地域（例: カナダやオーストラリアの一部の歴史的領域）。
    宗教国家: 宗教が支配的な役割を持つ国。
    共産国家: 共産主義のイデオロギーに基づく国家。
    軍事国家: 軍事力が政治を主導する国家。
    連邦: 2つ以上の国（州）が1つの主権の下に結合して形成する国家形態
    民主共和国: 民主政治と共和国の利点を兼ね備えている制度である。 国民は政府へ様々な権力を与え、政府は国民から与えられた権力の範囲内で政治を行う。
    合衆国: 二つ以上の国家（州）が連合してできた、単一の国家。構成各国家には外交権はない。
    鳥国: 鳥を頂点とする国。(独創国家体制)
    国: たまにある国だけで終わる奴ら。なんでこうなったんだろう(例:エリトリア国)
    */


    // ランダム名生成関数
    function generateRandomName() {
        const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    
        if (suffix === "二重帝国") {
            if (prefixes.length >= 2) {
                const prefixA = prefixes[Math.floor(Math.random() * prefixes.length)];
                let prefixB;
                do {
                    prefixB = prefixes[Math.floor(Math.random() * prefixes.length)];
                } while (prefixA === prefixB); // **同じものを選ばないようにする**
    
                return `${prefixA}=${prefixB}${suffix}`;
            } else {
                // **prefix が 1 つしかない場合はそのまま結合**
                return `${prefixes[0]}${suffix}`;
            }
        } else {
            // **通常の処理**
            const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
            return `${prefix}${suffix}`;
        }
    }
    // 色コードに対応する名前マップを生成
    let colorToNameMap = {}; // 色コード → 国名のマッピング

    function assignNamesToRegions(cells) {
        colorToNameMap = {}; // 初期化（色と名前の対応を保持）
        useRandomNames = document.getElementById('useRandomNamesToggle').checked;

        cells.forEach(cell => {
            if (useRandomNames) {
                // 色がまだマップに存在しない場合は新しい名前を生成してマップに追加
                if (!colorToNameMap[cell.color]) {
                    if(cell.color === "#FFFFFF")
                    {
                        colorToNameMap[cell.color] = "未開拓地"
                    }
                    else
                    {
                        colorToNameMap[cell.color] = generateRandomName();
                    }
                }
            } else {
                // ランダム名を使用しない場合は色コードをそのまま名前として利用
                if (!colorToNameMap[cell.color]) {
                    colorToNameMap[cell.color] = `Color ${cell.color}`; // 色コードを名前として使用
                }
            }
        });

        console.log("色と名前の対応が設定されました:", colorToNameMap); // デバッグ用
    }

    function getOrCreateNameForColor(color, useRandomNames) {
        // 名前が既に存在する場合はそれを返す
        if (colorToNameMap[color]) {
            return colorToNameMap[color];
        }

        // 名前が存在しない場合、ランダム生成するか、色コードを名前にする
        let name;
        if (useRandomNames) {
            name = generateRandomName(); // ランダム名を生成
        } else {
            name = `Color ${color}`; // 色コードをそのまま名前として使用
        }

        // マップに新しい名前を登録
        colorToNameMap[color] = name;

        return name; // 生成した名前を返す
    }

    document.getElementById('showCountryNamesToggle').addEventListener('change', () => {
        drawCells(); // 設定変更後に再描画
    });
    
    // **国名を描画**
let previousLabelPositions = {};  // { color: { cell, initialFontSize } }
let updateCounter = 0;  // 更新回数カウンター
let colorUpdateCounters = {}; // 色ごとの更新カウンター
const K = 50;  // 反比例のバランス調整定数

function drawRegionNames(ctx, cells) {
    if (!document.getElementById('showCountryNamesToggle').checked) return;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let countryLabels = {};
    let regionBounds = {};

    // **国ごとのセルを収集**
    cells.forEach(cell => {
        if (!cell.points || cell.color === "#FFFFFF") return;

        const regionName = colorToNameMap[cell.color];
        if (!regionName) return;

        if (!countryLabels[cell.color]) {
            countryLabels[cell.color] = [];
            regionBounds[cell.color] = findRegionBounds(cell.color, cells);
        }

        countryLabels[cell.color].push(cell);
    });

    Object.keys(countryLabels).forEach(color => {
        if (!(color in colorUpdateCounters)) {
            colorUpdateCounters[color] = Math.floor(Math.random() * 100); // 初期値をランダム化
        }

        let numCells = countryLabels[color].length;
        let updateProbability = K / (numCells + K);  // 反比例する確率

        let bestCell = previousLabelPositions[color]?.cell || null;
        let initialFontSize = previousLabelPositions[color]?.initialFontSize || null;

        // **確率に応じてフォントサイズを再計算**
        if ((colorUpdateCounters[color] % 500 === 0 || Math.random() < updateProbability) || !bestCell) {
            // **新しい最適セルを取得**
            let newBestCell = selectBestLabelCell(regionBounds[color], countryLabels[color]);
            let newFontSize = calculatePreciseFontSize(ctx, regionBounds[color], colorToNameMap[color], newBestCell, cells);

            // **フォントサイズの比較**
            if (previousLabelPositions[color]) {
                let prevFontSize = previousLabelPositions[color].initialFontSize;
                
                if (newFontSize < prevFontSize || newFontSize < prevFontSize * 0.8) {
                    // **前回のセルを継承し、そのセルで再計算**
                    newBestCell = previousLabelPositions[color].cell;
                    newFontSize = calculatePreciseFontSize(ctx, regionBounds[color], colorToNameMap[color], newBestCell, cells);
                }
            }

            // **更新**
            previousLabelPositions[color] = { cell: newBestCell, initialFontSize: newFontSize };
        } else {
            // 1回前のフォントサイズを継承
            let fontSize = initialFontSize;

            // フォントサイズが前回の50%以下なら再計算
            if (fontSize < initialFontSize * 0.5) {
                bestCell = selectBestLabelCell(regionBounds[color], countryLabels[color]);
                fontSize = calculatePreciseFontSize(ctx, regionBounds[color], colorToNameMap[color], bestCell, cells);
                previousLabelPositions[color] = { cell: bestCell, initialFontSize: fontSize };
            }
        }

        if (!bestCell) return;

        let fontSize = previousLabelPositions[color].initialFontSize;
        ctx.font = `${fontSize}px Arial`;
        ctx.fillStyle = "#000000";

        let centroid = getCellCentroid(bestCell);
        ctx.fillText(colorToNameMap[color], centroid.x, centroid.y);

        colorUpdateCounters[color]++; // 色ごとのカウンターを更新
    });

    updateCounter++;
}
// **国の領土範囲を取得**
function findRegionBounds(color, cells) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    let totalX = 0, totalY = 0, count = 0;

    cells.forEach(cell => {
        if (cell.color === color) {
            cell.points.forEach(([x, y]) => {
                minX = Math.min(minX, x);
                maxX = Math.max(maxX, x);
                minY = Math.min(minY, y);
                maxY = Math.max(maxY, y);

                totalX += x;
                totalY += y;
                count++;
            });
        }
    });

    return {
        minX, maxX, minY, maxY,
        width: maxX - minX,
        height: maxY - minY,
        area: (maxX - minX) * (maxY - minY),
        centerX: totalX / count,
        centerY: totalY / count,
    };
}

// **最適な国名の配置セルを選ぶ**
function selectBestLabelCell(regionBounds, cells) {
    let bestCell = null;
    let maxFontSize = 0;

    // **すべてのセルをしっかりループ**
    for (let i = 0; i < cells.length; i++) {
        if(Math.random() >= (1/(cells.length)*1.5) && bestCell !== null) continue;
        let cell = cells[i];

        // **このセルでフォントサイズを計算**
        let fontSize = calculatePreciseFontSize(ctx, regionBounds, colorToNameMap[cell.color], cell, cells);

        // **最大のフォントサイズが取れるセルを更新**
        if (fontSize > maxFontSize) {
            maxFontSize = fontSize;
            bestCell = cell;
        }
    }

    return bestCell;
}

function calculatePreciseFontSize(ctx, regionBounds, regionName, cell, cells) {
    let maxFontSize = Math.min(regionBounds.width * 0.5 / regionName.length, regionBounds.height * 0.5);
    let fontSize = maxFontSize;

    ctx.font = `${fontSize}px Arial`;
    let textWidth = ctx.measureText(regionName).width;
    let textHeight = fontSize; // 仮の高さ

    while ((textWidth > regionBounds.width * 0.8 || !isFontColorConsistent(cell, textWidth, textHeight, cells)) && fontSize > 10) {
        fontSize /= 1.2;
        ctx.font = `${fontSize}px Arial`;
        textWidth = ctx.measureText(regionName).width;
        textHeight = fontSize; // 仮の高さ更新
    }

    return Math.max(fontSize, 10);
}

// フォントの上下左右のセルの色がすべて一致しているか判定する関数
function isFontColorConsistent(cell, textWidth, textHeight, cells) {
    const regionColor = cell.color;

    // 文字の範囲の4隅を計算
    const topLeft = { x: cell.points[0][0] - textWidth / 2, y: cell.points[0][1] - textHeight / 2 };
    const topRight = { x: cell.points[0][0] + textWidth / 2, y: cell.points[0][1] - textHeight / 2 };
    const bottomLeft = { x: cell.points[0][0] - textWidth / 2, y: cell.points[0][1] + textHeight / 2 };
    const bottomRight = { x: cell.points[0][0] + textWidth / 2, y: cell.points[0][1] + textHeight / 2 };

    return [topLeft, topRight, bottomLeft, bottomRight].every(point => {
        const surroundingCell = findCellAtPoint(point, cells);
        return surroundingCell && surroundingCell.color === regionColor;
    });
}

// 指定座標のセルを検索する関数
function findCellAtPoint(point, cells) {
    return cells.find(cell => isPointInsidePolygon(point.x, point.y, cell.points));
}

// 点がポリゴン内部にあるか判定する関数（点がセルの領域に含まれるかチェック）
function isPointInsidePolygon(x, y, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i][0], yi = polygon[i][1];
        const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > y) !== (yj > y)) &&
            (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// **セルの中心座標を取得**
function getCellCentroid(cell) {
    if (!cell.points || cell.points.length === 0) return null;

    const { x, y } = cell.points.reduce((acc, [px, py]) => {
        acc.x += px;
        acc.y += py;
        return acc;
    }, { x: 0, y: 0 });

    return {
        x: x / cell.points.length,
        y: y / cell.points.length,
    };
}

// **セルの面積を計算**
function calculateCellArea(cell) {
    let area = 0;
    const points = cell.points;
    for (let i = 0; i < points.length; i++) {
        let j = (i + 1) % points.length;
        area += (points[i][0] * points[j][1]) - (points[j][0] * points[i][1]);
    }
    return Math.abs(area / 2);
}

    let showBordersOnly = false; // 初期設定はオフ
    let globalSortedColors = []; // グローバル変数として定義
    let expansionMultipliers = []; // 色ごとの領土拡張倍率
    let isCanvasStopped = false; // キャンバス操作を停止するフラグ

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
    // if (!canvas || !ctx || !regenerateButton || !saveButton || !loadButton || !singleMergeButton || !multiMergeButton || !toggleAutoMergeButton || !randomAbsorptionToggle || !capitalToggle || !absorptionPatternSelect) {
    //     console.error("必要な要素が見つかりませんでした。HTMLを確認してください。");
    //     return;
    // }

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
            document.getElementById('randomAbsorptionToggle').checked = false;
            document.getElementById('absorptionPattern').value = 'custom-weighted';
            document.getElementById('showBordersOnlyToggle').checked = true;
            document.getElementById('elevationToggle').checked = true;
            document.getElementById('waterToggle').checked = true;
            document.getElementById('disableWaterCitiesToggle').checked = true;
            document.getElementById('useRandomNamesToggle').checked = true;
            document.getElementById('elevationbuffToggle').checked = true;
            document.getElementById('elevationbuffNumber').value = 0.7;
            document.getElementById('elevationbuffToggle_2').checked = true;
            document.getElementById('elevationbuffNumber_2').value = 0.9;
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
    // saveButton.addEventListener('click', () => {
    //     const settings = {
    //         numCells: document.getElementById('numCells').value,
    //         mergeIterations: document.getElementById('mergeIterations').value,
    //         tickInterval: document.getElementById('tickInterval').value,
    //         absorptionPattern: absorptionPatternSelect.value,
    //         capitalToggle: capitalToggle.checked,
    //         randomAbsorptionToggle: randomAbsorptionToggle.checked
    //     };
    //     localStorage.setItem('mapSettings', JSON.stringify(settings));
    //     alert('設定が保存されました！');
    // });

    // // 設定ロードボタン
    // loadButton.addEventListener('click', () => {
    //     const savedSettings = localStorage.getItem('mapSettings');
    //     if (savedSettings) {
    //         const settings = JSON.parse(savedSettings);
    //         document.getElementById('numCells').value = settings.numCells;
    //         document.getElementById('mergeIterations').value = settings.mergeIterations;
    //         document.getElementById('tickInterval').value = settings.tickInterval;
    //         absorptionPatternSelect.value = settings.absorptionPattern;
    //         capitalToggle.checked = settings.capitalToggle;
    //         randomAbsorptionToggle.checked = settings.randomAbsorptionToggle;
    //         generateAndDrawMap(settings.numCells, settings.mergeIterations);
    //         alert('設定がロードされました！');
    //     } else {
    //         alert('保存された設定がありません。');
    //     }
    // });

    initializeMapButton.addEventListener('click', () => {
        // 入力されたステート数と基本標高を取得
        const numCells = parseInt(document.getElementById('initialNumCells').value);
        const initialElevation = parseFloat(document.getElementById('initialElevation').value);

        // 地図を初期化
        initializeMap(numCells, initialElevation);
    });

    // 地図を初期化する関数
    function initializeMap(numCells, elevation) {
        autoMergeRunning = false;

        // グローバルセルデータを初期化
        cells = generateVoronoiCells(numCells, canvas.width, canvas.height);

        cells.forEach(cell => {
            // 標高を指定された値に設定
            cell.elevation = elevation;
            cell.elevationColor = elevationToColor(elevation);

            // 色を全て白に設定
            cell.color = '#FFFFFF';

            // 水セルフラグをリセット
            cell.isWater = false;
        });

        // 首都や都市データをリセット
        capitals.clear();
        console.log(cities);
        cities = [];
        console.log(cities);

        window.cells = cells;

        assignNamesToRegions(cells);

        // 地図を再描画
        drawCells();
    }

    let currentMode = "none"; // 初期状態（操作なし）

    // ボタンのイベントリスナー
    toggleWaterModeButton.addEventListener('click', () => {
        setMode("addWater");
    });

    toggleRemoveWaterModeButton.addEventListener('click', () => {
        setMode("removeWater");
    });

    modifyElevationModeButton.addEventListener('click', () => {
        setMode("modifyElevation");
    });

    toggleNationEditModeButton.addEventListener('click', () => {
        setMode("nationEditMode");
    });

    toggleNationNameEditModeButton.addEventListener('click', () => {
        setMode("nationNameEditMode");
    })

    toggleNoneModeButton.addEventListener('click', () => {
        setMode("none");
    });

    // モード切り替え関数
    function setMode(mode) {
        currentMode = mode;

        // ボタンのUIを更新
        toggleWaterModeButton.classList.toggle('active_edit', currentMode === "addWater");
        toggleRemoveWaterModeButton.classList.toggle('active_edit', currentMode === "removeWater");
        modifyElevationModeButton.classList.toggle('active_edit', currentMode === "modifyElevation");
        toggleNationEditModeButton.classList.toggle('active_edit', currentMode === "nationEditMode");
        toggleNationNameEditModeButton.classList.toggle('active_edit', currentMode === "nationNameEditMode");

        // キャンバスのカーソルを変更
        canvas.style.cursor = currentMode !== "none" ? "pointer" : "default";

        // モードに応じてキャンバスイベントを切り替え
        if (currentMode === "addWater" || currentMode === "removeWater" || currentMode === "modifyElevation" || currentMode === "nationEditMode" || currentMode === "nationNameEditMode") {
            isCanvasStopped = true;
            enableCanvasInteraction(); // キャンバスイベントを有効化
        } else {
            isCanvasStopped = false;
            disableCanvasInteraction(); // キャンバスイベントを無効化
        }
    }

    // キャンバスイベントの有効化
    function enableCanvasInteraction() {
        canvas.addEventListener('mousedown', startInteraction);
        canvas.addEventListener('mousemove', continueInteraction);
        canvas.addEventListener('mouseup', stopInteraction);
    }

    // キャンバスイベントの無効化
    function disableCanvasInteraction() {
        canvas.removeEventListener('mousedown', startInteraction);
        canvas.removeEventListener('mousemove', continueInteraction);
        canvas.removeEventListener('mouseup', stopInteraction);
    }

    // 操作モードに応じたクリック・ドラッグの処理
    let isInteracting = false;

    function startInteraction(event) {
        if (event.metaKey || event.ctrlKey) return; // Command/Ctrlが押されている場合は無効化
        isInteracting = true;
        handleInteraction(event); // 最初の操作を実行
    }

    function continueInteraction(event) {
        if (!isInteracting) return;
        handleInteraction(event); // ドラッグ中の操作を実行
    }

    function stopInteraction() {
        isInteracting = false; // 操作終了
    }

    // 操作の実行
    function handleInteraction(event) {
        const rect = canvas.getBoundingClientRect();
        const cssX = event.clientX - rect.left;
        const cssY = event.clientY - rect.top;
    
        // キャンバスの描画座標系に変換
        const mapX = (cssX - origin.x) / scale;
        const mapY = (cssY - origin.y) / scale;
    
        // 該当するセルを検索
        const clickedCell = cells.find(cell => isPointInsidePolygon(mapX, mapY, cell.points));
    
        if (clickedCell) {
            const range = parseInt(waterRangeSlider.value); // スライダー値を取得
            if (currentMode === "addWater") {
                setWaterInRange(clickedCell, range); // 水を追加
            } else if (currentMode === "removeWater") {
                removeWaterInRange(clickedCell, range); // 水を抜く
            } else if (currentMode === "modifyElevation") {
                handleElevationChange(clickedCell, range); // 標高変更
            } else if (currentMode === "nationEditMode") {
                // **国家の色を変更**
                setNationColorInRange(clickedCell, range, normalizeHexColor(nationColorPicker.value.toUpperCase()));
            }
            drawCells(); // 地図の再描画
        }
    }    

    applyNationNameButton.addEventListener('click', () => {
        const newName = nationNameInput.value.trim();
        const selectedColor = normalizeHexColor(nationColorPicker.value);
    
        if (newName && selectedColor) {
            colorToNameMap[selectedColor] = newName;
            nationNameLabel.textContent = newName;
            console.log(`国名を変更: ${selectedColor} → ${newName}`);
        } else {
            console.log("無効な入力です");
        }
    });

    function setNationColorInRange(centerCell, range, newColor) {
        let rangeSquared;
        if (range == 1) {
            centerCell.color = newColor;
        } else {
            rangeSquared = range * range * 20; // 距離判定用（範囲の二乗）
            cells.forEach(cell => {
                const dx = cell.points[0][0] - centerCell.points[0][0];
                const dy = cell.points[0][1] - centerCell.points[0][1];
                if (dx * dx + dy * dy <= rangeSquared) {
                    cell.color = newColor;
                }
            });
        }
    }

    function normalizeHexColor(hex) {
        if (!hex.startsWith("#")) return hex; // 既に小文字ならそのまま返す
        return hex.toLowerCase();
    }

    // 範囲内のセルを水セルに設定
    function setWaterInRange(centerCell, range) {
        let rangeSquared;
        if(range==1)
        {
            centerCell.isWater = true;
        }
        else
        {
            rangeSquared = range * range * 20; // 距離判定用（範囲の二乗）
            cells.forEach(cell => {
                const dx = cell.points[0][0] - centerCell.points[0][0];
                const dy = cell.points[0][1] - centerCell.points[0][1];
                if (dx * dx + dy * dy <= rangeSquared && !cell.isWater) {
                    cell.isWater = true;
                }
            });
        }
    }

    // 範囲内のセルから水を抜く
    function removeWaterInRange(centerCell, range) {
        let rangeSquared;
        if(range==1)
        {
            centerCell.isWater = false;
        }
        else
        {
            rangeSquared = range * range * 20; // 距離判定用（範囲の二乗）
            cells.forEach(cell => {
                const dx = cell.points[0][0] - centerCell.points[0][0];
                const dy = cell.points[0][1] - centerCell.points[0][1];
                if (dx * dx + dy * dy <= rangeSquared && cell.isWater) {
                    cell.isWater = false;
                }
            });
        }
    }

    // 指定された範囲のセルの標高を変更する関数
    function handleElevationChange(centerCell, range) {
        let rangeSquared;
        if(range==1)
        {
            centerCell.elevation = newElevation; // 標高を更新
            centerCell.elevationColor = elevationToColor(newElevation); // 色を更新
        }
        else
        {
            rangeSquared = range * range * 20; // 距離判定用（範囲の二乗）
            const newElevation = parseFloat(modifyElevationSlider.value); // スライダー値を取得
    
            cells.forEach(cell => {
                const dx = cell.points[0][0] - centerCell.points[0][0];
                const dy = cell.points[0][1] - centerCell.points[0][1];
    
                // 範囲内のセルを対象に変更
                if (dx * dx + dy * dy <= rangeSquared) {
                    cell.elevation = newElevation; // 標高を更新
                    cell.elevationColor = elevationToColor(newElevation); // 色を更新
                }
            });
        }
    }

    // スライダー値の変更をリアルタイムで反映する
    modifyElevationSlider.addEventListener('input', () => {
        if (currentMode === "modifyElevation") {
            console.log(`スライダーの値: ${modifyElevationSlider.value}`);
        }
    });


    // 標高を統一する処理
    uniformElevationButton.addEventListener('click', () => {
        const uniformElevation = parseFloat(elevationSlider.value);

        // 全セルの標高をスライダーの値に統一
        cells.forEach(cell => {
            cell.elevation = uniformElevation;
            cell.elevationColor = elevationToColor(uniformElevation);
        });

        drawCells(); // 地図を再描画
        console.log(`全てのセルの標高を ${uniformElevation} に統一しました`);
    });

    let autoMergeRunningFlg = false;
    // モーダルを表示する関数
    function showSaveLoadModal() {
        saveLoadModal.style.display = 'flex';
        if (autoMergeRunning) {
            autoMergeRunning = false;
            clearInterval(autoMergeInterval);
            autoMergeInterval = null;
            autoMergeRunningFlg = true;
        }
    }

    // モーダルを閉じる関数
    function closeSaveLoadModal() {
        saveLoadModal.style.display = 'none';
        if (autoMergeRunningFlg) {
            autoMergeRunning = true;
            const tickInterval = parseInt(document.getElementById('tickInterval').value);
            autoMergeLoop(tickInterval);
            autoMergeRunningFlg = false;
        }
    }

    // ボタンをクリックしてモーダルを表示
    document.getElementById('saveloadMapButton').addEventListener('click', showSaveLoadModal);

    // 閉じるボタンでモーダルを閉じる
    closeModalButton.addEventListener('click', closeSaveLoadModal);

    // 共通関数：地図と設定を取得
    function getMapAndSettings() {
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
            elevationToggle: document.getElementById('elevationToggle').checked,
            waterToggle: document.getElementById('waterToggle').checked,
            disableWaterCitiesToggle: document.getElementById('disableWaterCitiesToggle').checked,
            oceanSlider: document.getElementById('oceanSlider').value,
            useRandomNames: document.getElementById('useRandomNamesToggle').checked,
            elevationbuffNumber: document.getElementById('elevationbuffNumber').value,
            elevationbuffToggle: document.getElementById('elevationbuffToggle').checked,
            elevationbuffNumber_2: document.getElementById('elevationbuffNumber_2').value,
            elevationbuffToggle_2: document.getElementById('elevationbuffToggle_2').checked
        };

        const mapData = {
            cells: cells.map(cell => ({
                points: cell.points,
                color: cell.color,
                elevation: cell.elevation,
                elevationColor: cell.elevationColor,
                isWater: cell.isWater, // 水系データ
                neighbors: cell.neighbors
            })),
            capitals: Array.from(capitals.entries()).map(([cell, color]) => ({
                cellIndex: cells.indexOf(cell),
                color
            })),
            cities: cities.map(city => cells.indexOf(city)),
            settings: settings,
            expansionMultipliers: expansionMultipliers,
            colorToNameMap: colorToNameMap
        };

        return mapData;
    }

    // 共通関数：地図と設定を適用
    function applyMapAndSettings(mapData) {
        // 地図データのロード
        cells = mapData.cells.map(cellData => ({
            points: cellData.points,
            color: cellData.color,
            elevation: cellData.elevation,
            elevationColor: cellData.elevationColor,
            isWater: cellData.isWater, // 水系データ復元
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
        document.getElementById('elevationToggle').checked = settings.elevationToggle;
        document.getElementById('waterToggle').checked = settings.waterToggle;
        document.getElementById('disableWaterCitiesToggle').checked = settings.disableWaterCitiesToggle;
        document.getElementById('oceanSlider').value = settings.oceanSlider;
        document.getElementById('useRandomNamesToggle').checked = settings.useRandomNames;
        document.getElementById('elevationbuffNumber').value = settings.elevationbuffNumber;
        document.getElementById('elevationbuffToggle').checked = settings.elevationbuffToggle;
        document.getElementById('elevationbuffNumber_2').value = settings.elevationbuffNumber_2;
        document.getElementById('elevationbuffToggle_2').checked = settings.elevationbuffToggle_2;

        expansionMultipliers = mapData.expansionMultipliers;

        colorToNameMap = mapData.colorToNameMap;

        // 地図の再描画
        showBordersOnly = settings.showBordersOnly;
        elevationToggle = settings.elevationToggle;
        window.cells = cells;
        drawCells();
    }

    // 地図と設定をキャッシュに保存
    document.getElementById('saveToCache').addEventListener('click', () => {
        const mapData = getMapAndSettings();
        localStorage.setItem('savedMapAndSettings', JSON.stringify(mapData));
        alert('地図と設定がキャッシュに保存されました！');
        closeSaveLoadModal();
    });

    // 地図と設定をファイルに保存
    document.getElementById('saveToFile').addEventListener('click', () => {
        const mapData = getMapAndSettings();
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
                applyMapAndSettings(mapData);
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
                    applyMapAndSettings(mapData);
                    alert('地図と設定がロードされました！');
                } catch (e) {
                    alert('ファイルの読み込みに失敗しました。');
                    console.log(e)
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

        console.log('命名');
        assignNamesToRegions(cells);

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
        const disableWaterCities = document.getElementById('disableWaterCitiesToggle').checked;

        colors.forEach(color => {
            const colorCells = cells.filter(cell => cell.color === color && (!cell.isWater || !disableWaterCities));
            if (colorCells.length > 0) {
                const capitalCell = colorCells[Math.floor(Math.random() * colorCells.length)];
                capitals.set(capitalCell, color);
            }
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
                isWater: false,
            } : null;
        }).filter(cell => cell);

        // セルに標高データと色を割り当てる
        assignElevationAndColorToCells(cells, noiseMap, width, height);
        let numWater = Math.floor(numCells / 500)
        if (numWater <= 1) {
            numWater = 1
        }
        generateWaterCells(cells, 1, numWater); // 水セルを生成
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
            if (elevation <= oceanSlider.value) {
                cell.isWater = true;
            }
        });
    }


    function elevationToColor(elevation) {
        // 標高値をグレーの濃さに変換
        const grayValue = Math.floor(255 * (1 - elevation)); // 255 (白) 〜 0 (黒) にスケーリング
        const color = `rgb(${grayValue}, ${grayValue}, ${grayValue})`; // グレースケール
        // console.log(`Elevation: ${elevation}, Color: ${color}`); // 色のログを確認
        return color;
    }

    function generateWaterCells(cells, minSources, maxSources) {
        const highElevationCells = cells.filter(cell => cell.elevation >= 0.9); // 標高0.9以上のセル
        const waterSources = Math.min(
            Math.floor(Math.random() * (maxSources - minSources + 1)) + minSources,
            highElevationCells.length
        ); // 水源の数を決定

        // 選ばれたセルを水源とする
        const selectedSources = [];
        for (let i = 0; i < waterSources; i++) {
            const randomIndex = Math.floor(Math.random() * highElevationCells.length);
            const sourceCell = highElevationCells.splice(randomIndex, 1)[0];
            selectedSources.push(sourceCell);
            spreadWater(cells, sourceCell); // 水を広げる
        }
    }

    // 水を周囲に広げる
    function spreadWater(cells, sourceCell) {
        const queue = [sourceCell]; // 処理対象のセルを保持するキュー
        const processed = new Set(); // 処理済みのセルを追跡
        processed.add(sourceCell);

        while (queue.length > 0) {
            const currentCell = queue.shift(); // キューからセルを取り出す
            currentCell.isWater = true; // 現在のセルを水に設定

            // 隣接セルを処理
            const lowerNeighbors = [];
            const higherNeighbors = [];

            currentCell.neighbors.forEach(neighborIndex => {
                const neighbor = cells[neighborIndex];
                if (!neighbor || processed.has(neighbor)) return; // 無効または既に処理済みの場合はスキップ

                if (neighbor.elevation < (currentCell.elevation + 0.075) && !neighbor.isWater) {
                    lowerNeighbors.push(neighbor);
                } else if (!neighbor.isWater) {
                    higherNeighbors.push(neighbor);
                }
                processed.add(neighbor); // 処理済みに追加
            });

            if (lowerNeighbors.length > 0) {
                // // 周囲に低いセルがある場合、ランダムで1つを水にして広げる
                // const nextCell = lowerNeighbors[Math.floor(Math.random() * lowerNeighbors.length)];
                // queue.push(nextCell);

                // 周囲に低いセルがある場合、最も低いセルを選択して水にする
                const nextCell = lowerNeighbors.reduce((lowest, cell) =>
                    cell.elevation < lowest.elevation ? cell : lowest, lowerNeighbors[0]
                );
                queue.push(nextCell);
            } else if (higherNeighbors.length > 0 && higherNeighbors.every(neighbor => neighbor.elevation > currentCell.elevation)) {
                // 周囲のセルがすべて高い場合、隣接セルを全て水にする
                higherNeighbors.forEach(neighbor => {
                    neighbor.isWater = true;
                    queue.push(neighbor); // このセルも処理対象に追加
                });
            }
        }
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
            let elevationbuffToggle = document.getElementById('elevationbuffToggle');
            let elevationbuffNumber = document.getElementById('elevationbuffNumber');
            if(elevationbuffToggle.checked && cells[selfIndex]?.elevation >= elevationbuffNumber.value)
            {
                if (Math.random() < 0.5) {
                    return selfColor;
                }
            }
            elevationbuffToggle = document.getElementById('elevationbuffToggle_2');
            elevationbuffNumber = document.getElementById('elevationbuffNumber_2');
            if(elevationbuffToggle.checked && cells[selfIndex]?.elevation >= elevationbuffNumber.value)
            {
                if (Math.random() < 0.5) {
                    return selfColor;
                }
            }
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
                // 自分自身が接している色の数

                const selfDiversity = globalSortedColors[selfColor]?.length * 10 || 1; // 自分の隣接色の数
                const dominantDiversity = globalSortedColors[dominantColor]?.length * 10 || 1; // 相手の隣接色の数


                // console.log(`隣接色（自分）: ${selfDiversity}, 隣接色（敵）: ${dominantDiversity}`);

                // グローバルカウントを取得
                let selfGlobalCount = expansionMultipliers[selfColor] * (colorCount[selfColor] || 0) / selfDiversity;
                let dominantGlobalCount = expansionMultipliers[dominantColor] * (colorCount[dominantColor] || 0) / dominantDiversity;
                // console.log(`selfGlobalCount: ${selfGlobalCount}, dominantGlobalCount: ${dominantGlobalCount}`);
                // console.log(`selfColor: ${selfColor} (count: ${selfGlobalCount}), dominantColor: ${dominantColor} (count: ${dominantGlobalCount})`);
                // console.log(`Total Difference Factor: ${totalDifferenceFactor}`);

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
                        dominantGlobalCount *= 0.65 + elevationDifference; // 差が1なら2倍、0.5なら1.5倍
                    } else if (dominantElevation < selfElevation) {
                        // 自分より低い場合、差が大きいほど優先度を弱化
                        dominantGlobalCount /= 0.65 + elevationDifference; // 差が1なら半減、0.5なら1.33倍
                    }
                }

                // 水セルの使用がオンで、自分自身が水セルの場合は色を変えにくくする
                if (waterToggle.checked && cells[selfIndex]?.isWater) {
                    // 水セルの優先度を強化
                    const waterResistanceFactor = 10000; // 値を調整可能: 大きいほど水セルは変わりにくい
                    selfGlobalCount *= waterResistanceFactor;
                }

                let totalDifferenceFactor = dominantGlobalCount / (selfGlobalCount + 1);

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
        const minDistance = 50;

        const disableWaterCities = document.getElementById('disableWaterCitiesToggle').checked; // 新トリガーを取得
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
            let num = 0;
            while (existingCitiesInColor.length < requiredCities) {
                num += 1;
                if(num >= 10)
                {
                    break;
                }
                const randomCell = cellsOfColor[Math.floor(Math.random() * cellsOfColor.length)];

                const isFarEnough = cities.every(city => {
                    const distance = calculateDistance(randomCell, city);
                    return distance === null || distance >= minDistance;
                }) && (!capitals.has(randomCell) || calculateDistance(randomCell, capitals.get(randomCell)) >= minDistance);

                // 水セルチェック（新トリガーを考慮）
                if (!cities.includes(randomCell) && !capitals.has(randomCell) && isFarEnough && (!randomCell.isWater || !disableWaterCities)) {
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
            const colors = ['#0000ff', '#ff0000', '#00ff00', '#ffff00'];
            expansionMultipliers['#0000ff'] = 1;
            expansionMultipliers['#ff0000'] = 1;
            expansionMultipliers['#00ff00'] = 1;
            expansionMultipliers['#ffff00'] = 1; // 初期値を1に設定

            cells.forEach(cell => cell.color = '#FFFFFF'); // All cells to white

            colors.forEach(color => {
                let randomCell;
                let attempts = 0;

                do {
                    randomCell = cells[Math.floor(Math.random() * cells.length)];
                    attempts++;
                } while (randomCell.isWater && attempts < 50); // 水セルを避ける（最大50回試行）

                if (randomCell.isWater && attempts >= 50) {
                    console.warn(`Failed to find non-water cell after 50 attempts for color ${color}`);
                }

                randomCell.color = color;
            });
        } else if (type === 'battleRoyale') {
            // Battle Royale Mode: Set 100 random colors, rest white
            const randomColorSet = Array.from({ length: 100 }, () => getRandomColor());
            cells.forEach(cell => cell.color = '#FFFFFF'); // Set all to white

            randomColorSet.forEach(color => {
                let randomCell;
                let attempts = 0;

                do {
                    randomCell = cells[Math.floor(Math.random() * cells.length)];
                    attempts++;
                } while (randomCell.isWater && attempts < 50); // 水セルを避ける（最大50回試行）

                if (randomCell.isWater && attempts >= 50) {
                    console.warn(`Failed to find non-water cell after 50 attempts for color ${color}`);
                }

                randomCell.color = color;
            });
        } else if (type === 'battleRoyale2') {
            // Battle Royale Mode: Set 250 random colors, rest white
            const randomColorSet = Array.from({ length: 250 }, () => getRandomColor());
            cells.forEach(cell => cell.color = '#FFFFFF'); // Set all to white

            randomColorSet.forEach(color => {
                let randomCell;
                let attempts = 0;

                do {
                    randomCell = cells[Math.floor(Math.random() * cells.length)];
                    attempts++;
                } while (randomCell.isWater && attempts < 50); // 水セルを避ける（最大50回試行）

                if (randomCell.isWater && attempts >= 50) {
                    console.warn(`Failed to find non-water cell after 50 attempts for color ${color}`);
                }

                randomCell.color = color;
            });
        }



        // Update capitals if enabled
        if (capitalToggle.checked) {
            setCapitalsForSpecialGeneration();
        }

        assignNamesToRegions(cells);
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

    // ズーム機能（ホイール操作）
    canvas.addEventListener('wheel', (e) => {
        // 停止中は Command (Mac) または Ctrl (Windows) が押されている場合のみズーム可能
        if (isCanvasStopped && !(e.metaKey || e.ctrlKey)) return;

        e.preventDefault();
        const zoomAmount = e.deltaY * -0.001;
        const zoomFactor = Math.min(Math.max(0.25, scale + zoomAmount), 3) / scale;

        // マウス座標を取得
        const mouseX = e.clientX - canvas.getBoundingClientRect().left;
        const mouseY = e.clientY - canvas.getBoundingClientRect().top;

        // ズームの中心を計算
        origin.x -= (mouseX - origin.x) * (zoomFactor - 1);
        origin.y -= (mouseY - origin.y) * (zoomFactor - 1);

        // ズーム倍率を更新
        scale = Math.min(Math.max(0.25, scale + zoomAmount), 3);
        drawCells();
    });

    // タッチズーム（ピンチ操作対応）
    canvas.addEventListener('touchmove', (e) => {
        if (isCanvasStopped) return; // 停止中は操作を無効化
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
                scale = Math.min(Math.max(0.25, scale), 3);
                drawCells();
            }
            lastDistance = currentDistance;
        }
    });

    canvas.addEventListener('touchend', () => {
        lastDistance = null;
    });

    // ドラッグ（マウス操作）
    canvas.addEventListener('mousedown', (e) => {
        if (isCanvasStopped && !(e.metaKey || e.ctrlKey)) return; // 停止中は Command/Ctrl が必要
        isDragging = true;
        lastPosition = { x: e.clientX, y: e.clientY };
    });

    canvas.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        if (isCanvasStopped && !(e.metaKey || e.ctrlKey)) return; // 停止中は Command/Ctrl が必要

        const dx = e.clientX - lastPosition.x;
        const dy = e.clientY - lastPosition.y;
        origin.x += dx;
        origin.y += dy;
        lastPosition = { x: e.clientX, y: e.clientY };
        drawCells();
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    // ドラッグ（タッチ操作）
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            if (isCanvasStopped) return; // 停止中はドラッグ不可
            isDragging = true;
            lastPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
    });

    canvas.addEventListener('touchmove', (e) => {
        if (!isDragging || e.touches.length !== 1) return;
        if (isCanvasStopped) return; // 停止中はドラッグ不可

        e.preventDefault();
        const dx = e.touches[0].clientX - lastPosition.x;
        const dy = e.touches[0].clientY - lastPosition.y;
        origin.x += dx;
        origin.y += dy;
        lastPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        drawCells();
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

        // 1. 標高を背景に描画(水の場合はスキップ)
        if (useElevation) {
            cells.forEach(cell => {
                if (cell.isWater && waterToggle.checked) {
                    ctx.fillStyle = '#0000FF'; // 青色
                }
                else {
                    ctx.fillStyle = cell.elevationColor; // 保存された色を使用
                }
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
        drawRegionNames(ctx, cells);
        ctx.restore();
    }

    function addMapLog(color, message, defenderColor = null) {
        // 白色のログは無視
        if (color.toLowerCase() === '#ffffff' || (defenderColor && defenderColor.toLowerCase() === '#ffffff')) return;

        const logList = document.getElementById('logList');
        const logItem = document.createElement('li');

        // 国名を取得
        const attackerName = getCountryNameByColor(color);
        const defenderName = defenderColor ? getCountryNameByColor(defenderColor) : null;

        if (defenderColor) {
            logItem.innerHTML = `
                <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                <span>${attackerName}</span>
                <span>が</span><br>
                <span class="color-box" style="background-color: ${defenderColor}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 5px;"></span>
                <span>${defenderName}</span><br>
                <span>${message}</span>
            `;
        } else {
            logItem.innerHTML = `
                <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                <span>${attackerName}</span><br>
                <span>${message}</span>
            `;
        }

        // 最新のログを上に追加
        logItem.classList.add('log-entry'); // 新しいクラスを追加
        logList.insertBefore(logItem, logList.firstChild);

        // ログの保存数を取得し、超過分を削除
        const logLimitInput = document.getElementById('logLimit');
        const logLimit = parseInt(logLimitInput.value) || 10;

        while (logList.children.length > logLimit) {
            logList.removeChild(logList.lastChild); // 最も古いログを削除
        }
    }

    // 国名を取得する関数
    function getCountryNameByColor(color) {
        const cell = cells.find(c => c.color.toLowerCase() === color.toLowerCase());
        return cell && getOrCreateNameForColor(cell.color, useRandomNames) ? getOrCreateNameForColor(cell.color, useRandomNames) : "不明";
    }


    // タブを表示する関数
    function showTab(tabId) {
        // すべてのタブコンテンツを非表示に
        document.querySelectorAll('.tabContent').forEach(tab => {
            tab.style.display = 'none';
        });

        // 指定したタブを表示
        document.getElementById(tabId).style.display = 'block';

        // タブボタンのアクティブ状態を切り替え
        document.querySelectorAll('.tabButton').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[onclick="showTab('${tabId}')"]`).classList.add('active');
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

        console.log(colorCount);

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

            // 国名を取得（対応するセルから）
            const cell = cells.find(c => c.color === color);
            const countryName = cell && getOrCreateNameForColor(cell.color, useRandomNames) ? getOrCreateNameForColor(cell.color, useRandomNames) : "不明";

            // ランキング項目を作成
            const listItem = document.createElement('p');
            if (expansionMultipliers[color] == 1) {
                listItem.innerHTML = `
                    <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                    <br><span>${countryName} (${color}):<br> ${count} 領地</span>
                `;
            } else if(expansionMultipliers[color] == 0)
            {
                listItem.innerHTML = `
                    <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                    <br><span>${countryName} (${color}): <br>${count} 領地</span><br>
                    <span style="color:red;">なぜか国力を全て失っている。</span>
                `;
            } else 
            {
                listItem.innerHTML = `
                    <span class="color-box" style="background-color: ${color}; display: inline-block; width: 20px; height: 20px; border: 1px solid #000; margin-right: 10px;"></span>
                    <br><span>${countryName} (${color}): <br>${count} 領地</span><br>
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

    applyCountryNameButton.addEventListener('click', () => {
        const newCountryName = countryNameInput.value.trim();
        const selectedColor = colorPicker.value;

        if (newCountryName === "") {
            alert("国名を入力してください！");
            return;
        }

        if (!colorToNameMap[selectedColor]) {
            alert("変更する国を選択してください！");
            return;
        }

        colorToNameMap[selectedColor] = newCountryName;
        selectedCountryName.textContent = newCountryName; // 表示を更新
        drawCells(); // 地図を再描画して変更を反映
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
            const nationColorPicker = document.getElementById('nationColorPicker');
            colorPicker.value = rgbToHex(selectedCell.color); // RGBを16進数に変換して設定
            selectedCountryName.textContent = colorToNameMap[rgbToHex(selectedCell.color)] || "不明な国"
            if(toggleNationNameEditModeButton.classList.contains("active_edit")){ 
                nationColorPicker.value = rgbToHex(selectedCell.color); // RGBを16進数に変換して設定
                nationNameLabel.textContent = colorToNameMap[rgbToHex(selectedCell.color)] || "不明な国"
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
