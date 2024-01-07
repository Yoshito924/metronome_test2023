'use strict'


// 必要な入力（ユーザーが操作できる）項目は
// リズム1(1～20の値をとる)
// リズム2(こちらも1～20の値をとる)
// リズム1かリズム1と2の最小公倍数のどちらを基準の音符にしてBPMを決定するか選ぶメニュー
// BPMの値
// クリックの音4種類の設定
// クリック音の音量設定

//=============================================================================
//常に正の数の答えを返す剰余演算をする関数 (負の数の剰余演算を処理するため)
function mod(n, m) {
    return ((n % m) + m) % m;
};

// 四捨五入して小数点第3位までを表示する関数 (JavaScriptには元からそういう関数が無いっぽいので)
function roundToThree(num) {
    return +(Math.round(num + "e+3") + "e-3");
};

//2つの整数の最小公倍数を求める関数--------------------------------------
function lcm(a, b) {
    let g = (n, m) => m ? g(m, n % m) : n
    return a * b / g(a, b)
};

//2つの整数の最大公約数を求める関数--------------------------------------
function gcd(a, b) {
    if (b === 0) {
        return a
    }
    return gcd(b, a % b)
};
//=============================================================================
let nextBeatTime;
let beatInterval;
let totalBeats = 4; // 4拍子を設定
let yourAudioBuffer; // オーディオデータを格納する変数
let bpm = 220; // BPMを設定する
let rhythm1;
let rhythm2;
let isPlaying = false; // メトロノームが再生中かどうかを追跡するフラグ
let beatCount = 1;
// タイマーIDを保持するための配列
let timerIds = [];
let timerId;

// グローバル変数としてAudioContextとオーディオバッファを保持する変数を定義
let audioContext;
//GainNode のグローバル変数宣言
let gainNode;
// オーディオバッファを保持するオブジェクト
let audioBuffers = {};

// ロードするオーディオファイルの名前を配列で定義
const fileNames = ['HiHat', 'conga808', 'Kick', 'handClap'];

//=============================================================================
// AudioContextの初期化を行う関数
function initializeAudioContext() {
    try {
        // 新しいAudioContextインスタンスを作成
        audioContext = new AudioContext();
        // ゲインノードの初期化
        gainNode = audioContext.createGain();
        // 初期ボリュームを中間値に設定
        gainNode.gain.value = 0.5;
        // ゲインノードをオーディオコンテキストの出力に接続
        gainNode.connect(audioContext.destination);
    } catch (e) {
        console.error("Web Audio APIはこのブラウザではサポートされていません。", e);
    }
};
//=============================================================================
// ページが読み込まれた時にAudioContextを初期化
window.addEventListener('load', () => {
    initializeAudioContext();
    loadAudioFiles();  // オーディオファイルの読み込みも開始
});
//=============================================================================
// オーディオファイルを非同期にロードし、オーディオバッファに変換する関数
async function loadAudioFiles() {
    // Promise.allを使って、各ファイルを非同期に読み込む
    audioBuffers = await Promise.all(fileNames.map(async (fileName) => {
        // fetch APIを使用してオーディオファイルを読み込む
        const response = await fetch(`Audio/${fileName}.mp3`);
        // レスポンスからArrayBufferを取得
        const arrayBuffer = await response.arrayBuffer();
        // ArrayBufferをAudioContextを使ってオーディオデータにデコード
        return await audioContext.decodeAudioData(arrayBuffer);
    })).then(buffers => {
        // 読み込んだオーディオバッファをファイル名と関連付けてオブジェクトに格納
        return fileNames.reduce((obj, name, index) => {
            obj[name] = buffers[index];
            return obj;
        }, {});
    });
};
let beatPattern;
//=============================================================================
// ビートパターンの配列を作成する関数
function generateBeatPattern(lcm, rhythm1, rhythm2) {
    let beatPattern = [];
    let rhythm1Interval = lcm / rhythm1;
    let rhythm2Interval = lcm / rhythm2;

    for (let i = 0; i < lcm; i++) {
        let sounds = ['HiHat']; // HiHatは全てのビートに含まれる

        // 最初のビートにKickを追加
        if (i === 0) {
            sounds.push('Kick');
        }

        // rhythm1の間隔ごとにClaveを追加
        if (i % rhythm1Interval === 0) {
            sounds.push('conga808');
        }

        // rhythm2の間隔ごとにConga808を追加
        if (i % rhythm2Interval === 0) {
            sounds.push('handClap');
        }

        beatPattern.push({ sounds });
    }
    // 結果の確認
    console.log(beatPattern);
    return beatPattern;
}

//=============================================================================
async function metronomeOnOff() {

    bpm = document.getElementById('bpm').value;
    rhythm1 = document.getElementById('rhythm1').value;
    rhythm2 = document.getElementById('rhythm2').value;
    let lcmRhythm = lcm(rhythm1, rhythm2);
    totalBeats = lcmRhythm;

    if (!isPlaying) {
        // メトロノームを開始したときの処理
        if (!audioContext) {
            audioContext = new AudioContext();
            // 必要ならここでオーディオファイルを再度ロードする
        }
        nextBeatTime = audioContext.currentTime;
        // BPMに基づいてビート間隔を秒単位で計算します。
        beatInterval = 60 / (lcmRhythm / rhythm1 * bpm);

        // 'HiHat.mp3'オーディオファイルを非同期で読み込む
        const response = await fetch(`Audio/HiHat.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        // バッファされたオーディオデータをデコードする
        yourAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        // 各ビートをスケジュールする。totalBeatsの数だけ繰り返す。
        for (let i = 0; i < totalBeats; i++) {
            scheduleBeat(i % totalBeats + 1);
        };
        // メトロノームが始まったことを示すためにボタンのテキストを「停止」に変更
        document.getElementById('controlButton').textContent = '停止';
    } else {
        //メトロノームを停止したときの処理
        // メトロノームが既に再生中の場合、AudioContextを閉じて初期化します。
        if (audioContext) {
            audioContext.close(); // AudioContextを閉じる
            audioContext = null; // AudioContextをリセット
            initializeAudioContext()
        };
        // メトロノームを停止するためにボタンのテキストを「開始」に戻す
        document.getElementById('controlButton').textContent = '開始';
        beatCount = 1
        // 保存された全てのタイマーIDに対してclearTimeoutを実行
        timerIds.forEach(id => clearTimeout(id));
        // タイマーIDの配列をクリア
        timerIds = [];
        // ビジュアル表示をリセットするために各ビートのクラスをクリア
        //一度ハイライトを全てリセットする
        for (let i = 1; i <= rhythm1; i++) {
            document.getElementById(`rhythm1Beat${i}`).classList = '';
        };
        for (let i = 1; i <= lcmRhythm; i++) {
            document.getElementById(`leastCommonMultipleBeat${i}`).classList = '';
        };
        for (let i = 1; i <= rhythm2; i++) {
            document.getElementById(`rhythm2Beat${i}`).classList = '';
        };
    };
    isPlaying = !isPlaying; // メトロノームの再生状態を切り替える
};
//=============================================================================
// オーディオバッファを再生する関数
function playSound(buffer, time) {
    if (!audioContext) {
        // 必要ならここでオーディオファイルを再度ロードする
        audioContext = new AudioContext();
        gainNode = audioContext.createGain();
        gainNode.connect(audioContext.destination);
    };
    // 新しいオーディオバッファソースノードを作成
    const source = audioContext.createBufferSource();
    // ソースノードにオーディオバッファを設定
    source.buffer = buffer;
    // ソースノードをゲインノードに接続し、その後オーディオコンテキストの出力に接続
    source.connect(gainNode);
    // 指定された時間にオーディオバッファの再生を開始
    source.start(time);
}

//=============================================================================
function scheduleBeat(beatCount) {
    // メトロノームが停止状態かつnextBeatTimeが0以下の場合、処理を終了
    if (!isPlaying && nextBeatTime <= 0) {
        return;
    };

    // 現在のビートに対応するビートパターンを取得
    const beat = beatPattern[beatCount - 1];

    // ビートに対応する音を再生
    beat.sounds.forEach(sound => {
        if (audioBuffers[sound]) {
            playSound(audioBuffers[sound], nextBeatTime);
        };
    });

    // ビジュアル表示の更新をスケジュール
    const timeUntilNextBeat = nextBeatTime - audioContext.currentTime;
    timerId = setTimeout(() => highlightBeat(beatCount), timeUntilNextBeat * 1000);
    timerIds.push(timerId);
    // 次の拍の音をスケジュール
    timerId = setTimeout(() => scheduleBeat(beatCount), timeUntilNextBeat * 1000);
    timerIds.push(timerId);
    // 次のビートの時間を更新
    nextBeatTime += beatInterval;
};

//=============================================================================
let rhythm1BeatCount = 1
let rhythm2BeatCount = 1
// ビジュアル表示の更新ロジックをここに実装
function highlightBeat(beatCount) {
    if (!isPlaying) {
        return
    };
    rhythm1 = parseInt(document.getElementById('rhythm1').value);
    rhythm2 = parseInt(document.getElementById('rhythm2').value);
    let lcmRhythm = lcm(rhythm1, rhythm2);
    //------------------------------------------------------------------------
    if (beatCount % (lcmRhythm / rhythm1) === 1) {
        //一度rhythm1ハイライトを全てリセットする
        for (let i = 1; i <= rhythm1; i++) {
            document.getElementById(`rhythm1Beat${i}`).classList = '';
        };
        //ハイライトを付ける
        document.getElementById(`rhythm1Beat${rhythm1BeatCount}`).classList = 'highlight1';
        rhythm1BeatCount++
    };
    //------------------------------------------------------------------------
    //一度lcmのハイライトを全てリセットする
    for (let i = 1; i <= lcmRhythm; i++) {
        document.getElementById(`leastCommonMultipleBeat${i}`).classList = '';
    };
    //ハイライトを付ける
    document.getElementById(`leastCommonMultipleBeat${beatCount}`).classList = 'highlightLcm';
    //------------------------------------------------------------------------
    if (beatCount % (lcmRhythm / rhythm2) === 1) {
        //一度rhythm2ハイライトを全てリセットする
        for (let i = 1; i <= rhythm2; i++) {
            document.getElementById(`rhythm2Beat${i}`).classList = '';
        };
        //ハイライトを付ける
        document.getElementById(`rhythm2Beat${rhythm2BeatCount}`).classList = 'highlight2';
        rhythm2BeatCount++
    };
    //------------------------------------------------------------------------
    if (beatCount >= totalBeats) {
        beatCount = 1
        rhythm1BeatCount = 1
        rhythm2BeatCount = 1
    } else {
        beatCount++
    };
}

//=============================================================================
// オーディオバッファを再生する関数
function playSound(buffer, time) {
    if (!audioContext) {
        // 新しいAudioContextインスタンスを作成
        audioContext = new AudioContext();
        // ゲインノードの初期化
        gainNode = audioContext.createGain();
        // 初期ボリュームを中間値に設定
        gainNode.gain.value = 0.5;
        // ゲインノードをオーディオコンテキストの出力に接続
        gainNode.connect(audioContext.destination);
    };
    // 新しいオーディオバッファソースノードを作成
    const source = audioContext.createBufferSource();
    // ソースノードにオーディオバッファを設定
    source.buffer = buffer;
    // ソースノードをオーディオコンテキストの出力に接続
    source.connect(audioContext.destination);
    source.connect(gainNode);
    // 指定された時間にオーディオバッファの再生を開始
    source.start(time);
}

//=============================================================================
// ボタンを押したときに実行される処理
document.getElementById('controlButton').addEventListener('click', () => {
    metronomeOnOff()
});

document.getElementById('Button').addEventListener('click', () => {
    // クリックイベントが発生したときにplaySound関数を呼び出す
    playSound(audioBuffers['HiHat'], audioContext.currentTime);
    playSound(audioBuffers['Kick'], audioContext.currentTime);
});

document.getElementById('bpm').addEventListener('input', function () {
    document.getElementById('bpmValue').textContent = this.value;
    metronomeOnOff()
});


//リズム値の更新とテーブル更新を行う関数
function updateRhythmValueAndTable(rhythmId, tableId) {
    let rhythmValue = parseInt(document.getElementById(rhythmId).value);
    document.getElementById(`${rhythmId}Value`).textContent = rhythmValue;
    updateRhythmTable(rhythmValue, tableId);
}

//共通のリズムテーブル更新を行う関数
function updateCommonRhythmTable(rhythm1Id, rhythm2Id, tableId) {
    let rhythm1 = parseInt(document.getElementById(rhythm1Id).value);
    let rhythm2 = parseInt(document.getElementById(rhythm2Id).value);
    let lcmRhythm = lcm(rhythm1, rhythm2);
    updateRhythmTable(lcmRhythm, tableId);
    // 配列を生成
    beatPattern = generateBeatPattern(lcmRhythm, rhythm1, rhythm2);
}

//イベントリスナーの一般化
document.getElementById('rhythm1').addEventListener('input', function () {
    updateRhythmValueAndTable('rhythm1', 'rhythm1Beat');
    updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');
});

document.getElementById('rhythm2').addEventListener('input', function () {
    updateRhythmValueAndTable('rhythm2', 'rhythm2Beat');
    updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');
});

// ボリュームコントロールのイベントリスナー
document.getElementById('volumeControl').addEventListener('input', function () {
    let volume = this.value;
    gainNode.gain.value = volume / 10; // 0-10 の値を 0-1 に変換
    document.getElementById('volumeValue').textContent = volume; // ボリューム値の表示更新
});
//=============================================================================
function CalculatePolyRhythmTable(mainRhythm, subRhythm) {
    // mainRhythmValueの取得
    // 'Value'というIDが付いている要素からテキスト内容を取得して整数に変換
    let mainRhythmValue = parseInt(document.getElementById(`${mainRhythm}Value`).textContent);
    console.log(mainRhythmValue);

    // mainRhythmのビートテーブルを更新
    updateRhythmTable(mainRhythmValue, `${mainRhythm}Beat`);

    // subRhythmValueの取得
    // 'subRhythm'というIDが付いている入力要素から値を取得して整数に変換
    let subRhythmValue = parseInt(document.getElementById(`${subRhythm}`).value);

    // 最小公倍数を計算して、共通のビートテーブルを更新
    updateRhythmTable(lcm(mainRhythmValue, subRhythmValue), 'leastCommonMultipleBeat');
}

// 拍のビジュアルを描画する関数
function updateRhythmTable(beats, idName) {
    let row = document.getElementById(`${idName}Row`);
    row.innerHTML = ''; // テーブルの行をクリア
    for (let i = 1; i <= beats; i++) {
        let td = document.createElement('td');
        td.id = `${idName}${i}`;  // ユニークなIDを割り当て
        td.textContent = i;
        row.appendChild(td);
    }
}

updateRhythmValueAndTable('rhythm1', 'rhythm1Beat');
updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');
updateRhythmValueAndTable('rhythm2', 'rhythm2Beat');
updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');