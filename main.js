'use strict'

document.getElementById('bpm').addEventListener('input', function () {
    document.getElementById('bpmValue').textContent = this.value;
});
document.getElementById('rhythm1').addEventListener('input', function () {
    document.getElementById('rhythm1Value').textContent = this.value;
    let rhythm1Value = parseInt(this.value);
    document.getElementById('rhythm1Value').textContent = rhythm1Value;
    updateRhythmTable(rhythm1Value);
});
document.getElementById('rhythm2').addEventListener('input', function () {
    document.getElementById('rhythm2Value').textContent = this.value;
});

let audioContext;
let nextBeatTime;
let beatInterval;
let totalBeats = 4; // 4拍子を設定
let yourAudioBuffer; // オーディオデータを格納する変数
let bpm = 220; // BPMを設定する
let rhythm1;
let rhythm2;
let isPlaying = false; // メトロノームが再生中かどうかを追跡するフラグ
let beatCount = 1;
let timerId;

function updateRhythmTable(beats) {
    let row = document.getElementById('rhythmRow');
    row.innerHTML = ''; // テーブルの行をクリア

    for (let i = 1; i <= beats; i++) {
        let td = document.createElement('td');
        td.id = `beat${i}`;  // ユニークなIDを割り当て
        td.textContent = i;
        row.appendChild(td);
    }
}

updateRhythmTable(parseInt(document.getElementById('rhythm1').value));

async function metronomeOnOff() {
    bpm = document.getElementById('bpm').value;
    rhythm1 = document.getElementById('rhythm1').value;
    rhythm2 = document.getElementById('rhythm2').value;
    totalBeats = rhythm1;

    if (!isPlaying) {
        // AudioContextの作成
        audioContext = new AudioContext();
        nextBeatTime = audioContext.currentTime;
        beatInterval = 60 / bpm; // BPMに基づいてビート間隔を秒単位で計算します。

        // 'HiHat.mp3'オーディオファイルを非同期で読み込む
        const response = await fetch(`Audio/HiHat.mp3`);
        const arrayBuffer = await response.arrayBuffer();
        // バッファされたオーディオデータをデコードする
        yourAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        // 各ビートをスケジュールする。totalBeatsの数だけ繰り返します。
        for (let i = 0; i < totalBeats; i++) {
            scheduleBeat(i % totalBeats + 1);
        }

        // メトロノームが始まったことを示すためにボタンのテキストを「停止」に変更
        document.getElementById('controlButton').textContent = '停止';
    } else {
        // メトロノームが既に再生中の場合、AudioContextを閉じて初期化します。
        if (audioContext) {
            audioContext.close(); // AudioContextを閉じる
            audioContext = null; // AudioContextをリセット
        }

        // メトロノームを停止するためにボタンのテキストを「開始」に戻す
        document.getElementById('controlButton').textContent = '開始';
        beatCount = 1
        clearTimeout(timerId); // 予定されているビートのタイマーをクリア

        // ビジュアル表示をリセットするために各ビートのクラスをクリア
        for (let i = 1; i <= totalBeats; i++) {
            document.getElementById(`beat${i}`).classList = '';
        };
    }
    isPlaying = !isPlaying; // メトロノームの再生状態を切り替える
}


function scheduleBeat(beatNumber) {
    // メトロノームが停止状態であるか、nextBeatTimeが0以下の場合、処理を終了
    if (!isPlaying && nextBeatTime > 0) {
        return;
    }

    // 音をスケジュールするためのオーディオソースを作成
    const source = audioContext.createBufferSource(); // オーディオバッファソースを作成
    source.buffer = yourAudioBuffer; // デコードされたオーディオデータを設定
    source.connect(audioContext.destination); // ソースをオーディオコンテキストの出力に接続
    source.start(nextBeatTime); // 指定された時間に音を再生

    // ビジュアル表示の更新をスケジュールする
    // 現在時刻と次のビートまでの時間差を計算
    const timeUntilNextBeat = nextBeatTime - audioContext.currentTime;
    // 次のビートの時間まで待ってから、ビジュアル表示の関数を実行
    setTimeout(() => highlightBeat(), timeUntilNextBeat * 1000);

    // 次の拍の音をスケジュールする
    // 次のビートの時間まで待ってから、scheduleBeat関数を再帰的に呼び出す
    timerId = setTimeout(() => scheduleBeat((beatNumber % totalBeats) + 1), timeUntilNextBeat * 1000);

    // 次のビートの時間を更新
    // 現在のビート時間にビート間隔を加算
    nextBeatTime += beatInterval;
}


// ボタンを押したときに実行される処理
document.getElementById('controlButton').addEventListener('click', metronomeOnOff);
document.getElementById('bpm').addEventListener('input', updateMetronomeSettings);
document.getElementById('rhythm1').addEventListener('input', updateMetronomeSettings);
document.getElementById('rhythm2').addEventListener('input', updateMetronomeSettings);


// ビジュアル表示の更新ロジックをここに実装
function highlightBeat() {
    if (!isPlaying) {
        return
    };

    for (let i = 1; i <= totalBeats; i++) {
        document.getElementById(`beat${i}`).classList = '';
    };
    document.getElementById(`beat${beatCount}`).classList = 'highlight';
    if (beatCount >= totalBeats) {
        beatCount = 1
    } else {
        beatCount++
    };
}

function updateMetronomeSettings() {
    metronomeOnOff()
    metronomeOnOff()
}