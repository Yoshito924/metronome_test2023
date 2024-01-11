'use strict'

//最も細かい表紙の分母
let smallestBeat = 4;
//=============================================================================
// let timeSignatureText = "4/4,5/8,4/4,13/16"
// let timeSignatureText = "4/4,5/8,2/4,4/4,4/4,7/8"
// let timeSignatureText = "4/4,5/16,5/16,7/16,5/16,7/16,5/16,5/16,7/16,4/16,3/16,3/16,4/16,3/16,3/16"
let timeSignatureText = "2/4,3/16,2/16,2/4,3/16,3/16"
// let timeSignatureText = "4/4,3/16"
// let timeSignatureText = "4/4"

//メトロノームの表紙を格納するグローバル配列
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

//拍子のビートの合計値を計算する関数
function calculateCtsBeat() {
    //配列に拍子を格納
    timeSignatureArray = timeSignatureText.split(",");
    //拍子を格納する配列：ts(Time Signature)
    let ts = [];
    //拍子の整数型を格納する配列：tsInt(Time Signature Int)
    let tsInt = {
        numerator: [], denominator: []
    };
    //最も細かい拍子に合わせて「通分した値」を格納する配列：tsR(Time Signature Reduce to a common denominator)
    let tsR = {
        numerator: [], denominator: []
    };
    // ------------------------------------------------------------------------------
    // 配列に格納された拍子テキストの分母と分子を分割し整数型にする
    for (let i = 0; i < timeSignatureArray.length; i++) {
        ts = timeSignatureArray[i].split("/");
        //整数型に変換して配列に格納する
        tsInt.numerator.push(parseInt(ts[0]))
        tsInt.denominator.push(parseInt(ts[1]))
        //拍子の値が2の累乗数じゃないか1である場合はここで判定する
        if (isPowerOfTwo(tsInt.denominator[i]) === false || tsInt.denominator[i] === 1) {
            console.log("この中には、あり得ぬ拍子が…おる…")
            return;
        };
    };
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
    //------------------------------------------------------------------------------
    //クリックを管理する配列を初期化する
    ctsBeatStates = new Array().fill(true);
    //変拍子の数だけループ
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

// メトロノームをオンオフする関数
async function ctsMetronomeOnOff() {
    bpm = parseInt(document.getElementById('bpm').value);
    //1周期の長さを格納する変数
    totalBeats = beatTotalValue;
    //拍子のビートの合計値を計算する関数
    calculateCtsBeat()
    if (!isPlaying) {
        // メトロノームを開始したときの処理
        if (!audioContext) {
            initializeAudioContext()
        };

        nextBeatTime = audioContext.currentTime;
        // BPMに基づいて最小のクリックの間隔を計算(ms)。
        beatInterval = (60 / bpm) / (smallestBeat / 4);

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
        // for (let i = 1; i <= rhythm1; i++) {
        //     let element = document.getElementById(`rhythm1Beat${i}`);
        //     //要素がある場合のみ削除
        //     if (element) {
        //         element.classList.remove("highlight1")
        //     }
        // };
        // 音が実際に再生されているか判定する変数をfalseにする
        audioBuffersActive = false;
        //ビートのカウントをリセット
        beatCount = 1
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
    }
    //------------------------------------------------------------------------
    // 本当に音が再生されているかチェックするための処理
    setTimeout(() => {
        //少し時間を待ってチェックする
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
            }, "100");
            ctsMetronomeOnOff();
        };
    }, 200);
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
        }
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
    // timerId = setTimeout(() => highlightBeat(beatCount), timeUntilNextBeat * 1000);
    // timerIds.push(timerId);
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

    // //------------------------------------------------------------------------
    // if (beatCount % (lcmRhythm / rhythm1) === 1 || lcmRhythm === rhythm1) {
    //     //一度rhythm1ハイライトを全てリセットする
    //     for (let i = 1; i <= rhythm1; i++) {
    //         let element = document.getElementById(`rhythm1Beat${i}`);
    //         //要素がある場合のみ削除
    //         if (element) {
    //             element.classList.remove("highlight1")
    //         }
    //     };
    //     //ハイライトを付ける
    //     document.getElementById(`rhythm1Beat${rhythm1BeatCount}`).classList.add('highlight1');
    //     rhythm1BeatCount++
    // };

    // //------------------------------------------------------------------------
    // if (beatCount >= totalBeats) {
    //     beatCount = 1
    // } else {
    //     beatCount++
    // };
};

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
    let volume = parseInt(document.getElementById('volumeControl').value);
    gainNode.gain.value = volume / 10; // 0-10 の値を 0-0.5 に変換
    // ソースをゲインノードに接続
    source.connect(gainNode);
    // 指定された時間にオーディオバッファの再生を開始
    source.start(time);
    //音が再生されているか否かを判定する変数をtrueにする。
    audioBuffersActive = true;
};

// --------------------------------------------------------------
//リズムテーブル更新を行う関数
function updateCommonRhythmTable() {
    let rhythm1 = parseInt(document.getElementById('rhythm1').value);
    let rhythm2 = parseInt(document.getElementById('rhythm2').value);
    let lcmRhythm = lcm(rhythm1, rhythm2);

    //clmの値をhtmlに描画する
    document.getElementById('lcmValue').innerHTML = ''
    document.getElementById('lcmValue').innerHTML = `【LCM】：${lcmRhythm}`

    // 基準となるポリリズムの値を取得
    polyRhythmBasisValue = parseInt(document.getElementById('polyRhythm_basis_Value').value);
    // 選択された音符の種類（2分音符、4分音符など）を取得
    polyRhythmBasisNote = parseInt(document.getElementById('polyRhythm_basis_note').value);

    // 最大公約数を求める
    let gcdValue = gcd(rhythm1, rhythm2);

    //拍子記号をhtmlに描画する
    if (isCoprime(rhythm1, rhythm2) === true) {
        //ポリリズムである場合（互いに素である場合）
        document.getElementById('infoText').innerHTML = ''
        document.getElementById('infoText').innerHTML = `<br>GCD：${gcdValue}（リズム1と2の値は互いに素）<br>ポリリズムです。`
        //拍子を書き込む
        document.getElementById('polyRhythmTimeSignature').innerHTML = ''
        if (isPowerOfTwo(lcmRhythm / rhythm1 * polyRhythmBasisNote) === true && polyRhythmBasisValue === 1) {
            // 基準がリズム1のポリリズム
            document.getElementById('polyRhythmTimeSignature').innerHTML = `${lcmRhythm}<br>―<br>${lcmRhythm / rhythm1 * polyRhythmBasisNote}`
        } else if (polyRhythmBasisValue === 0) {
            // 基準がLCMのポリリズム
            document.getElementById('polyRhythmTimeSignature').innerHTML = `${lcmRhythm}<br>―<br>${polyRhythmBasisNote}`
        } else {
            // 基準がリズム1のポリリズムのうち分母が変わらないもの
            document.getElementById('polyRhythmTimeSignature').innerHTML = `${rhythm1}<br>―<br>${polyRhythmBasisNote}`
        };
    } else {
        //ポリリズムではない場合
        document.getElementById('infoText').innerHTML = ''
        document.getElementById('infoText').innerHTML = `<br>GCD：${gcdValue}（リズム1と2の値は互いに素ではない）<br>ポリリズムではありません。`
        //拍子を書き込む
        document.getElementById('polyRhythmTimeSignature').innerHTML = ''
        if (polyRhythmBasisValue === 1) {
            document.getElementById('polyRhythmTimeSignature').innerHTML = `${rhythm1}<br>―<br>${polyRhythmBasisNote}`
        } else {
            document.getElementById('polyRhythmTimeSignature').innerHTML = `${lcmRhythm}<br>―<br>${polyRhythmBasisNote}`
        };
    };

    // ビート状態の配列を初期化する関数
    initializeBeatStates();

    //拍のビジュアルをHTML上に描画する
    updateRhythmTable(rhythm1, 'rhythm1Beat', rhythm1BeatStates);
    updateRhythmTable(lcmRhythm, 'leastCommonMultipleBeat', lcmBeatStates);
    updateRhythmTable(rhythm2, 'rhythm2Beat', rhythm2BeatStates);
};

// --------------------------------------------------------------
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
        note = MusicalNoteArray[0].note
        rest = MusicalNoteArray[0].rest
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

        //クリックされたときに動くイベントリスナーを設定する
        td.addEventListener('click', function () {
            beatStates[i - 1] = !beatStates[i - 1];
            if (isPlaying) {
                //lordアイコンを読み込む
                this.innerHTML = `${i}<br><i class="fa-solid fa-spinner"></i>`
                //スケジュールされているタイミングの分だけ切り替えを遅らせる
                setTimeout(() => {
                    if (!beatStates[i - 1]) {
                        this.innerHTML = `${i}<br>${rest}`;
                    } else {
                        this.innerHTML = `${i}<br>${note}`;
                    }
                    //ミュートするためのクラスをトグルする
                    this.classList.toggle('muted');
                    //現在スケジュールされている時間分処理を止める
                }, ((nextBeatTime - audioContext.currentTime) * 1000));
            } else {
                if (!beatStates[i - 1]) {
                    this.innerHTML = `${i}<br>${rest}`;
                } else {
                    this.innerHTML = `${i}<br>${note}`;
                }
                //ミュートするためのクラスをトグルする
                this.classList.toggle('muted');
            };
        });
        row.appendChild(td);
    }
    //ビートのカウントをリセット
    beatCount = 1
    rhythm1BeatCount = 1
    rhythm2BeatCount = 1
};

// --------------------------------------------------------------
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
// ページが読み込まれた時に実行する関数
window.addEventListener('load', () => {
    // AudioContextを初期化
    initializeAudioContext();
    // オーディオファイルの読み込みを開始
    loadAudioFiles();
    // ビート状態の配列を初期化する関数（↓イベントリスナー効かなくなるので拍のビジュアルをHTML上に描画する関数の前に実行しないとダメ）
    initializeBeatStates();
    // 拍のビジュアルをHTML上に描画する関数
    // updateCommonRhythmTable();
});
//=============================================================================
// イベントリスナー
// 再生・停止ボタンを押したときに実行されるイベントリスナー
document.getElementById('ctsMetronomeControlButton').addEventListener('click', () => {
    ctsMetronomeOnOff();
});

// キーボードイベントのリスナーを追加
document.addEventListener('keydown', function (event) {
    // 特定のキーが押されたかチェックする
    if (event.key === "s") {
        ctsMetronomeOnOff();
    };
});

//BPMが変更された時のイベントリスナー
document.getElementById('bpm').addEventListener('input', function () {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    ctsMetronomeRestart();
    document.getElementById('bpmValue').textContent = this.value;
});
