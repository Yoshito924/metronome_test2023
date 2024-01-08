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
let lcmRhythm;
let isPlaying = false; // メトロノームが再生中かどうかを追跡するフラグ
let beatCount = 1;
// タイマーIDを保持するための配列
let timerIds = [];
let timerId;

// グローバル変数としてAudioContextとオーディオバッファを保持する変数を定義
let audioContext;
//GainNode のグローバル変数
let gainNode;
// オーディオバッファを保持するオブジェクト
let audioBuffers = {};

// ----------------------------------------------------
let rhythm1Muted = false; // リズム1のミュート状態
let lcmMuted = false; // LCMのミュート状態
let rhythm2Muted = false; // リズム2のミュート状態
let beatHeadMuted = false; // 拍の頭のミュート状態


//=============================================================================
// AudioContextの初期化を行う関数
function initializeAudioContext() {
    try {
        // 新しいAudioContextインスタンスを作成
        audioContext = new AudioContext();
        // ゲインノードの作成
        gainNode = audioContext.createGain();
        // 初期ボリュームを低めに設定
        gainNode.gain.value = 0.1;
        // ゲインノードをオーディオコンテキストの出力に接続
        gainNode.connect(audioContext.destination);
    } catch (e) {
        console.error("Web Audio APIはこのブラウザではサポートされていません。", e);
    }
};

//=============================================================================
// ロードするオーディオファイルの名前を配列で定義
const fileNames = ['HiHat', 'conga808', 'Kick', 'handClap'];

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

//=============================================================================
// ページが読み込まれた時にAudioContextを初期化
window.addEventListener('load', () => {
    initializeAudioContext();
    loadAudioFiles();  // オーディオファイルの読み込みも開始
});

// ビートの構成を保存しておく配列
let beatPattern;
//=============================================================================
// ビートパターンの配列を作成する関数
function generateBeatPattern(lcm, rhythm1, rhythm2) {
    let beatPattern = [];
    let rhythm1Interval = lcm / rhythm1;
    let rhythm2Interval = lcm / rhythm2;
    let sounds = [];
    // console.log(lcm, rhythm1, rhythm2)
    // console.log(beatCount, rhythm1BeatCount, rhythm2BeatCount)
    console.log(rhythm1BeatStates, lcmBeatStates, rhythm2BeatStates)

    // console.log(lcmMuted, beatHeadMuted, rhythm1Muted, rhythm2Muted)
    for (let i = 0; i < lcm; i++) {
        if (lcmMuted === false) {
            sounds = ['HiHat']; // HiHatは全てのビートに含まれる
        } else {
            sounds = [''];
        }
        // ビートの先頭の音を追加
        if (i === 0 && beatHeadMuted === false) {
            sounds.push('Kick');
        }
        // rhythm1の音を追加
        if (i % rhythm1Interval === 0 && rhythm1Muted === false) {
            sounds.push('conga808');
        }
        // rhythm2の音を追加
        if (i % rhythm2Interval === 0 && rhythm2Muted === false) {
            sounds.push('handClap');
        }
        beatPattern.push({ sounds });
    }

    // 結果の確認
    return beatPattern;
}

//=============================================================================
async function metronomeOnOff() {
    bpm = document.getElementById('bpm').value;
    rhythm1 = document.getElementById('rhythm1').value;
    rhythm2 = document.getElementById('rhythm2').value;
    lcmRhythm = lcm(rhythm1, rhythm2);
    totalBeats = lcmRhythm;

    if (!isPlaying) {
        // メトロノームを開始したときの処理
        if (!audioContext) {
            initializeAudioContext()
        }
        nextBeatTime = audioContext.currentTime;
        // BPMに基づいてビート間隔を秒単位で計算。
        beatInterval = 60 / (lcmRhythm / rhythm1 * bpm);
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
        console.log(rhythm1, rhythm2)
        for (let i = 1; i <= rhythm1; i++) {
            let element = document.getElementById(`rhythm1Beat${i}`);
            //要素がある場合のみ削除
            if (element) {
                element.classList = '';
            }
        };
        for (let i = 1; i <= lcmRhythm; i++) {
            let element = document.getElementById(`leastCommonMultipleBeat${i}`);
            //要素がある場合のみ削除
            if (element) {
                element.classList = '';
            }
        };
        for (let i = 1; i <= rhythm2; i++) {
            let element = document.getElementById(`rhythm2Beat${i}`);
            //要素がある場合のみ削除
            if (element) {
                element.classList = '';
            }
        };
        //ビートのカウントをリセット
        beatCount = 1
        rhythm1BeatCount = 1
        rhythm2BeatCount = 1
    };
    isPlaying = !isPlaying; // メトロノームの再生状態を切り替える
};

//=============================================================================
function scheduleBeat(beatCount) {
    // メトロノームが停止状態かつnextBeatTimeが0以下の場合、処理を終了
    if (!isPlaying && nextBeatTime <= 0) {
        return;
    };
    // 配列を生成
    beatPattern = generateBeatPattern(lcmRhythm, rhythm1, rhythm2);
    // 現在のビートに対応するビートパターンを取得
    const beat = beatPattern[beatCount - 1];

    // ビートに対応する音を再生
    beat.sounds.forEach(sound => {
        // 新しいAudioBufferSourceNodeを作成
        if (audioBuffers[sound]) {
            playSound(audioBuffers[sound], nextBeatTime);
        };
    });

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

    if (beatCount % (lcmRhythm / rhythm1) === 1 || lcmRhythm === rhythm1) {
        //一度rhythm1ハイライトを全てリセットする
        for (let i = 1; i <= rhythm1; i++) {
            let element = document.getElementById(`rhythm1Beat${i}`);
            //要素がある場合のみ削除
            if (element) {
                element.classList = '';
            }
        };
        //ハイライトを付ける
        document.getElementById(`rhythm1Beat${rhythm1BeatCount}`).classList = 'highlight1';
        rhythm1BeatCount++
    };
    //------------------------------------------------------------------------
    //一度lcmのハイライトを全てリセットする
    for (let i = 1; i <= lcmRhythm; i++) {
        let element = document.getElementById(`leastCommonMultipleBeat${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList = '';
        }
    };
    //ハイライトを付ける
    document.getElementById(`leastCommonMultipleBeat${beatCount}`).classList = 'highlightLcm';
    //------------------------------------------------------------------------
    if (beatCount % (lcmRhythm / rhythm2) === 1 || lcmRhythm === rhythm2) {
        //一度rhythm2ハイライトを全てリセットする
        for (let i = 1; i <= rhythm2; i++) {
            let element = document.getElementById(`rhythm2Beat${i}`);
            //要素がある場合のみ削除
            if (element) {
                element.classList = '';
            }
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
        initializeAudioContext()
    };
    // 新しいオーディオバッファソースノードを作成
    const source = audioContext.createBufferSource();
    // ソースノードにオーディオバッファを設定
    source.buffer = buffer;
    // ソースをゲインノードに接続
    source.connect(gainNode);
    // 指定された時間にオーディオバッファの再生を開始
    source.start(time);
}

function playSoundIfNotMuted(sound, time) {
    switch (sound) {
        case 'rhythm1Sound':
            if (!rhythm1Muted) playSound(sound, time);
            break;
        case 'lcmSound':
            if (!lcmMuted) playSound(sound, time);
            break;
        case 'rhythm2Sound':
            if (!rhythm2Muted) playSound(sound, time);
            break;
        case 'beatHeadSound':
            if (!beatHeadMuted) playSound(sound, time);
            break;
        default:
            playSound(sound, time); // その他の音は常に再生
    }
}


// --------------------------------------------------------------
let rhythm1BeatStates = [];  // リズム1のビート状態
let lcmBeatStates = [];      // LCMのビート状態
let rhythm2BeatStates = [];  // リズム2のビート状態

//ビート状態の配列を初期化する関数
function initializeBeatStates(rhythm1Length, lcmLength, rhythm2Length) {
    rhythm1BeatStates = new Array(rhythm1Length).fill(true);
    lcmBeatStates = new Array(lcmLength).fill(true);
    rhythm2BeatStates = new Array(rhythm2Length).fill(true);
}

//リズム値の更新とテーブル更新を行う関数
function updateRhythmValueAndTable(rhythmId, tableId, beatStates) {
    //メトロノームが動作中ならばいったん止める
    if (isPlaying) {
        metronomeOnOff()
    };
    let rhythmValue = parseInt(document.getElementById(rhythmId).value);
    document.getElementById(`${rhythmId}Value`).textContent = rhythmValue;
    updateRhythmTable(rhythmValue, tableId, beatStates);
}

//lcmリズムテーブル更新を行う関数
function updateCommonRhythmTable(rhythm1Id, rhythm2Id, tableId) {
    let rhythm1 = parseInt(document.getElementById(rhythm1Id).value);
    let rhythm2 = parseInt(document.getElementById(rhythm2Id).value);
    let lcmRhythm = lcm(rhythm1, rhythm2);
    updateRhythmTable(lcmRhythm, tableId, lcmBeatStates);
}

//リズム1の値が変更された時の処理
document.getElementById('rhythm1').addEventListener('input', function () {
    updateRhythmValueAndTable('rhythm1', 'rhythm1Beat', rhythm1BeatStates);
    updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');
});

//リズム1の値が変更された時の処理
document.getElementById('rhythm2').addEventListener('input', function () {
    updateRhythmValueAndTable('rhythm2', 'rhythm2Beat', rhythm2BeatStates);
    updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');
});

//=============================================================================


// 拍のビジュアルをHTML上に描画する関数
function updateRhythmTable(beats, idName, beatStates) {
    let row = document.getElementById(`${idName}Row`);
    row.innerHTML = '';
    for (let i = 1; i <= beats; i++) {
        let td = document.createElement('td');
        td.id = `${idName}${i}`;
        td.textContent = i;
        td.addEventListener('click', function () {
            beatStates[i - 1] = !beatStates[i - 1];
            this.classList.toggle('muted');
        });
        // ---------------------
        row.appendChild(td);
    }
    //ビートのカウントをリセット
    beatCount = 1
    rhythm1BeatCount = 1
    rhythm2BeatCount = 1
}

updateRhythmValueAndTable('rhythm1', 'rhythm1Beat');
updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');
updateRhythmValueAndTable('rhythm2', 'rhythm2Beat');
updateCommonRhythmTable('rhythm1', 'rhythm2', 'leastCommonMultipleBeat');

//=============================================================================
// イベントリスナー

// ボタンを押したときに実行される処理
document.getElementById('controlButton').addEventListener('click', () => {
    metronomeOnOff()
});


//BPMが変更された時の処理
document.getElementById('bpm').addEventListener('input', function () {
    //メトロノームが動作中ならばいったん止める
    if (isPlaying) {
        metronomeOnOff()
    };
    document.getElementById('bpmValue').textContent = this.value;
});

document.getElementById('muteRhythm1').addEventListener('click', () => {
    rhythm1Muted = !rhythm1Muted;
    console.log(rhythm1Muted)
});
document.getElementById('muteLCM').addEventListener('click', () => {
    lcmMuted = !lcmMuted;
});
document.getElementById('muteRhythm2').addEventListener('click', () => {
    rhythm2Muted = !rhythm2Muted;
});
document.getElementById('muteBeatHead').addEventListener('click', () => {
    beatHeadMuted = !beatHeadMuted;
});

// ボリュームコントロールのイベントリスナー
document.getElementById('volumeControl').addEventListener('input', function () {
    let volume = this.value;
    gainNode.gain.value = volume / 10; // 0-10 の値を 0-0.5 に変換
    document.getElementById('volumeValue').textContent = volume; // ボリューム値の表示更新
});