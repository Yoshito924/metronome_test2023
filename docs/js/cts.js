'use strict'
//=============================================================================
//最も細かい表紙の分母
let smallestBeat = 4;
// 拍子のテキストを代入するグローバル変数
let timeSignatureText;
//拍子の状態を格納するグローバル配列
let ctsBeatArray = [];
let ctsBeatArrayR = [];
//メトロノームの拍子を格納するグローバル配列
let timeSignatureArray = [];
//ビートの合計を格納するグローバル変数
let beatTotalValue = 0;
//クリック音を管理するグローバル配列
let ctsBeatStates = [];
//拍子のアタマのクリック音を管理するグローバル配列
let ctsBeatHeadStates = [];
// ミュート位置をブール値で管理するグローバル変数
let ctsMuted = false;
let ctsBeatHeadMuted = false;
//ビート状態の配列を初期化する関数
function initializeBeatStates() {
    ctsBeatStates = new Array().fill(true);
    ctsBeatHeadStates = new Array().fill(true);
};
//=============================================================================
//プリセットの拍子の改行をいい感じに反映させるための関数
function removeExtraSpaces(str) {
    return str.split('\n').map(line => line.trim()).join('\n');
};
//プリセットをHTMLに書きこむ関数
function updatePresetInfo(index) {
    // 指定されたインデックスに基づいてプリセットオブジェクトを取得
    const preset = ctsMetronomePreset[index];
    // プリセットに exampleMusicURL が存在するかどうかで処理を分岐
    if (preset.exampleMusicURL) {
        // URLがある場合は、リンク付きでテキストを設定
        document.getElementById('ctsPresetExample').innerHTML
            = `参考曲：<a href="${preset.exampleMusicURL}" target="_blank">${preset.exampleMusic}</a>`;
    } else {
        // URLがない場合は、テキストのみを設定
        document.getElementById('ctsPresetExample').innerHTML = preset.exampleMusic;
    };
    // プリセットの情報 (info) を表示
    document.getElementById('ctsPresetInfo').innerHTML = preset.info;
    // テキストエリアを空にする
    const ctsTextarea = document.getElementById('ctsTextarea');
    ctsTextarea.innerHTML = '';
    // 拍子のテキストの不要なスペースを削除する
    const formattedCts = removeExtraSpaces(preset.cts);
    // 拍子のテキストを書きこむ
    document.getElementById('ctsTextarea').value = formattedCts;
    // BPMを変更する
    document.getElementById('bpm').value = preset.bpm;
    document.getElementById('bpmValue').value = preset.bpm;
};
// グループ化されたプリセットを作成する関数
function groupPresetsByTimeSig(presets) {
    const groups = {};
    presets.forEach((preset, index) => {
        const groupKey = preset.timeSig;
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        };
        groups[groupKey].push({ preset: preset, index: index });
    });
    return groups;
};
// select 要素を動的に生成
const selectElement = document.createElement('select');
selectElement.id = 'ctsMetronomePresetSelect';
selectElement.className = 'form-select';
// プリセットをグループ化
const groupedPresets = groupPresetsByTimeSig(ctsMetronomePreset);
// 各グループに対してoptgroupとoptionを生成
for (const groupKey in groupedPresets) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = `${groupKey}拍子`;
    groupedPresets[groupKey].forEach((item) => {
        const option = document.createElement('option');
        option.value = item.index; // 正しいインデックスを設定
        option.textContent = item.preset.name;
        // 初期の選択値
        if (item.preset.name === `${selectedPreset}`) {
            option.selected = true;
        };
        optgroup.appendChild(option);
    });
    selectElement.appendChild(optgroup);
};
// select 要素を指定された div 要素に追加
document.getElementById('ctsMetronomePreset').appendChild(selectElement);
// select 要素の変更時のイベントハンドラを設定
selectElement.onchange = function () {
    // 選択されたoptionのインデックスを取得
    const selectedIndex = this.options[this.selectedIndex].value;
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    ctsMetronomeRestart();
    // 正しいインデックスでプリセット情報を更新
    updatePresetInfo(selectedIndex);
    // 拍子のビートの合計値を計算する関数
    calculateCtsBeat();
    // 拍のビジュアルをHTML上に描画する関数
    updateCtsRhythmTable('ctsVisual', ctsBeatStates);
    // 1小節のビジュアルをHTML上に描画する関数
    updateCtsBarVisualTable()
    // テキストエリアの高さを制御する関数
    adjustTextareaHeight();
};
// ------------------------------------------------------------------------------------------------
// テキストエリアの高さを動的に制御する関数
function adjustTextareaHeight() {
    // テキストエリアを一度リセット
    document.getElementById("ctsTextarea").style.height = 'auto';
    // テキストエリアの行数を計算（改行文字で分割）
    let lines = document.getElementById("ctsTextarea").value.split('\n').length;
    // 最小行数と、最大行数を設定する
    const minLines = 2;
    const maxLines = 10;
    // 行数に基づいて高さを調整
    let newLines = Math.min(Math.max(lines, minLines), maxLines);
    document.getElementById("ctsTextarea").style.height = `${newLines * 1.2}em`;  // 1行あたりの高さを1.2emと仮定
};
// ------------------------------------------------------------------------------------------------
//拍子のビートの合計値を計算する関数
function calculateCtsBeat() {
    timeSignatureText = ""
    // テキストエリアの「全角の数字、アルファベット、スペース、記号」を「対応する半角文字」に変換してから変数に格納する
    timeSignatureText = toHalfWidth(document.getElementById('ctsTextarea').value);
    //プラス (+)、カンマ (,）、スラッシュ (/) 以外のすべての記号や文字を削除する
    timeSignatureText = timeSignatureText.replace(/[^\d\+,/]/g, '');
    //拍子を分子と分母に分割して配列に格納
    timeSignatureArray = timeSignatureText.split(/[+,]+/);
    // ------------------------------------------------------------------------------
    //拍子を格納する配列：ts (Time Signature)
    let ts = [];
    //拍子の整数型を格納する配列：tsInt (Time Signature Int)
    let tsInt = { numerator: [], denominator: [] };
    //最も細かい拍子に合わせて「通分した値」を格納する配列：tsR (Time Signature Reduce to a common denominator)
    let tsR = { numerator: [], denominator: [] };
    // ------------------------------------------------------------------------------
    //一度拍子テキスト入力のエラー表示エリアを空にする
    document.getElementById(`ctsTextareaInfo`).innerHTML = ``;
    //拍子が何もない場合はここでreturn
    if (timeSignatureText === undefined || timeSignatureText === null || timeSignatureText === 0 || timeSignatureText === "") {
        document.getElementById(`ctsTextareaInfo`).innerHTML = ``;
        return;
    };
    // ------------------------------------------------------------------------------
    // 配列に格納された拍子テキストの分母と分子を分割し整数型にする
    for (let i = 0; i < timeSignatureArray.length; i++) {
        ts = timeSignatureArray[i].split("/");
        //整数型に変換して配列に格納する
        tsInt.numerator.push(parseInt(ts[0]))
        tsInt.denominator.push(parseInt(ts[1]))
        //分母と分子の値に以上がないかエラーチェックする
        if (Number.isNaN(tsInt.denominator[i]) && Number.isNaN(tsInt.numerator[i])) {
            //分母エラーチェック
            document.getElementById(`ctsTextareaInfo`).innerHTML = `<span class="redText">※拍子の入力エラー：拍子が正しく入力されていません。</span>`;
            //メトロノームを停止したときの処理
            metronomeStop()
            return;
        } else if (Number.isNaN(tsInt.denominator[i])) {
            //分母エラーチェック
            document.getElementById(`ctsTextareaInfo`).innerHTML = `<span class="redText">※拍子の入力エラー：分母の値が存在しない拍子が含まれています。</span>`;
            //メトロノームを停止したときの処理
            metronomeStop()
            return;
        } else if (Number.isNaN(tsInt.numerator[i])) {
            //分子エラーチェック
            document.getElementById(`ctsTextareaInfo`).innerHTML = `<span class="redText">※拍子の入力エラー：分子の値が存在しない拍子が含まれています。</span>`;
            //メトロノームを停止したときの処理
            metronomeStop()
            return;
        } else if (tsInt.denominator[i] === 1) {
            //分母が1のエラーチェック
            document.getElementById(`ctsTextareaInfo`).innerHTML = `<span class="redText">※拍子の入力エラー：分母の値が「1」の拍子には非対応です。</span>`;
            //メトロノームを停止したときの処理
            metronomeStop()
            return;
        } else if (isPowerOfTwo(tsInt.denominator[i]) === false) {
            //拍子の値が2の累乗数かチェック
            document.getElementById(`ctsTextareaInfo`).innerHTML = `<span class="redText">※拍子の入力エラー：分母の値が2の累乗数（例:2,4,8,16...）ではない拍子には非対応です。</span>`;
            //メトロノームを停止したときの処理
            metronomeStop();
            return;
        } else if (tsInt.numerator[i] > 100) {
            //分子の値が大きすぎる場合のエラーチェック
            document.getElementById(`ctsTextareaInfo`).innerHTML = `<span class="redText">※拍子の入力エラー：分子の値は100以下の値を入力してください。</span>`;
            //メトロノームを停止したときの処理
            metronomeStop()
            return;
        } else if (tsInt.denominator[i] > 1024) {
            //分子の値が大きすぎる場合のエラーチェック
            document.getElementById(`ctsTextareaInfo`).innerHTML = `<span class="redText">※拍子の入力エラー：分母の値は1024以下の値を入力してください。</span>`;
            //メトロノームを停止したときの処理
            metronomeStop()
            return;
        };
    };
    //拍子テキスト入力のエラーチェックに引っかからなければ空にする
    document.getElementById(`ctsTextareaInfo`).innerHTML = ``;
    // ------------------------------------------------------------------------------
    //最も細かい拍子の分母を見つける
    let smallestDenominator = Math.max.apply(null, tsInt.denominator);
    //最も細かい拍子に合わせて通分する
    for (let i = 0; i < tsInt.numerator.length; i++) {
        tsR.numerator.push(tsInt.numerator[i] * (smallestDenominator / tsInt.denominator[i]))
        tsR.denominator.push(tsInt.denominator[i] * (smallestDenominator / tsInt.denominator[i]))
    };
    // ------------------------------------------------------------------------------
    //拍子のアタマのクリック音を管理する配列を初期化する
    ctsBeatHeadStates = new Array().fill(true);
    //通分した分子の合計を算出する
    let total = 0;
    for (let i = 0; i < tsR.numerator.length; i++) {
        //小節のアタマの場所を記録する
        ctsBeatHeadStates.push(total)
        total = total + tsR.numerator[i];
    };
    // ------------------------------------------------------------------------------
    //求めたい情報をグローバル変数に代入する
    beatTotalValue = total;
    smallestBeat = smallestDenominator;
    ctsBeatArray = tsInt;
    ctsBeatArrayR = tsR;
    //------------------------------------------------------------------------------
    //クリックを管理する配列を初期化する
    ctsBeatStates = new Array().fill(true);        //変拍子の数だけループ
    for (let i = 0; i < tsInt.numerator.length; i++) {
        //通分しても分母が変わらない拍子の場合
        if (tsR.numerator[i] === tsInt.numerator[i]) {
            //クリックを管理する配列に追加（全部クリックで埋め尽くす）
            for (let k = 0; k < tsR.numerator[i]; k++) {
                ctsBeatStates.push(1)
            };
        } else {
            // 通分すると分母が変わる拍子の場合
            for (let j = 0; j < tsR.numerator[i]; j++) {
                //クリックを管理する配列に追加（通分で変化した部分を加味する）
                if (j % (tsR.numerator[i] / tsInt.numerator[i]) === 0) {
                    ctsBeatStates.push(1)
                } else {
                    ctsBeatStates.push(0)
                };
            };
        };
    };
};
//メトロノームを停止したときの処理
function metronomeStop() {
    // メトロノームが既に再生中の場合、AudioContextを閉じて初期化。（メトロノームが重複して鳴るのを防ぐため）
    if (audioContext) {
        audioContext.close(); // AudioContextを閉じる
        audioContext = null; // AudioContextをリセット
        // AudioContextの初期化を行う関数
        initializeAudioContext();
    };
    //すべてのハイライトを削除する
    for (let i = 0; i <= ctsBeatArray.numerator.length; i++) {
        let element = document.getElementById(`ctsVisual${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList.remove("highlightBeatHeadCts")
        };
    };
    //一度すべてのハイライトを削除する
    for (let i = 1; i <= beatTotalValue; i++) {
        let element = document.getElementById(`ctsBarVisual_${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList.remove("highlightBarCts")
        };
    };
    document.getElementById("ctsMetronomeClickSoundLoading").innerHTML = "";
    document.getElementById("ctsMetronomeBeatHeadClickSoundLoading").innerHTML = "";
    // 音が実際に再生されているか判定する変数をfalseにする
    audioBuffersActive = false;
    //ビートのカウントをリセット
    beatCount = 1;
    timeSignatureBeatCount = 1;
    oneBarBeatCount = 0;
    measureLocation = 0;
    //ローディングのカウントダウンもリセット
    remainingTime = 0;
};
//BPMの値をチェックして数値に変換する関数
function sanitizeCtsBpmInput(bpm) {
    // 全角数字を半角に変換
    bpm = bpm.replace(/[０-９]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
    // 数字と小数点以外を削除
    bpm = bpm.replace(/[^0-9.]/g, '');
    //数値へ変換する
    bpm = parseFloat(bpm);
    //四捨五入して小数点第1位までを表示する
    bpm = roundToOne(bpm);
    // // 数値チェックと範囲内に収める
    if (/^\d+(\.\d)?$/g.test(bpm)) {
        bpm = Math.max(1, Math.min(300, bpm));
    } else {
        bpm = 120; // 無効な入力の場合
    };
    //HTML上に値を返す
    document.getElementById('bpm').value = bpm;
    document.getElementById('bpmValue').value = bpm;
    //チェックしたBPMの値を返す
    return bpm;
};
// メトロノームをオンオフする関数
async function ctsMetronomeOnOff() {
    //現在のBPMの値を取得する
    bpm = document.getElementById('bpmValue').value;
    //BPMの値をチェックして数値に変換する
    bpm = sanitizeCtsBpmInput(bpm);
    //1周期の長さを格納する変数
    totalBeats = beatTotalValue;
    //拍子のビートの合計値を計算する関数
    calculateCtsBeat();
    if (!isPlaying) {
        // メトロノームを開始したときの処理
        if (!audioContext) {
            // AudioContextを初期化
            initializeAudioContext();
            // オーディオファイルの読み込みを開始
            loadAudioFiles();
        };
        nextBeatTime = audioContext.currentTime;
        // BPMに基づいて最小のクリックの間隔を計算(ms)。
        beatInterval = (60 / bpm) / (smallestBeat / 4);
        // 各ビートをスケジュールする。totalBeatsの数だけ繰り返す。
        for (let i = 0; i < totalBeats; i++) {
            scheduleBeat(i % totalBeats + 1);
        };
        //ローディングのカウントダウンをリセット
        remainingTime = 0;
    } else {
        //メトロノームを停止したときの処理
        metronomeStop();
        // 保存された全てのタイマーIDに対してclearTimeoutを実行
        timerIds.forEach(id => clearTimeout(id));
        // タイマーIDの配列をクリア
        timerIds = [];
    };
    //------------------------------------------------------------------------
    if (!isPlaying) {
        // メトロノームが始まったことを示すためにボタンのテキストを「停止」に変更
        document.getElementById('ctsMetronomeControlButton').innerHTML
            = `<i class="fa-solid fa-stop controlButtonIcon red">`;
    } else {
        // メトロノームを停止するためにボタンのテキストを「開始」に戻す
        document.getElementById('ctsMetronomeControlButton').innerHTML
            = `<i class="fa-solid fa-play controlButtonIcon blue">`;
        // 音が実際に再生されているか判定する変数をfalseにする
        audioBuffersActive = false;
    };
    //------------------------------------------------------------------------
    // 本当に音が再生されているかチェックするための処理
    setTimeout(() => {
        //少し時間を待って再生されているかチェックする
        if (audioBuffersActive === true) {
            document.getElementById("helpText").innerHTML = "";
        };
        // ちゃんと動いていない場合の処理
        if (audioBuffersActive === false && isPlaying === true) {
            //一度テキストを空にする
            document.getElementById("helpText").innerHTML = "";
            //一瞬消して再生に失敗しましたテキストを出す
            setTimeout(() => {
                if (!isPlaying) {
                    document.getElementById("helpText").innerHTML = "※再生に失敗しました。<br>もう一度再生ボタン↓を押してください。";
                };
            }, 100);
            ctsMetronomeOnOff();
        };
    }, 200);
    //現在のミュート状態をチェックし、描画する関数
    muteIconCheck(ctsMuted, `muteCtsRhythm`, `highlightCts`);
    //現在のミュート状態をチェックし、描画する関数
    muteIconCheck(ctsBeatHeadMuted, 'muteCtsBeatHead', `highlightBeatHeadCts`);
    //------------------------------------------------------------------------
    isPlaying = !isPlaying; // メトロノームの再生状態を切り替える
};
//=============================================================================
// ビートパターンの配列を作成する関数
function generateCtsBeatPattern() {
    let sounds = [];
    let beatPattern = [];
    // -------------------------------------------
    //どの音でクリックを鳴らすかどうかの値を得る
    let ctsMetronomeClickSound = (document.getElementById("ctsMetronomeClickSound").value)
    let ctsMetronomeBeatHeadClickSound = (document.getElementById("ctsMetronomeBeatHeadClickSound").value)
    for (let i = 0; i < beatTotalValue; i++) {
        sounds = [''];
        // クリックの音を追加
        if (ctsBeatStates[i] === 1 && ctsMuted === false) {
            sounds.push(ctsMetronomeClickSound)
        };
        // -------------------------------------------
        // 各拍子の先頭のクリック音を追加
        for (let k = 0; k < ctsBeatHeadStates.length; k++) {
            if (ctsBeatHeadStates[k] === i && ctsBeatHeadMuted === false) {
                sounds.push(ctsMetronomeBeatHeadClickSound);
            };
        };
        // -------------------------------------------
        beatPattern.push({ sounds });
    };
    // 結果の確認
    return beatPattern;
};
// ビートをスケジュールする関数
function scheduleBeat(beatCount) {
    // メトロノームが停止状態かつnextBeatTimeが0以下の場合、処理を終了
    if (!isPlaying && nextBeatTime <= 0) {
        return;
    };
    // -------------------------------------------
    // 配列を生成
    let beatPattern = generateCtsBeatPattern();
    // 現在のビートに対応するビートパターンを取得
    const beat = beatPattern[beatCount - 1];
    // -------------------------------------------
    // ビートに対応する音を再生
    beat.sounds.forEach(sound => {
        // 新しいAudioBufferSourceNodeを作成
        if (audioBuffers[sound]) {
            playSound(audioBuffers[sound], nextBeatTime);
        };
    });
    // -------------------------------------------
    const timeUntilNextBeat = nextBeatTime - audioContext.currentTime;
    // ビジュアル表示の更新をスケジュール
    timerId = setTimeout(() => highlightBeat(beatCount), timeUntilNextBeat * 1000);
    timerIds.push(timerId);
    // 次の拍の音をスケジュール
    timerId = setTimeout(() => scheduleBeat(beatCount), timeUntilNextBeat * 1000);
    timerIds.push(timerId);
    // 次のビートの時間を更新
    nextBeatTime += beatInterval;
};
//=============================================================================
// 拍子テーブルの先頭の状態を格納する配列
let timeSignatureBeatCount = 1;
let barBeatCount = 1;
let oneBarBeatCount = 0;
// 何小節目かを管理するグローバル変数
let measureLocation = 0;
// 拍子テーブルのビジュアルをHTML上に描画する関数
function updateCtsRhythmTable(idName) {
    //メトロノームが動作中ならばいったん止める
    if (isPlaying) {
        ctsMetronomeOnOff();
    };
    //------------------------------------------------------------------------
    // 既存の<tr>要素を削除
    document.getElementById(`${idName}Row`).innerHTML = '';
    // <td>要素を生成して追加
    for (let i = 0; i < ctsBeatArray.numerator.length; i++) {
        // 新しい<td>要素を作成
        let newTd = document.createElement('td');
        newTd.id = `ctsVisual${i + 1}`;  // IDを設定
        newTd.style.width = `${ctsBeatArrayR.numerator[i] / beatTotalValue * 100}%`;//幅を設定
        newTd.innerHTML
            = `<span class="grayText">(${i + 1})</span><br>
            <span class="fontBold">
            ${ctsBeatArray.numerator[i]}<br>
            ―
            <br>${ctsBeatArray.denominator[i]}
            </span>`;   // 内容を設定
        // <tr>要素に新しい<td>要素を追加
        document.getElementById(`${idName}Row`).appendChild(newTd);
    };
    //------------------------------------------------------------------------
    // 合計の拍子を表示する
    // 値をともに2で割り、smallestBeatが4になった時点でやめる
    let reducingFractionsBeatTotalValue = beatTotalValue;
    let reducingFractionsSmallestBeat = smallestBeat;
    while (reducingFractionsSmallestBeat > 4 && reducingFractionsBeatTotalValue % 2 === 0) {
        reducingFractionsBeatTotalValue = reducingFractionsBeatTotalValue /= 2;
        reducingFractionsSmallestBeat = reducingFractionsSmallestBeat /= 2;
    };
    //------------------------------------------------------------------------
    // 変拍子ではない場合の判定
    let isNumeratorUniform = true;
    let isDenominatorUniform = true;

    // 分子の全ての要素が最初の要素と同じかどうかを検証
    for (let i = 1; i < ctsBeatArray.numerator.length; i++) {
        if (ctsBeatArray.numerator[i] !== ctsBeatArray.numerator[0]) {
            isNumeratorUniform = false;
            break;
        };
    };
    // 分母の全ての要素が最初の要素と同じかどうかを検証
    for (let i = 1; i < ctsBeatArray.denominator.length; i++) {
        if (ctsBeatArray.denominator[i] !== ctsBeatArray.denominator[0]) {
            isDenominatorUniform = false;
            break;
        };
    };
    //変拍子（途中で拍子が変わる）場合は合計の拍子を表示する
    document.getElementById(`ctsTotalTimeSignature`).innerHTML
        = "";
    if (isNumeratorUniform === true && isDenominatorUniform === true) {
        //拍子が全て同じの場合は「合計の拍子」を表示しない
        document.getElementById(`ctsTotalTimeSignature`).innerHTML
            = "";
        //クラスの制御
        document.getElementById(`ctsTotalTimeSignature`).classList = '';
    } else if (reducingFractionsBeatTotalValue !== beatTotalValue) {
        document.getElementById(`ctsTotalTimeSignature`).innerHTML
            = `<span class="fontBold">
            ${reducingFractionsBeatTotalValue}<br>
            ―
            <br>${reducingFractionsSmallestBeat}
            </span>`;
        //クラスの制御
        document.getElementById(`ctsTotalTimeSignature`).classList.add("marginTimeSignature");
    } else {
        document.getElementById(`ctsTotalTimeSignature`).innerHTML
            = `<span class="fontBold">
            ${beatTotalValue}<br>
            ―
            <br>${smallestBeat}
            </span>`;
        //クラスの制御
        document.getElementById(`ctsTotalTimeSignature`).classList.add("marginTimeSignature");
    }
};
// 拍子テーブルのビジュアル要素を着色する関数
function highlightBeat(beatCount) {
    //再生中でないなら止める
    if (!isPlaying) {
        return
    };
    //------------------------------------------------------------------------
    // 一覧の拍子のハイライトを付ける
    if (ctsBeatHeadStates[timeSignatureBeatCount - 1] === (beatCount - 1)) {
        //一度すべてのハイライトを削除する
        for (let i = 0; i <= ctsBeatArray.numerator.length; i++) {
            let element = document.getElementById(`ctsVisual${i}`);
            //要素がある場合のみ削除
            if (element) {
                element.classList.remove("highlightBeatHeadCts")
            };
        };
        //ハイライトを付ける
        document.getElementById(`ctsVisual${timeSignatureBeatCount}`).classList.add('highlightBeatHeadCts');
        updateCtsBarVisualTable(timeSignatureBeatCount, oneBarBeatCount)
        //カウンターを+1する
        timeSignatureBeatCount++
        barBeatCount = 1;
    };
    // ------------------------------------------------------------------------
    // 何小節目かをカウントする
    for (let i = 0; i <= ctsBeatHeadStates.length; i++) {
        if (ctsBeatHeadStates[i] === beatCount - 1) {
            //何小節目かをカウントする変数
            measureLocation++
        };
    };
    // 1小節のビジュアルを管理する変数の処理
    if (ctsBeatArray.denominator[measureLocation - 1] === smallestBeat) {
        oneBarBeatCount++
    } else {
        //分母が最小の数ではないときの処理
        oneBarBeatCount = oneBarBeatCount + (1 * (ctsBeatArray.denominator[measureLocation - 1] / smallestBeat))
    };
    // 1小節のビジュアル内の要素を着色する関数
    ctsBarVisualColored();
    // ------------------------------------------------------------------------
    // カウンターの数字を管理する
    if (beatCount >= beatTotalValue) {
        timeSignatureBeatCount = 1;
        beatCount = 1;
        barBeatCount = 1;
        oneBarBeatCount = 0;
        measureLocation = 0;
    } else {
        beatCount++;
    };
};
//=============================================================================
// 1小節テーブルのビジュアルをHTML上に描画する関数
function updateCtsBarVisualTable(timeSignatureBeatCount = 1, oneBarBeatCount = 1) {
    // 音符を格納する変数と配列を定義する
    let note;
    let rest;
    let returnNote = { note: '', rest: '' };
    returnNote = DetermineTypeOfNote(ctsBeatArray.denominator[timeSignatureBeatCount - 1], note, rest);// 音符の種類を決める関数
    note = returnNote.note;
    rest = returnNote.rest;
    //------------------------------------------------------------------------
    // 1小節のビジュアルの拍子部分のビジュアルを描画する
    document.getElementById(`ctsBarTimeSignature`).innerHTML = '';
    document.getElementById(`ctsBarTimeSignature`).innerHTML
        = `<span class="grayText">
            (${measureLocation + 1})
            </span><br>
            <span class="fontBold">
            ${ctsBeatArray.numerator[timeSignatureBeatCount - 1]}<br>
            ―<br>
            ${ctsBeatArray.denominator[timeSignatureBeatCount - 1]}
            </span>`;
    //------------------------------------------------------------------------
    // 既存の<tr>要素を一旦削除
    document.getElementById(`ctsBarVisualRow`).innerHTML = '';
    // <td>要素を生成して追加
    for (let i = 0; i < ctsBeatArray.numerator[timeSignatureBeatCount - 1]; i++) {
        // 新しい<td>要素を作成
        let newTd = document.createElement('td');
        newTd.id = `ctsBarVisual_${i + 1 + oneBarBeatCount}`;  // IDを設定
        newTd.innerHTML
            = `<span class="grayText">
            (${measureLocation + 1})-${i + 1}
            </span><br>
            ${note}`;   // 内容を設定
        // <tr>要素に新しい<td>要素を追加
        document.getElementById(`ctsBarVisualRow`).appendChild(newTd);
    };
};
// 1小節テーブルのビジュアル内の要素を着色する関数
function ctsBarVisualColored() {
    //一度すべてのハイライトを削除する
    for (let i = 1; i <= beatTotalValue; i++) {
        let element = document.getElementById(`ctsBarVisual_${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList.remove("highlightBarCts")
        };
    };
    //ハイライトを付ける
    let element = document.getElementById(`ctsBarVisual_${Math.ceil(oneBarBeatCount)}`);
    if (element) {
        element.classList.add('highlightBarCts');
    } else {
        console.log('要素が存在しない');
    };
};
//=============================================================================
// オーディオバッファを再生する関数
function playSound(buffer, time) {
    document.getElementById(`helpText2`).innerHTML = ``;
    //長すぎるメトロノーム設定はreturn
    if (beatInterval * totalBeats >= 1800) {
        document.getElementById(`helpText2`).innerHTML
            = `この設定での1周期の長さは約${Math.round(beatInterval * totalBeats)}秒です。<br>1周期が30分(1800秒)を超えるメトロノームは再生できません。`
        return;
    };
    //audioContextをinitializeしてない場合はinitialize
    if (!audioContext) {
        initializeAudioContext();
    };
    // 新しいオーディオバッファソースノードを作成
    const source = audioContext.createBufferSource();
    // ソースノードにオーディオバッファを設定
    source.buffer = buffer;
    let volume = parseInt(document.getElementById('volumeControl').value);
    gainNode.gain.value = volume / 10; // 0-10 の値を 0-0.5 に変換
    // ソースをゲインノードに接続
    source.connect(gainNode);
    // 指定された時間にオーディオバッファの再生を開始
    source.start(time);
    //音が再生されているか否かを判定する変数をtrueにする。
    audioBuffersActive = true;
};
// メトロノームが動作中なら一度止めた後に再度動かす関数
function ctsMetronomeRestart() {
    //メトロノームが動作中ならば
    if (isPlaying) {
        //いったん止める
        ctsMetronomeOnOff();
        //0.2秒後にメトロノームを再開する
        setTimeout(() => {
            if (!isPlaying) {
                ctsMetronomeOnOff();
            };
        }, 200);
    };
};
//=============================================================================
// ページが読み込まれた時に実行する関数たち
window.addEventListener('load', () => {
    //BPMを更新したときの処理
    updateCtsBpm(document.getElementById('bpm').value);
    // AudioContextを初期化
    initializeAudioContext();
    // オーディオファイルの読み込みを開始
    loadAudioFiles();
    // ビート状態の配列を初期化する関数（↓イベントリスナー効かなくなるので拍のビジュアルをHTML上に描画する関数の前に実行しないとダメ）
    initializeBeatStates();
    // プリセット項目をHTMLに書きこむ関数
    updatePresetInfo(document.getElementById("ctsMetronomePresetSelect").value);
    //拍子のビートの合計値を計算する関数
    calculateCtsBeat();
    // 拍のビジュアルをHTML上に描画する関数
    updateCtsRhythmTable('ctsVisual', ctsBeatStates);
    // 1小節のビジュアルをHTML上に描画する関数
    updateCtsBarVisualTable()
    // テキストエリアの高さを制御する関数
    adjustTextareaHeight();
});
//=============================================================================
// イベントリスナーたち
// 再生・停止ボタンを押したときに実行されるイベントリスナー
document.getElementById('ctsMetronomeControlButton').addEventListener('click', () => {
    ctsMetronomeOnOff();
});
// キーボードイベントのリスナー
document.addEventListener('keydown', function (event) {
    // 特定のキーが押されたかチェックする
    if (event.key === "s") {
        ctsMetronomeOnOff();
        // 1小節のビジュアルをHTML上に描画する関数
        updateCtsBarVisualTable()
    };
});
// スライダーとテキストボックスの値を同期させる関数
function updateCtsBpm(value) {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    ctsMetronomeRestart();
    document.getElementById('bpm').value = value;
    document.getElementById('bpmValue').value = value;
};
//BPMが変更された時のイベントリスナー
document.getElementById('bpm').addEventListener('input', function () {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    ctsMetronomeRestart();
    updateCtsBpm(this.value);
});
// 拍子入力欄のテキストが変更された時のイベントリスナー
document.getElementById('ctsTextarea').addEventListener('input', function () {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    ctsMetronomeRestart();
    //拍子のビートの合計値を計算する関数
    calculateCtsBeat();
    // 拍のビジュアルをHTML上に描画する関数
    updateCtsRhythmTable('ctsVisual')
    // 1小節のビジュアルをHTML上に描画する関数
    updateCtsBarVisualTable()
    // テキストエリアの高さを制御する関数
    adjustTextareaHeight();
});
// --------------------------------------------------------------------------
// ローディング案内テキストのを表示する処理
let timers = {};
let remainingTime = 0;
function ctsClickSoundLoading(loadingId) {
    remainingTime = Math.round(nextBeatTime - audioContext.currentTime);
    // 既存のインターバルをクリア
    if (timers[loadingId]) {
        clearInterval(timers[loadingId].intervalId);
        clearTimeout(timers[loadingId].timeoutId);
    };
    // カウントダウンを更新する関数
    const updateText = () => {
        if (remainingTime <= 0) {
            clearInterval(timers[loadingId].intervalId);
            //何も表示しない
            document.getElementById(loadingId).innerHTML = "";
        } else if (isPlaying) {
            document.getElementById(loadingId).innerHTML = `処理中…${remainingTime}秒ほどお待ちください。`;
            console.log(remainingTime)
        };
        remainingTime = remainingTime - 1
    };
    if (audioContext) {
        updateText(); // 最初の更新
        // 1秒ごとに更新するインターバルを設定
        timers[loadingId] = { intervalId: setInterval(updateText, 1000) };
    } else {
        document.getElementById(loadingId).innerHTML = `処理中…`;
        // タイムアウトを設定
        timers[loadingId] = {
            timeoutId: setTimeout(() => {
                document.getElementById(loadingId).innerHTML = "";
            }, ((nextBeatTime - audioContext.currentTime) * 1000))
        };
    };
};
//音色の種類を選択するドロップダウンリストのイベントリスナー
document.getElementById('ctsMetronomeClickSound').addEventListener('change', function () {
    ctsClickSoundLoading(`ctsMetronomeClickSoundLoading`);
});
document.getElementById('ctsMetronomeBeatHeadClickSound').addEventListener('change', function () {
    ctsClickSoundLoading(`ctsMetronomeBeatHeadClickSoundLoading`);
});
// --------------------------------------------------------------------------
//現在のミュート状態をチェックし、描画する関数
function muteIconCheck(muteData, muteId, highlight) {
    if (!muteData) {
        //既にミュート済ならミュートをオフにする
        document.getElementById(muteId).innerHTML
            = `<img src="./image/volume_up_FILL0_wght400_GRAD0_opsz24.svg" alt="ヴォリュームアイコン" title="ヴォリュームアイコン" class="volumeIcon">`;
        document.getElementById(muteId).classList.add(highlight);
    } else {
        //ミュートする
        document.getElementById(muteId).innerHTML
            = `<img src="./image/volume_off_FILL0_wght400_GRAD0_opsz24.svg" alt="ミュートアイコン" title="ミュートアイコン" class="volumeIcon">`;
        document.getElementById(muteId).classList.remove(highlight);
    }
};
function toggleCtsMuteIcon(muteData, muteId, highlight) {
    document.getElementById(muteId).innerHTML
        = `<img src="./image/update_FILL0_wght400_GRAD0_opsz24.svg" alt="ロード中アイコン" title="ロード中アイコン" class="volumeIcon">`;
    //スケジュールされているタイミングの分だけ切り替えを遅らせる
    setTimeout(() => {
        if (!muteData) {
            //既にミュート済ならミュートをオフにする
            document.getElementById(muteId).innerHTML
                = `<img src="./image/volume_up_FILL0_wght400_GRAD0_opsz24.svg" alt="ヴォリュームアイコン" title="ヴォリュームアイコン" class="volumeIcon">`;
            document.getElementById(muteId).classList.add(highlight);
        } else {
            //ミュートする
            document.getElementById(muteId).innerHTML
                = `<img src="./image/volume_off_FILL0_wght400_GRAD0_opsz24.svg" alt="ミュートアイコン" title="ミュートアイコン" class="volumeIcon">`;
            document.getElementById(muteId).classList.remove(highlight);
        };
        //現在スケジュールされている時間分処理を止める
    }, ((nextBeatTime - audioContext.currentTime) * 1000));
};
//ミュートボタンのイベントリスナー
document.getElementById('muteCtsRhythm').addEventListener('click', () => {
    ctsMuted = !ctsMuted;
    document.getElementById(`muteCtsRhythm`).classList.toggle('muted');
    toggleCtsMuteIcon(ctsMuted, `muteCtsRhythm`, `highlightCts`)
    ctsClickSoundLoading(`ctsMetronomeClickSoundLoading`);
});
document.getElementById('muteCtsBeatHead').addEventListener('click', () => {
    ctsBeatHeadMuted = !ctsBeatHeadMuted;
    document.getElementById(`muteCtsBeatHead`).classList.toggle('muted');
    toggleCtsMuteIcon(ctsBeatHeadMuted, 'muteCtsBeatHead', `highlightBeatHeadCts`)
    ctsClickSoundLoading(`ctsMetronomeBeatHeadClickSoundLoading`);
});