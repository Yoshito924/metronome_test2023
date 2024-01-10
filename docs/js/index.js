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

//互いに素であるかどうかを判定する関数--------------------------------------
function isCoprime(a, b) {
    // 2つの整数の最大公約数を求める関数
    gcd(a, b)

    // 最大公約数が1であれば、二つの数は互いに素
    return gcd(a, b) === 1;
}

// 2の累乗数か否かを判定する関数--------------------------------------
function isPowerOfTwo(n) {
    // 0以下の数は2の累乗ではない
    if (n <= 0) {
        return false;
    }
    // nとn-1のビット単位のAND演算が0であれば、nは2の累乗
    return (n & (n - 1)) === 0;
}

//=============================================================================
// ロードするオーディオファイルの名前を配列で定義
const fileNames = [
    '808conga',
    'bass_drum',
    'clap',
    'clave',
    'click',
    'cowbell',
    'crash',
    'snare',
    'female_voice',
    'hi-hat',
    'hi-hat_open',
    'naiki_voice',
];

//=============================================================================
//ポリリズムメトロノームのプリセット
const polyRhythmPreset = [
    {
        name: 'default', rhythm1: 3, rhythm2: 2,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '3-2', rhythm1: 3, rhythm2: 2,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '5-2', rhythm1: 5, rhythm2: 2,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '3-4s', rhythm1: 3, rhythm2: 4,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '7-2', rhythm1: 7, rhythm2: 2,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '5-3', rhythm1: 5, rhythm2: 3,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '9-2', rhythm1: 9, rhythm2: 2,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '5-4', rhythm1: 5, rhythm2: 4,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '7-3', rhythm1: 7, rhythm2: 3,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '8-3', rhythm1: 8, rhythm2: 3,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '7-4', rhythm1: 7, rhythm2: 4,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '5-6', rhythm1: 5, rhythm2: 6,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '7-5', rhythm1: 7, rhythm2: 5,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '9-4', rhythm1: 9, rhythm2: 4,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '5-8', rhythm1: 5, rhythm2: 8,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '7-6', rhythm1: 7, rhythm2: 6,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '5-9', rhythm1: 5, rhythm2: 9,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '7-8', rhythm1: 7, rhythm2: 8,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '7-9', rhythm1: 7, rhythm2: 9,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '9-8', rhythm1: 9, rhythm2: 8,
        rhythm1Sound: 'click', lcmSound: 'hi-hat', rhythm2Sound: 'cowbell', beatHeadSound: 'bass_drum',
        rhythm1Beat: [], lcmBeat: [], rhythm2Beat: [],
    },
    {
        name: '8Beat', rhythm1: 8, rhythm2: 8,
        rhythm1Sound: 'hi-hat', lcmSound: 'snare', rhythm2Sound: 'bass_drum', beatHeadSound: '',
        rhythm1Beat: [], lcmBeat: [0, 0, 1, 0, 0, 0, 1, 0], rhythm2Beat: [1, 0, 0, 0, 1, 1, 0, 1],
    },
    {
        name: '16Beat1', rhythm1: 16, rhythm2: 16,
        rhythm1Sound: 'hi-hat', lcmSound: 'snare', rhythm2Sound: 'bass_drum', beatHeadSound: '',
        rhythm1Beat: [], lcmBeat: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
        rhythm2Beat: [1, 0, 0, 1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1],
    },
    {
        name: '16Beat2', rhythm1: 16, rhythm2: 16,
        rhythm1Sound: 'hi-hat', lcmSound: 'snare', rhythm2Sound: 'bass_drum', beatHeadSound: '',
        rhythm1Beat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
        lcmBeat: [0, 0, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1],
        rhythm2Beat: [1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0],
    },
    {
        name: 'offBeat', rhythm1: 8, rhythm2: 8,
        rhythm1Sound: 'hi-hat_open', lcmSound: 'snare', rhythm2Sound: 'bass_drum', beatHeadSound: '',
        rhythm1Beat: [0, 1, 0, 1, 0, 1, 0, 1],
        lcmBeat: [0, 0, 1, 0, 0, 0, 1, 0],
        rhythm2Beat: [1, 0, 1, 0, 1, 0, 1, 0],
    },
    {
        name: 'hemiola', rhythm1: 6, rhythm2: 6,
        rhythm1Sound: 'hi-hat', lcmSound: 'snare', rhythm2Sound: 'bass_drum', beatHeadSound: '',
        rhythm1Beat: [],
        lcmBeat: [0, 0, 0, 1, 0, 0],
        rhythm2Beat: [1, 0, 1, 0, 0, 1],
    },
    {
        name: 'shuffle', rhythm1: 12, rhythm2: 12,
        rhythm1Sound: 'hi-hat', lcmSound: 'snare', rhythm2Sound: 'bass_drum', beatHeadSound: '',
        rhythm1Beat: [1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1],
        lcmBeat: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
        rhythm2Beat: [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
    },
]

//=============================================================================
//音符のバリエーションを格納した配列
const MusicalNoteArray = [
    {
        note: '●',
        rest: '◯'
    },
    {
        note: `<img src="./image/note/harfNote.svg" alt="2分音符" title="2分音符 "class="note_image">`,
        rest: `<img src="./image/note/halfRest.svg" alt="2分休符" title="2分休符 "class="note_image">`,
    },
    {
        note: `<img src="./image/note/quarterNote.svg" alt="4分音符" title="4分音符 "class="note_image">`,
        rest: `<img src="./image/note/quarterRest.svg" alt="4分休符" title="4分休符 "class="note_image">`,
    },
    {
        note: `<img src="./image/note/8thNote.svg" alt="8分音符" title="8分音符 "class="note_image">`,
        rest: `<img src="./image/note/8thRest.svg" alt="8分休符" title="8分休符 "class="note_image">`,
    },
    {
        note: `<img src="./image/note/16thNote.svg" alt="16分音符" title="16分音符 "class="note_image">`,
        rest: `<img src="./image/note/16thRest.svg" alt="16分休符" title="16分休符 "class="note_image">`,
    },
    {
        note: `<img src="./image/note/32ndNote.svg" alt="32分音符" title="32分音符 "class="note_image">`,
        rest: `<img src="./image/note/32ndRest.svg" alt="32分休符" title="32分休符 "class="note_image">`,
    },
    {
        note: `<img src="./image/note/64thNote.svg" alt="64分音符" title="64分音符 "class="note_image">`,
        rest: `<img src="./image/note/64thRest.svg" alt="64分休符" title="64分休符 "class="note_image">`,
    },
];

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

