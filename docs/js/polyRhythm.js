'use strict'

let rhythm1;
let rhythm2;
let lcmRhythm;
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
    };
    // 結果の確認
    return beatPattern;
};
//=============================================================================
//BPMの値をチェックして数値に変換する関数
function sanitizeBpmInput(bpm) {
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
    document.getElementById('basisBpmValue').innerHTML = ""
    document.getElementById('basisBpmValue').innerHTML = `${bpm}`;
    //チェックしたBPMの値を返す
    return bpm;
};
//メトロノームを停止したときの処理
function stoppingProcess() {
    // メトロノームが既に再生中の場合、AudioContextを閉じて初期化します。
    if (audioContext) {
        audioContext.close(); // AudioContextを閉じる
        audioContext = null; // AudioContextをリセット
        initializeAudioContext()
    };
    // 保存された全てのタイマーIDに対してclearTimeoutを実行
    timerIds.forEach(id => clearTimeout(id));
    // タイマーIDの配列をクリア
    timerIds = [];
    // ビジュアル表示をリセットするために各ビートのクラスをクリア
    for (let i = 1; i <= rhythm1; i++) {
        let element = document.getElementById(`rhythm1Beat${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList.remove("highlight1")
        }
    };
    for (let i = 1; i <= lcmRhythm; i++) {
        let element = document.getElementById(`leastCommonMultipleBeat${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList.remove("highlightLcm")
        }
    };
    for (let i = 1; i <= rhythm2; i++) {
        let element = document.getElementById(`rhythm2Beat${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList.remove("highlight2")
        }
    };
    // 音が実際に再生されているか判定する変数をfalseにする
    audioBuffersActive = false;
    //ビートのカウントをリセット
    beatCount = 1
    rhythm1BeatCount = 1
    rhythm2BeatCount = 1
    //ローディングのカウントダウンもリセット
    remainingTime = 0;
};
//互いに素な数を求めてサジェストする関数
function suggestCoprimes() {
    let rhythm1 = parseInt(document.getElementById('rhythm1').value);
    let rhythm2 = parseInt(document.getElementById('rhythm2').value);
    let coprimesText = "";
    let count = 0;
    for (let i = 0; i <= 20; i++) {
        if (gcd(rhythm1, i) === 1 && i > 1) {
            if (coprimesText !== "") {
                coprimesText += ", ";
            }
            coprimesText += i;
            count++
        }
    };
    document.getElementById(`suggestText`).innerHTML = ``;
    document.getElementById(`suggestText`).innerHTML = `現在のリズム1の値「${rhythm1}」に対して、ポリリズムの関係になるリズム2の値(1～20の間で)は「${coprimesText}」の${count}種類です。`;
};
// メトロノームをオンオフする関数
function metronomeOnOff() {
    //現在のBPMの値を取得する
    bpm = document.getElementById('bpmValue').value;
    //BPMの値をチェックして数値に変換する
    bpm = sanitizeBpmInput(bpm);
    rhythm1 = parseInt(document.getElementById('rhythm1').value);
    rhythm2 = parseInt(document.getElementById('rhythm2').value);
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
        };
        nextBeatTime = audioContext.currentTime;
        // BPMに基づいて最小のクリックの間隔を計算(ms)。
        if (polyRhythmBasisValue === 1) {
            beatInterval = (60 / (lcmRhythm / rhythm1 * bpm)) / (polyRhythmBasisNote / 4);
        } else if (polyRhythmBasisValue === 0) {
            beatInterval = (60 / bpm) / (polyRhythmBasisNote / 4);
        };
        // 各ビートをスケジュールする。totalBeatsの数だけ繰り返す。
        for (let i = 0; i < totalBeats; i++) {
            scheduleBeat(i % totalBeats + 1);
        };
        //ローディングのカウントダウンもリセット
        remainingTime = 0;
    } else {
        //メトロノームを停止したときの処理
        stoppingProcess();
    };
    //------------------------------------------------------------------------
    if (!isPlaying) {
        // メトロノームが始まったことを示すためにボタンのテキストを「停止」に変更
        document.getElementById('controlButton').innerHTML
            = `<i class="fa-solid fa-stop controlButtonIcon red">`;
    } else {
        // メトロノームを停止するためにボタンのテキストを「開始」に戻す
        document.getElementById('controlButton').innerHTML
            = `<i class="fa-solid fa-play controlButtonIcon blue">`;
        // 音が実際に再生されているか判定する変数をfalseにする
        audioBuffersActive = false;
    };
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
            metronomeOnOff();
        };
    }, 200);
    //現在のミュート状態をチェックし、描画する関数
    muteIconCheck(beatHeadMuted, `muteBeatHead`, `highlightBeatHead`)
    muteIconCheck(rhythm1Muted, `muteRhythm1`, `highlight1`)
    muteIconCheck(lcmMuted, 'muteLCM', `highlightLcm`)
    muteIconCheck(rhythm2Muted, `muteRhythm2`, `highlight2`)
    //------------------------------------------------------------------------
    isPlaying = !isPlaying; // メトロノームの再生状態を切り替える
};
//=============================================================================
// ビートをスケジュールする関数
function scheduleBeat(beatCount) {
    // メトロノームが停止状態かつnextBeatTimeが0以下の場合、処理を終了
    if (!isPlaying && nextBeatTime < 0) {
        return;
    };
    // 配列を生成
    let beatPattern = generateBeatPattern(lcmRhythm, rhythm1, rhythm2);
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
                element.classList.remove("highlight1")
            }
        };
        //ハイライトを付ける
        document.getElementById(`rhythm1Beat${rhythm1BeatCount}`).classList.add('highlight1');
        rhythm1BeatCount++
    };
    //------------------------------------------------------------------------
    //一度lcmのハイライトを全てリセットする
    for (let i = 1; i <= lcmRhythm; i++) {
        let element = document.getElementById(`leastCommonMultipleBeat${i}`);
        //要素がある場合のみ削除
        if (element) {
            element.classList.remove("highlightLcm")
        }
    };
    //ハイライトを付ける
    document.getElementById(`leastCommonMultipleBeat${beatCount}`).classList.add('highlightLcm');
    //------------------------------------------------------------------------
    if (beatCount % (lcmRhythm / rhythm2) === 1 || lcmRhythm === rhythm2) {
        //一度rhythm2ハイライトを全てリセットする
        for (let i = 1; i <= rhythm2; i++) {
            let element = document.getElementById(`rhythm2Beat${i}`);
            //要素がある場合のみ削除
            if (element) {
                element.classList.remove("highlight2")
            }
        };
        //ハイライトを付ける
        document.getElementById(`rhythm2Beat${rhythm2BeatCount}`).classList.add('highlight2');
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
        }
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
        }
    };
    //互いに素な数を求めてサジェストする関数
    suggestCoprimes();

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
    };
    //------------------------------------------------------------------------
    for (let i = 1; i <= beats; i++) {
        let td = document.createElement('td');
        td.id = `${idName}${i}`;
        // beatStatesがfalseの場合に特定の文字列を出力
        if (!beatStates[i - 1]) {
            td.innerHTML = `${i}<br>${rest}`;
        } else {
            td.innerHTML = `${i}<br>${note}`;
        };
        //クリックされたときに動くイベントリスナーを設定する
        td.addEventListener('click', function () {
            //beatStatesを反転させる
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
    };
    //ビートのカウントをリセット
    beatCount = 1
    rhythm1BeatCount = 1
    rhythm2BeatCount = 1
};
// --------------------------------------------------------------
// メトロノームが動作中なら一度止めた後に再度動かす関数
function metronomeRestart() {
    //メトロノームが動作中ならば
    if (isPlaying) {
        //いったん止める
        metronomeOnOff();
        //0.2秒後にメトロノームを再開する
        setTimeout(() => {
            if (!isPlaying) {
                metronomeOnOff();
            };
        }, 200);
    };
};
// --------------------------------------------------------------
//リズムのプリセットを切り替える関数
function rhythmPresetChange(num) {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();

    // ボタンのテキストを更新（リンク状態なら解除する）
    if (isSynchronized = true) {
        isSynchronized = false;
        document.getElementById(`rhythmLinkButton`).innerHTML = `◯ リズム1と2をリンクさせる`;
    };

    //デフォルト設定
    if (polyRhythmPreset[num].name === 'default') {
        document.getElementById('polyRhythm_basis_Value').value = 1;
        document.getElementById('polyRhythm_basis_note').value = 4;
    } else if (polyRhythmPreset[num].name === '8Beat'
        || polyRhythmPreset[num].name === 'offBeat'
        || polyRhythmPreset[num].name === 'hemiola') {
        document.getElementById('polyRhythm_basis_Value').value = 1;
        document.getElementById('polyRhythm_basis_note').value = 8;
    } else if (polyRhythmPreset[num].name === '16Beat1'
        || polyRhythmPreset[num].name === '16Beat2'
        || polyRhythmPreset[num].name === 'shuffle') {
        document.getElementById('polyRhythm_basis_Value').value = 1;
        document.getElementById('polyRhythm_basis_note').value = 16;
    } else {
        document.getElementById('polyRhythm_basis_Value').value = 1;
        document.getElementById('polyRhythm_basis_note').value = 4;
    }

    //リズムの値（ドロップダウンリスト）を編集する
    document.getElementById('rhythm1').value = polyRhythmPreset[num].rhythm1;
    document.getElementById('rhythm1Value').textContent = polyRhythmPreset[num].rhythm1;
    document.getElementById('rhythm2').value = polyRhythmPreset[num].rhythm2;
    document.getElementById('rhythm2Value').textContent = polyRhythmPreset[num].rhythm2;

    //音色を編集する
    document.getElementById(`rhythm1ClickSound`).value = polyRhythmPreset[num].rhythm1Sound;
    document.getElementById(`lcmClickSound`).value = polyRhythmPreset[num].lcmSound;
    document.getElementById(`rhythm2ClickSound`).value = polyRhythmPreset[num].rhythm2Sound;
    document.getElementById(`beatHeadClickSound`).value = polyRhythmPreset[num].beatHeadSound;

    //0.1秒後に実行する
    setTimeout(() => {
        //プリセットで指定されたリズム1の休符をクリックする
        for (let i = 1; i <= polyRhythmPreset[num].rhythm1Beat.length; i++) {
            if (polyRhythmPreset[num].rhythm1Beat[i - 1] === 0) {
                document.getElementById(`rhythm1Beat${i}`).click();
            }
        }
        for (let i = 1; i <= polyRhythmPreset[num].lcmBeat.length; i++) {
            if (polyRhythmPreset[num].lcmBeat[i - 1] === 0) {
                document.getElementById(`leastCommonMultipleBeat${i}`).click();
            }
        }
        for (let i = 1; i <= polyRhythmPreset[num].rhythm2Beat.length; i++) {
            if (polyRhythmPreset[num].rhythm2Beat[i - 1] === 0) {
                document.getElementById(`rhythm2Beat${i}`).click();
            }
        }
    }, 100);

    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable();
};
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
    };
};
//ロード中のアイコンを切り替える関数
function toggleMuteIcon(muteData, muteId, highlight) {
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

//=============================================================================
// イベントリスナー
// ページが読み込まれた時に実行する関数
window.addEventListener('load', () => {
    //BPMを更新したときの処理
    updateBpm(document.getElementById('bpm').value);
    // AudioContextを初期化
    initializeAudioContext();
    // オーディオファイルの読み込みを開始
    loadAudioFiles();
    // ビート状態の配列を初期化する関数（↓イベントリスナー効かなくなるので拍のビジュアルをHTML上に描画する関数の前に実行しないとダメ）
    initializeBeatStates();
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable();
});

// 再生・停止ボタンを押したときに実行される処理
document.getElementById('controlButton').addEventListener('click', () => {
    metronomeOnOff();
});

// キーボードイベントのリスナーを追加
document.addEventListener('keydown', function (event) {
    // 特定のキーが押されたかチェックする
    if (event.key === "s") {
        metronomeOnOff();
    };
});

// スライダーとテキストボックスの値を同期させる関数
function updateBpm(value) {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();
    document.getElementById('bpm').value = value;
    document.getElementById('bpmValue').value = value;
    document.getElementById('basisBpmValue').innerHTML = ""
    document.getElementById('basisBpmValue').innerHTML = `${value}`;
};

//BPMが変更された時の処理
document.getElementById('bpm').addEventListener('input', function () {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();
    updateBpm(this.value);
});

//リズム1の値が変更された時の処理
document.getElementById('rhythm1').addEventListener('input', function () {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();
    // 値を同期する関数
    synchronizeValues('rhythm1', 'rhythm2', 'rhythm2Value');
    document.getElementById('rhythm1Value').textContent = this.value;
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable();
    //互いに素な数を求める関数
    suggestCoprimes();
});

//リズム2の値が変更された時の処理
document.getElementById('rhythm2').addEventListener('input', function () {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();
    // 値を同期する関数
    synchronizeValues('rhythm2', 'rhythm1', 'rhythm1Value');
    document.getElementById('rhythm2Value').textContent = this.value;
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable();
    //互いに素な数を求める関数
    suggestCoprimes();
});

//rhythm1とrhythm2を入れ替えるボタンのイベントリスナー
document.getElementById('rhythmExchangeButton').addEventListener('click', () => {
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();

    let rhythm1Value = parseInt(document.getElementById('rhythm1').value);
    let rhythm2Value = parseInt(document.getElementById('rhythm2').value);

    document.getElementById('rhythm1Value').textContent = rhythm2Value;
    document.getElementById('rhythm2Value').textContent = rhythm1Value;
    document.getElementById('rhythm1').value = rhythm2Value;
    document.getElementById('rhythm2').value = rhythm1Value;

    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable();
});

//基準となるリズムの種類を選択するドロップダウンリストのイベントリスナー
document.getElementById('polyRhythm_basis_Value').addEventListener('change', function () {
    polyRhythmBasisValue = this.value;
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable();
});

//基準となる音符の種類を選択するドロップダウンリストのイベントリスナー
document.getElementById('polyRhythm_basis_note').addEventListener('change', function () {
    polyRhythmBasisNote = this.value;
    // メトロノームが動作中なら一度止めた後に再度動かす関数
    metronomeRestart();
    // 拍のビジュアルをHTML上に描画する関数
    updateCommonRhythmTable();
});

// ローディング案内テキストを表示する処理
let timers = {};
let remainingTime = 0;
function clickSoundLoading(loadingId) {
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
            document.getElementById(loadingId).innerHTML = `※処理中…${remainingTime}秒ほどお待ちください。`;
        };
        remainingTime = remainingTime - 1
    };
    if (audioContext) {
        updateText(); // 最初の更新
        // 1秒ごとに更新するインターバルを設定
        timers[loadingId] = { intervalId: setInterval(updateText, 1000) };
    } else {
        document.getElementById(loadingId).innerHTML = `※処理中…`;
        // タイムアウトを設定
        timers[loadingId] = {
            timeoutId: setTimeout(() => {
                document.getElementById(loadingId).innerHTML = "";
            }, ((nextBeatTime - audioContext.currentTime) * 1000))
        };
    };
};
//音色の種類を選択するドロップダウンリストのイベントリスナー
document.getElementById('beatHeadClickSound').addEventListener('change', function () {
    clickSoundLoading(`beatHeadClickSoundLoading`);
});
document.getElementById('rhythm1ClickSound').addEventListener('change', function () {
    clickSoundLoading(`rhythm1ClickSoundLoading`);
});
document.getElementById('lcmClickSound').addEventListener('change', function () {
    clickSoundLoading(`lcmClickSoundLoading`);
});
document.getElementById('rhythm2ClickSound').addEventListener('change', function () {
    clickSoundLoading(`rhythm2ClickSoundLoading`);
});
//ミュートボタンのイベントリスナー
document.getElementById('muteBeatHead').addEventListener('click', () => {
    beatHeadMuted = !beatHeadMuted;
    toggleMuteIcon(beatHeadMuted, `muteBeatHead`, `highlightBeatHead`)
    clickSoundLoading(`beatHeadClickSoundLoading`);
});
document.getElementById('muteRhythm1').addEventListener('click', () => {
    rhythm1Muted = !rhythm1Muted;
    document.getElementById(`rhythm1BeatTable`).classList.toggle('muted');
    toggleMuteIcon(rhythm1Muted, `muteRhythm1`, `highlight1`)
    clickSoundLoading(`rhythm1ClickSoundLoading`);
});
document.getElementById('muteLCM').addEventListener('click', () => {
    lcmMuted = !lcmMuted;
    document.getElementById(`leastCommonMultiple1BeatTable`).classList.toggle('muted');
    toggleMuteIcon(lcmMuted, 'muteLCM', `highlightLcm`)
    clickSoundLoading(`lcmClickSoundLoading`);
});
document.getElementById('muteRhythm2').addEventListener('click', () => {
    rhythm2Muted = !rhythm2Muted;
    document.getElementById(`rhythm2BeatTable`).classList.toggle('muted');
    toggleMuteIcon(rhythm2Muted, `muteRhythm2`, `highlight2`)
    clickSoundLoading(`rhythm2ClickSoundLoading`);
});
//プリセットのイベントリスナー
document.getElementById('rhythmPreset').addEventListener('change', function () {
    let num = parseInt(this.value);
    rhythmPresetChange(num);
});

let isSynchronized = false; // 同期の状態を保持するグローバル変数
// 同期するべきかどうかを判断する関数
function shouldSynchronize() {
    return isSynchronized;
};
// 値を同期する関数
function synchronizeValues(source, target, targetValueElement) {
    if (shouldSynchronize()) {
        const value = document.getElementById(source).value;
        document.getElementById(target).value = value;
        document.getElementById(targetValueElement).textContent = value;
    };
};
// ボタンのクリックイベントリスナー
document.getElementById('rhythmLinkButton').addEventListener('click', function () {
    isSynchronized = !isSynchronized; // 同期の状態を切り替える
    // ボタンのテキストを更新
    if (isSynchronized) {
        this.innerHTML = "⊘ リズム1と2のリンクを解除";
        // メトロノームが動作中なら一度止めた後に再度動かす関数
        metronomeRestart();
        // 値を同期する関数
        synchronizeValues('rhythm1', 'rhythm2', 'rhythm2Value');
        // 拍のビジュアルをHTML上に描画する関数
        updateCommonRhythmTable();
    } else {
        this.innerHTML = `◯ リズム1と2をリンクさせる`;
    };
});

