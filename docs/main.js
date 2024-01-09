'use strict'

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
let totalBeats; // 拍子を設定
let bpm = 120;
// ----------------------------------------------------
let rhythm1;
let rhythm2;
let lcmRhythm;
// ----------------------------------------------------
let isPlaying = false; // メトロノームが再生中かどうかを追跡するフラグ
let beatCount = 1;
// ----------------------------------------------------
let timerIds = [];// タイマーIDを保持するための配列
let timerId;
// ----------------------------------------------------
let audioContext;// AudioContextとオーディオバッファを保持するグローバル変数
let gainNode;//GainNode のグローバル変数
let audioBuffers = {};// オーディオバッファを保持するオブジェクト
// ----------------------------------------------------
let rhythm1Muted = false; // リズム1のミュート状態
let lcmMuted = false; // LCMのミュート状態
let rhythm2Muted = false; // リズム2のミュート状態
let beatHeadMuted = false; // 拍の頭のミュート状態
// ----------------------------------------------------
let rhythm1BeatStates = [];  // リズム1のビート状態
let lcmBeatStates = [];      // LCMのビート状態
let rhythm2BeatStates = [];  // リズム2のビート状態
// ----------------------------------------------------
// 基準となるポリリズムの値を格納する変数
let polyRhythmBasisValue;
// 選択された音符の種類（2分音符、4分音符など）を格納する変数
let polyRhythmBasisNote;
//音色をロードしたか否か
let lordComplete = false;
// ロードするオーディオファイルの名前を配列で定義
const fileNames = [
    '808conga',
    'bass_drum',
    'clap',
    'clave',
    'click',
    'cowbell',
    'edm_percussion',
    'female_voice',
    'hi-hat',
    'naiki_voice',
];

//音符のバリエーションを格納した配列
const noteArray = [
    { note: '●', rest: '◯' },
    { note: '&#x1D15E;', rest: '&#x1D13C;' },
    { note: '♩', rest: '&#x1D13D;' },
    { note: '&#9834;', rest: '&#x1D13E;' },
    { note: '&#x1D161;', rest: '&#x1D13F;' },
];

//=============================================================================
//ビート状態の配列を初期化する関数
function initializeBeatStates() {
    let rhythm1Length = parseInt(document.getElementById('rhythm1').value);
    let rhythm2Length = parseInt(document.getElementById('rhythm2').value);
    let lcmLength = lcm(rhythm1Length, rhythm2Length);
    rhythm1BeatStates = new Array(rhythm1Length).fill(true);
    lcmBeatStates = new Array(lcmLength).fill(true);
    rhythm2BeatStates = new Array(rhythm2Length).fill(true);
};

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
    lordComplete = true;
};

//=============================================================================
// ビートの構成を保存しておく配列
let beatPattern;
//クリックの音色を格納するグローバル変数
let rhythm1ClickSound;
let lcmClickSound;
let rhythm2ClickSound;
let beatHeadClickSound;

// ビートパターンの配列を作成する関数
function generateBeatPattern(lcm, rhythm1, rhythm2) {
    let beatPattern = [];
    let rhythm1Interval = lcm / rhythm1;
    let rhythm2Interval = lcm / rhythm2;
    let sounds = [];
    let rhythm1Counter = 0
    let rhythm2Counter = 0
    // -------------------------------------------
    rhythm1ClickSound = (document.getElementById("rhythm1ClickSound").value)
    lcmClickSound = (document.getElementById("lcmClickSound").value)
    rhythm2ClickSound = (document.getElementById("rhythm2ClickSound").value)
    beatHeadClickSound = (document.getElementById("beatHeadClickSound").value)
    // -------------------------------------------
    for (let i = 0; i < lcm; i++) {
        // -------------------------------------------
        // lcmの音を追加
        if (lcmBeatStates[i] === false) {
            sounds = [''];
        } else if (lcmMuted === false) {
            sounds = [lcmClickSound]; // 基本的に全てのビートに含まれる
        } else {
            sounds = [''];
        }
        // -------------------------------------------
        // ビートの先頭の音を追加
        if (i === 0 && beatHeadMuted === false) {
            sounds.push(beatHeadClickSound);
        }
        // -------------------------------------------
        // rhythm1の音を追加
        if (i % rhythm1Interval === 0 && rhythm1Muted === false && rhythm1BeatStates[rhythm1Counter] === true) {
            sounds.push(rhythm1ClickSound);
            rhythm1Counter++
        } else if (i % rhythm1Interval === 0) {
            rhythm1Counter++
        }
        // -------------------------------------------
        // rhythm2の音を追加
        if (i % rhythm2Interval === 0 && rhythm2Muted === false && rhythm2BeatStates[rhythm2Counter] === true) {
            sounds.push(rhythm2ClickSound);
            rhythm2Counter++
        } else if (i % rhythm2Interval === 0) {
            rhythm2Counter++
        }
        // -------------------------------------------
        beatPattern.push({ sounds });
    }
    // 結果の確認
    return beatPattern;
}

//=============================================================================
// メトロノームをオンオフする関数
async function metronomeOnOff() {
    bpm = document.getElementById('bpm').value;
    rhythm1 = document.getElementById('rhythm1').value;
    rhythm2 = document.getElementById('rhythm2').value;
    lcmRhythm = lcm(rhythm1, rhythm2);
    totalBeats = lcmRhythm;
    // 基準となるポリリズムの値を取得
    polyRhythmBasisValue = parseInt(document.getElementById('polyRhythm_basis_Value').value);
    // 選択された音符の種類（2分音符、4分音符など）を取得
    polyRhythmBasisNote = parseInt(document.getElementById('polyRhythm_basis_note').value);
    if (!isPlaying) {
        // メトロノームを開始したときの処理
        if (!audioContext) {
            initializeAudioContext()
        }
        nextBeatTime = audioContext.currentTime;
        // BPMに基づいて最小のクリックの間隔を計算(ms)。
        if (polyRhythmBasisValue === 1) {
            beatInterval = (60 / (lcmRhythm / rhythm1 * bpm)) / (polyRhythmBasisNote / 4);
        } else if (polyRhythmBasisValue === 0) {
            beatInterval = (60 / bpm) / (polyRhythmBasisNote / 4);
        }
        // 各ビートをスケジュールする。totalBeatsの数だけ繰り返す。
        for (let i = 0; i < totalBeats; i++) {
            scheduleBeat(i % totalBeats + 1);
        };
    } else {
        //メトロノームを停止したときの処理
        // メトロノームが既に再生中の場合、AudioContextを閉じて初期化します。
        if (audioContext) {
            audioContext.close(); // AudioContextを閉じる
            audioContext = null; // AudioContextをリセット
            initializeAudioContext()
        };
        beatCount = 1
        // 保存された全てのタイマーIDに対してclearTimeoutを実行
        timerIds.forEach(id => clearTimeout(id));
        // タイマーIDの配列をクリア
        timerIds = [];
        // ビジュアル表示をリセットするために各ビートのクラスをクリア
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
    if (!isPlaying) {
        // メトロノームを停止するためにボタンのテキストを「開始」に戻す
        document.getElementById('controlButton').textContent = '開始';
    } else {
        // メトロノームが始まったことを示すためにボタンのテキストを「停止」に変更
        document.getElementById('controlButton').textContent = '停止';
    }
    isPlaying = !isPlaying; // メトロノームの再生状態を切り替える
};

//=============================================================================
// ビートをスケジュールする関数
function scheduleBeat(beatCount) {
    // メトロノームが停止状態かつnextBeatTimeが0以下の場合、処理を終了
    if (!isPlaying && nextBeatTime <= 0) {
        return;
    };
    // 配列を生成
    beatPattern = generateBeatPattern(lcmRhythm, rhythm1, rhythm2);
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
let rhythm1BeatCount;
let rhythm2BeatCount;
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

// --------------------------------------------------------------
//リズムテーブル更新を行う関数
function updateCommonRhythmTable() {
    let rhythm1 = parseInt(document.getElementById('rhythm1').value);
    let rhythm2 = parseInt(document.getElementById('rhythm2').value);
    let lcmRhythm = lcm(rhythm1, rhythm2);

    //clmの値をhtmlに描画する
    document.getElementById('lcmValue').innerHTML = ''
    document.getElementById('lcmValue').innerHTML = `【LCM】：${lcmRhythm}`

    // ビート状態の配列を初期化する関数
    initializeBeatStates();

    //拍のビジュアルをHTML上に描画する
    updateRhythmTable(rhythm1, 'rhythm1Beat', rhythm1BeatStates);
    updateRhythmTable(lcmRhythm, 'leastCommonMultipleBeat', lcmBeatStates);
    updateRhythmTable(rhythm2, 'rhythm2Beat', rhythm2BeatStates);
}

// 音符の種類を決める関数
function DetermineTypeOfNote(BasisNote, note, rest) {
    if (BasisNote === 2) {
        note = noteArray[1].note
        rest = noteArray[1].rest
    } else if (BasisNote === 4) {
        note = noteArray[2].note
        rest = noteArray[2].rest
    } else if (BasisNote === 8) {
        note = noteArray[3].note
        rest = noteArray[3].rest
    } else if (BasisNote === 16) {
        note = noteArray[4].note
        rest = noteArray[4].rest
    } else {
        note = noteArray[0].note
        rest = noteArray[0].rest
    }
    return { note, rest };
}

// 拍のビジュアルをHTML上に描画する関数
function updateRhythmTable(beats, idName, beatStates) {
    //メトロノームが動作中ならばいったん止める
    if (isPlaying) {
        metronomeOnOff()
    };

    let row = document.getElementById(`${idName}Row`);
    row.innerHTML = '';
    //------------------------------------------------------------------------
    // 基準となるポリリズムの値を取得
    polyRhythmBasisValue = parseInt(document.getElementById('polyRhythm_basis_Value').value);
    // 選択された音符の種類（2分音符、4分音符など）を取得
    polyRhythmBasisNote = parseInt(document.getElementById('polyRhythm_basis_note').value);
    let note;
    let rest;
    let returnNote = { note: '', rest: '' }
    //表示する音符を決定する処理
    if (polyRhythmBasisValue === 1 && idName === 'rhythm1Beat') {
        //基準となる音符がrhythm1の場合
        returnNote = DetermineTypeOfNote(polyRhythmBasisNote, note, rest);// 音符の種類を決める関数
        note = returnNote.note;
        rest = returnNote.rest;
    } else if (polyRhythmBasisValue === 0 && idName === 'leastCommonMultipleBeat') {
        //基準となる音符がlcmの場合
        returnNote = DetermineTypeOfNote(polyRhythmBasisNote, note, rest);// 音符の種類を決める関数
        note = returnNote.note;
        rest = returnNote.rest;
    } else {
        note = noteArray[0].note
        rest = noteArray[0].rest
    }

    //------------------------------------------------------------------------
    for (let i = 1; i <= beats; i++) {
        let td = document.createElement('td');
        td.id = `${idName}${i}`;
        // beatStatesがfalseの場合に特定の文字列を出力
        if (!beatStates[i - 1]) {
            td.innerHTML = `${i}<br>${rest}`;
        } else {
            td.innerHTML = `${i}<br>${note}`;
        }

        td.addEventListener('click', function () {
            beatStates[i - 1] = !beatStates[i - 1];
            // 再度条件をチェックして、内容を切り替える
            console.log(rhythm1BeatStates, lcmBeatStates, rhythm2BeatStates)

            if (!beatStates[i - 1]) {
                this.innerHTML = `${i}<br>${rest}`;
            } else {
                this.innerHTML = `${i}<br>${note}`;
            }
            this.classList.toggle('muted');
        });
        row.appendChild(td);
    }
    //ビートのカウントをリセット
    beatCount = 1
    rhythm1BeatCount = 1
    rhythm2BeatCount = 1
}


//=============================================================================
// イベントリスナー
// ページが読み込まれた時に実行する関数
window.addEventListener('load', () => {
    // AudioContextを初期化
    initializeAudioContext();
    // オーディオファイルの読み込みを開始
    loadAudioFiles();
    // ビート状態の配列を初期化する関数（↓イベントリスナー効かなくなるので拍のビジュアルをHTML上に描画する関数の前に実行しないとダメ）
    initializeBeatStates()
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable()
});

// 再生・停止ボタンを押したときに実行される処理
document.getElementById('controlButton').addEventListener('click', () => {
    metronomeOnOff();
});

// キーボードイベントのリスナーを追加
document.addEventListener('keydown', function (event) {
    // スペースキーが押されたかチェック
    if (event.key === " ") {
        metronomeOnOff();
    }
});

//BPMが変更された時の処理
document.getElementById('bpm').addEventListener('input', function () {
    //メトロノームが動作中ならば
    if (isPlaying) {
        //いったん止める
        metronomeOnOff()
        //0.1秒後にメトロノームを再開する
        setTimeout(() => {
            if (!isPlaying) {
                metronomeOnOff()
            };
        }, "100");
    };
    document.getElementById('bpmValue').textContent = this.value;
});

//リズム1の値が変更された時の処理
document.getElementById('rhythm1').addEventListener('input', function () {
    //メトロノームが動作中ならば
    if (isPlaying) {
        //いったん止める
        metronomeOnOff()
        //0.1秒後にメトロノームを再開する
        setTimeout(() => {
            if (!isPlaying) {
                metronomeOnOff()
            };
        }, "100");
    };
    document.getElementById('rhythm1Value').textContent = this.value;
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable()
});

//リズム2の値が変更された時の処理
document.getElementById('rhythm2').addEventListener('input', function () {
    //メトロノームが動作中ならば
    if (isPlaying) {
        //いったん止める
        metronomeOnOff()
        //0.1秒後にメトロノームを再開する
        setTimeout(() => {
            if (!isPlaying) {
                metronomeOnOff()
            };
        }, "100");
    };
    document.getElementById('rhythm2Value').textContent = this.value;
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable()
});

//基準となるリズムの種類を選択するドロップダウンリストのイベントリスナー
document.getElementById('polyRhythm_basis_Value').addEventListener('change', function () {
    polyRhythmBasisValue = this.value;
    //メトロノームが動作中ならば
    if (isPlaying) {
        //いったん止める
        metronomeOnOff()
        //0.1秒後にメトロノームを再開する
        setTimeout(() => {
            if (!isPlaying) {
                metronomeOnOff()
            };
        }, "100");
    };
    updateCommonRhythmTable()
});

//基準となる音符の種類を選択するドロップダウンリストのイベントリスナー
document.getElementById('polyRhythm_basis_note').addEventListener('change', function () {
    polyRhythmBasisNote = this.value;
    //メトロノームが動作中ならば
    if (isPlaying) {
        //いったん止める
        metronomeOnOff()
        //0.1秒後にメトロノームを再開する
        setTimeout(() => {
            if (!isPlaying) {
                metronomeOnOff()
            };
        }, "100");
    };
    updateCommonRhythmTable()
});

//ミュートボタンのイベントリスナー
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