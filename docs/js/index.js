'use strict'

//常に正の数の答えを返す剰余演算をする関数 (負の数の剰余演算を処理するため)
function mod(n, m) {
    return ((n % m) + m) % m;
};

// 四捨五入して小数点第3位までを表示する関数 (JavaScriptには元からそういう関数が無いっぽいので)
function roundToThree(num) {
    return +(Math.round(num + "e+3") + "e-3");
};

// 四捨五入して小数点第1位までを表示する関数 (JavaScriptには元からそういう関数が無いっぽいので)
function roundToOne(num) {
    return +(Math.round(num + "e+1") + "e-1");
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
};

// 2の累乗数か否かを判定する関数--------------------------------------
function isPowerOfTwo(n) {
    // 0以下の数は2の累乗ではない
    if (n <= 0) {
        return false;
    }
    // nとn-1のビット単位のAND演算が0であれば、nは2の累乗
    return (n & (n - 1)) === 0;
}

// 全角の数字、アルファベット、スペース、記号を対応する半角文字に変換する関数
function toHalfWidth(str) {
    return str.replace(/[Ａ-Ｚａ-ｚ０-９！-～]/g, function (s) {
        return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    }).replace(/　/g, ' ');
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
//変拍子メトロノームのプリセット
// let selectedPreset = `『Breaking All Illusions』`;
let selectedPreset = `4拍子`;//初期値
const ctsMetronomePreset = [
    {
        name: '3拍子',
        cts: `3/4 + 3/4 + 3/4 + 3/4`,
        timeSig: 3,
        bpm: 168,
        exampleMusic: "赤い公園 - 絶対零度 (0:20 - 0:33)",
        exampleMusicURL: "https://youtu.be/B7HeN3JO9OI?feature=shared&t=45",
        info: "",
    },
    {
        name: '4拍子',
        cts: `4/4 + 4/4 + 4/4 + 4/4`,
        bpm: 120,
        timeSig: 4,
        exampleMusic: "yama - 春を告げる",
        exampleMusicURL: "https://youtu.be/DC6JppqHkaM?feature=shared",
        info: "",
    },
    {
        name: '『Take Five』',
        cts: `3/4 + 2/4`,
        timeSig: 5,
        bpm: 174,
        exampleMusic: "Dave Brubeck - Take Five",
        exampleMusicURL: "https://youtu.be/vmDDOFXSgAs?si=hGYcOfDhziH0Ju1R&t=1",
        info: "",
    },
    {
        name: '『混ぜるな危険』',
        cts: `2/4 + 3/4`,
        timeSig: 5,
        bpm: 184,
        exampleMusic: "tricot - 混ぜるな危険 (0:00 - 0:23)",
        exampleMusicURL: "https://youtu.be/9oboWLb4I1Y?feature=shared",
        info: "",
    },
    {
        name: '『Mission Impossible Theme』',
        cts: `3/8 + 3/8 + 2/4`,
        timeSig: 5,
        bpm: 176,
        exampleMusic: "Mission Impossible Theme (0:06 - 0:19)",
        exampleMusicURL: "https://youtu.be/XAYhNHhxN0A?si=D-EMIbyfV7Lnhonq&t=6",
        info: "",
    },
    {
        name: '『Tarkus』',
        cts: `4/8 + 3/8 + 3/8`,
        timeSig: 5,
        bpm: 200,
        exampleMusic: "Emerson, Lake and Palmer - Tarkus (0:32 - 0:57)",
        exampleMusicURL: "https://youtu.be/H8Ht7xtiXqI?si=Bl9jKTBSpkZJPQV_&t=32",
        info: "",
    },
    {
        name: '『神様、仏様』',
        cts: `6/8 + 6/8 + 6/8 + 6/8`,
        timeSig: 6,
        bpm: 130,
        exampleMusic: "椎名林檎 - 神様、仏様 (3:00 - )",
        exampleMusicURL: "https://youtu.be/42W8bxW14sU?feature=shared&t=179",
        info: "",
    },
    {
        name: '『Art of Life』',
        cts: `3/4 + 4/4`,
        timeSig: 7,
        bpm: 180,
        exampleMusic: "X Japan - Art of Life  (9:38 - 9:56)",
        exampleMusicURL: "https://youtu.be/APazj44j4fw?feature=shared&t=578",
        info: ""
    },
    {
        name: '『The Best Of Times』',
        cts: `4/4 + 3/4`,
        timeSig: 7,
        bpm: 144,
        exampleMusic: "Dream Theater - The Best Of Times  (2:54 - 4:14)",
        exampleMusicURL: "https://youtu.be/xVSM2CB4MLU?feature=shared&t=210",
        info: ""
    },
    {
        name: '『NEW WALL』',
        cts: `3/8 + 3/8 + 2/8 + 3/4`,
        timeSig: 7,
        bpm: 154,
        exampleMusic: "[Alexandros] - NEW WALL  (0:32 - 0:54)",
        exampleMusicURL: "https://youtu.be/WW8LSsHZGTM?feature=shared&t=32",
        info: ""
    },
    {
        name: '『The Count Of Tuscany』',
        cts: `3/8 + 2/8 + 2/8 + 3/8 + 3/8 + 2/8 + 3/8`,
        timeSig: 9,
        bpm: 186,
        exampleMusic: "Dream Theater - The Count Of Tuscany  (3:30 - 3:53)",
        exampleMusicURL: "https://youtu.be/vjoKyj51o_I?feature=shared&t=200",
        info: ""
    },
    {
        name: '『Solitary Shell』',
        cts: `3/8 + 3/8 +  3/8 + 2/8`,
        timeSig: 11,
        bpm: 101.5,
        exampleMusic: "Dream Theater - VI.Solitary Shell (3:46 - 4:21)",
        exampleMusicURL: "https://youtu.be/ByxpvgdgtRU?feature=shared",
        info: ""
    },
    {
        name: '『Electric Sunrise』',
        cts: `3/8 + 3/8 + 3/8 + 3/8 + 1/8`,
        timeSig: 13,
        bpm: 138,
        exampleMusic: "Plini - Electric Sunrise (0:00 - 1:42)",
        exampleMusicURL: "https://youtu.be/Rv_a6rlRjZk?si=Z4FFztFUqjqZmqn5&t=80",
        info: ""
    },
    {
        name: '『ハルシオン』',
        cts: `4/4 + 2/4 + 4/4 + 3/4`,
        timeSig: 13,
        bpm: 180,
        exampleMusic: "ハルシオン - ポルカドットスティングレイ (0:00 - 0:17)",
        exampleMusicURL: "https://youtu.be/0uVKFuRDTQQ?feature=shared",
        info: ""
    },
    {
        name: '『The Ocean』',
        cts: `4/8 + 4/8 + 4/8 + 3/16 + 3/16`,
        timeSig: 15,
        bpm: 89,
        exampleMusic: "Led Zeppelin - The Ocean (0:09 - 1:42)",
        exampleMusicURL: "https://youtu.be/oqAmnEKlIZw?si=UvAEg6vxIVKcZpYo&t=8",
        info: ""
    },
    {
        name: '『The Alien』',
        cts: `2/16 + 3/16 +\n2/16 + 3/16 +\n4/16 + 3/16`,
        timeSig: 17,
        bpm: 110,
        exampleMusic: "Dream Theater - The Alien (0:01 - 1:14)",
        exampleMusicURL: "https://youtu.be/V462IsOV3js?si=5oPRULzF6we8vzu9",
        info: ""
    },
    {
        name: '『Monomyth』',
        cts: `5/8 + 7/8 + 7/8 + 5/8 + 5/8 + 7/8`,
        timeSig: 18,
        bpm: 225,
        exampleMusic: "Animals as Leaders - Monomyth (0:13 - 0:46)",
        exampleMusicURL: "https://youtu.be/1Gi5KtoWY8U?feature=shared&t=12",
        info: ""
    },
    {
        name: '『Pale Blue Dot』',
        cts: `4/16 + 4/16 + 4/16 + 4/16 + 3/16`,
        timeSig: 19,
        bpm: 144,
        exampleMusic: "Dream Theater - Pale Blue Dot (1:05 - 1:46)",
        exampleMusicURL: "https://youtu.be/hX3dYtIrWIk?si=fpuxRi-DdyzurA98&t=66",
        info: ""
    },
    {
        name: '『Levitation 21』',
        cts: `6/16 + 6/16 + 6/16 + 3/16`,
        timeSig: 21,
        bpm: 145,
        exampleMusic: "Tigran Hamasyan - Levitation 21",
        exampleMusicURL: "https://youtu.be/Db3dHajCRRY?feature=shared&t=70",
        info: ""
    },
    {
        name: '『A View from the Top of the World』',
        cts: `6/16 + 6/16 + 6/16 + 5/16`,
        timeSig: 23,
        bpm: 106,
        exampleMusic: "Dream Theater - A View from the Top of the World (0:31 - 2:41)",
        exampleMusicURL: "https://youtu.be/8DeiV0ryQDY?si=VR3g_SDdeNQVR4fx&t=31",
        info: ""
    },
    {
        name: '『EverythingChanges』',
        cts: `5/16 + 5/16 + 4/8 + 2/16 +
        5/16 + 5/16 + 3/8 +
        3/8 + 3/8 +  3/8`,
        timeSig: 27,
        bpm: 130,
        exampleMusic: "宇宙コンビニ - EverythingChanges (0:00 - 0:28)",
        exampleMusicURL: "https://youtu.be/GR8CwENcgEk?feature=shared&t=3",
        info: ""
    },
    {
        name: '『Alive』',
        cts: `2/4 + 3/16 + 2/16 + 2/4 + 3/16 + 3/16`,
        timeSig: 27,
        bpm: 148,
        exampleMusic: "上原ひろみ - Alive (0:50 - 1:08)",
        exampleMusicURL: "https://youtu.be/4ptrsQ9Ju98?si=lW0WX5yECoPaRyrA&t=49",
        info: ""
    },
    {
        name: '『ゴジラ(1954)のテーマ』',
        cts: `4/4 + 2/4 + 3/4 +
        4/4 + 2/4 + 3/4 +
        4/4 + 2/4 + 3/4 +
        4/4 + 4/4 + 4/4`,
        timeSig: 39,
        bpm: 140,
        exampleMusic: "伊福部昭 - ゴジラ(1954) (0:04 - 0:34)",
        exampleMusicURL: "https://youtu.be/V462IsOV3js?si=5oPRULzF6we8vzu9",
        info: ""
    },
    {
        name: '『Breaking All Illusions』',
        cts: `4/4 + 5/8 + 2/4 + 4/4 + 4/4 + 3/8 + 2/8 + 2/8 +
        4/4 + 5/8 + 2/4 + 4/4 + 4/4 + 3/8 + 2/8 + 4/8`,
        timeSig: 41,
        bpm: 150,
        exampleMusic: "Dream Theater - Breaking All Illusions (0:00 - 0:32)",
        exampleMusicURL: "https://youtu.be/HZlYCvamxKM?feature=shared",
        info: ""
    },
    {
        name: '『In the Presence of Enemies,Pt.1』',
        cts: `3/4 + 3/8 + 3/4 + 4/8 +
        3/4 + 3/8 + 4/4 + 3/8 +
        3/4 + 3/8 + 3/4 + 4/8 +
        3/4 + 3/8 + 3/8 + 4/4 + 3/8 + 3/8 `,
        timeSig: 42,
        bpm: 186,
        exampleMusic: "Dream Theater - In the Presence of Enemies,Pt.1 (0:45 - 1:26)",
        exampleMusicURL: "https://youtu.be/methQx40Vd8?feature=shared&t=45",
        info: ""
    },
    //その他の拍子-------------------------------------------------------------------------------
    {
        name: '『Periphery - Marigold』',
        cts: `4/16 + 3/16 + 2/16 + 5/16 + 4/16 + 3/16 + 2/16 + 5/16 +
        4/16 + 3/16 + 2/16 + 5/16 + 4/16 + 3/16 + 2/16 + 5/16 +
        4/16 + 3/16 + 2/16 + 5/16 + 4/16 + 3/16 + 2/16 + 5/16 +
        4/16 + 3/16 + 2/16 + 5/16 + 4/8 + 4/8`,
        timeSig: "その他の",
        bpm: 107,
        exampleMusic: "Periphery - Marigold (0:00 - 1:04)",
        exampleMusicURL: "https://youtu.be/6Czb3M1z0Qs?feature=shared",
        info: ""
    },
    {
        name: '『地球儀 - Spinning Globe』',
        cts: `4/4 + 2/4 + 4/4 +
        4/4 + 2/4 + 4/4 +
        4/4 + 2/4 + 4/4 +
        4/4 + 2/4 + 2/4 +

        4/4 + 2/4 + 4/4 +
        4/4 + 2/4 + 4/4 +
        4/4 + 2/4 + 4/4 +
        4/4 + 4/4 + 4/4`,
        timeSig: "その他の",
        bpm: 78,
        exampleMusic: "米津玄師 - 地球儀 - Spinning Globe (0:17 - 1:17)",
        exampleMusicURL: "https://youtu.be/ByxpvgdgtRU?feature=shared",
        info: ""
    },
    {
        name: '『世界五分前仮説』',
        cts: `5/8 + 3/8 + 5/8 + 4/8 + 4/4 + 4/4 +
        5/8 + 3/8 + 5/8 + 4/8 + 4/4 + 4/4 +
        5/4 + 5/4 + 5/4 + 4/4 +
        5/4 + 5/4 + 5/4 + 4/4 +
        5/4 + 5/4 + 5/4 + 4/4 +
        5/4 + 5/4 + 5/4 + 4/4 + 4/4`,
        timeSig: "その他の",
        bpm: 142,
        exampleMusic: "有形ランペイジ - 世界五分前仮説 (0:18 - 1:06)",
        exampleMusicURL: "https://youtu.be/gOrzlgiPkbc?si=saS2u_nG1BOz0_Nx&t=18",
        info: ""
    },
    {
        name: '『KUMOGAKURE』',
        cts: `5/16 + 5/16 + 3/16 + 2/4 +
        5/16 + 5/16 + 3/16 + 5/8 +
        5/16 + 5/16 + 3/16 + 2/4 +
        5/16 + 5/16 + 3/16 + 3/4 +

        5/16 + 5/16 + 3/16 + 2/4 +
        5/16 + 5/16 + 3/16 + 5/8 +
        5/16 + 5/16 + 3/16 + 2/4 +
        5/16 + 5/16 + 3/16 + 4/4`,
        timeSig: "その他の",
        bpm: 152,
        exampleMusic: "KHUFRUDAMO NOTES - KUMOGAKURE (2:38 - 3:14)",
        exampleMusicURL: "https://youtu.be/VWp20KS4AnY?feature=shared&t=157",
        info: ""
    },
    {
        name: '『運鈍根』',
        cts: `4/4 + 2/8 + 4/4 + 3/8 + 4/4 + 4/8 + 4/4 + 5/8 +
        4/4 + 6/8 + 4/4 + 7/8 + 4/4 + 8/8 + 4/4 + 9/8 +
        4/4 + 10/8 + 4/4 + 11/8 + 4/4 + 12/8 + 4/4 + 13/8 +
        4/4 + 14/8 + 4/4 + 15/8 + 4/4 + 16/8 +
        4/4 + 16/8`,
        timeSig: "その他の",
        bpm: 178,
        exampleMusic: "スプラトゥーン3 運鈍根(Chaos Carnival) (0:00 - 0:50)",
        exampleMusicURL: "https://youtu.be/8_Ax_-RohHk?si=1y-WK84dxa6R0p96&t=2",
        info: ""
    },
    {
        name: '『Metropolis - Part I』',
        cts: `6/8 + 6/8 + 6/8 + 6/8 +
        6/8 + 6/8 + 6/8 + 3/8 +

        2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 2/8 + 3/8 +
        2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 2/8 + 3/8 +

        2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 2/8 + 3/8 +
        2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 2/8 + 3/8 +
        2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 3/8 +

        2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 2/8 + 3/8 +
        2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 2/8 + 3/8 +

        2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 2/8 + 3/8 +
        2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 2/8 + 3/8 + 2/8 +

        2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 3/8 + 2/8 + 3/8 +

        5/4
        `,
        timeSig: "その他の",
        bpm: 195,
        exampleMusic: 'Dream Theater - Metropolis - Part I: "The Miracle and the Sleeper" (7:23 - 8:04)',
        exampleMusicURL: "https://youtu.be/IqqRx77T4Vo?feature=shared&t=442",
        info: ""
    },
    {
        name: '『The Dance of Eternity』',
        cts: `4/4 + 7/8 + 3/4 + 3/4 +
        4/4 + 7/8 + 3/4 + 3/4 +

        4/4 + 4/8 + 3/8 + 3/4 + 4/8 + 3/8 +
        4/4 + 4/8 + 3/8 + 3/4 + 4/8 + 3/8 +

        3/8 + 4/16 + 3/16 +
        3/8 + 1/8 + 4/16 + 3/16 +
        3/8 + 2/8 + 4/16 + 3/16 +
        3/8 + 2/8 + 4/16 +

        4/4 + 7/8 + 3/4 + 3/4 +
        4/4 + 7/8 + 4/4 +
        5/4 +

        3/8 + 2/8 + 4/16 + 3/16 +
        3/8 + 2/16 + 4/16 + 3/16 +
        3/8 + 4/16 + 3/16 +
        4/4 + 6/8 + 6/8
        `,
        timeSig: "その他の",
        bpm: 123.4,
        exampleMusic: "Dream Theater - The Dance of Eternity (0:30 - 1:23)",
        exampleMusicURL: "https://youtu.be/eYCYGpu0OxM?feature=shared&t=30",
        info: ""
    },
]

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

// 音符の種類を決める関数
function DetermineTypeOfNote(BasisNote, note, rest) {
    if (BasisNote === 2) {
        note = MusicalNoteArray[1].note
        rest = MusicalNoteArray[1].rest
    } else if (BasisNote === 4) {
        note = MusicalNoteArray[2].note
        rest = MusicalNoteArray[2].rest
    } else if (BasisNote === 8) {
        note = MusicalNoteArray[3].note
        rest = MusicalNoteArray[3].rest
    } else if (BasisNote === 16) {
        note = MusicalNoteArray[4].note
        rest = MusicalNoteArray[4].rest
    } else if (BasisNote === 32) {
        note = MusicalNoteArray[5].note
        rest = MusicalNoteArray[5].rest
    } else if (BasisNote === 64) {
        note = MusicalNoteArray[6].note
        rest = MusicalNoteArray[6].rest
    } else {
        note = MusicalNoteArray[0].note
        rest = MusicalNoteArray[0].rest
    }
    return { note, rest };
};
//=============================================================================
let nextBeatTime;
let beatInterval;
let totalBeats; // 拍子を格納するグローバル変数
let bpm = 120;//BPMを格納するグローバル変数
let beatCount = 1;

// ----------------------------------------------------
let isPlaying = false; // メトロノームが再生中かどうかを追跡するフラグ

let timerIds = [];// タイマーIDを保持するための配列
let timerId;
// ----------------------------------------------------
let audioContext;// AudioContextとオーディオバッファを保持するグローバル変数
let gainNode;//GainNode のグローバル変数
let audioBuffers = {};// オーディオバッファを保持するオブジェクト

let lordComplete = false;//音色をロードしたか否かを格納しておくグローバル変数
let audioBuffersActive = false;// 音が実際に再生されているか判定する変数

//=============================================================================
// AudioContextの初期化を行う関数
function initializeAudioContext() {
    try {
        //webkitプレフィックスをつける。（WebKit使用のブラウザに対応するため）
        window.AudioContext
            = window.AudioContext || window.webkitAudioContext;
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
    };
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
// ボリュームコントロールのイベントリスナー
document.getElementById('volumeControl').addEventListener('input', function () {
    let volume = this.value;
    gainNode.gain.value = volume / 10; // 0-10 の値を 0-0.5 に変換
    document.getElementById('volumeValue').textContent = volume; // ボリューム値の表示更新
});
