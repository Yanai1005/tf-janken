document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing application...');

    // DOM要素の取得
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const resultDiv = document.getElementById('gesture-result');
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const playBtn = document.getElementById('play-btn');
    const computerGestureDiv = document.getElementById('computer-gesture');
    const gameResultDiv = document.getElementById('game-result');
    const playerScoreSpan = document.getElementById('player-score');
    const computerScoreSpan = document.getElementById('computer-score');
    const countdownContainer = document.getElementById('countdown-container');
    const countdownElement = document.getElementById('countdown');

    console.log('DOM elements retrieved');

    // MediaPipe Hands
    let hands;
    let camera;
    let isRunning = false;

    // ジェスチャー認識の結果とカウンター
    let lastGesture = '';
    let gestureCounter = 0;
    const gestureThreshold = 5; // 同じジェスチャーが連続して検出される必要がある回数（より応答性を高めるために減らす）

    // ゲーム関連の変数
    let playerScore = 0;
    let computerScore = 0;
    let currentPlayerGesture = '';
    let isValidGesture = false;

    // 開始ボタンのイベントリスナー
    startBtn.addEventListener('click', startHandTracking);

    // 停止ボタンのイベントリスナー
    stopBtn.addEventListener('click', stopHandTracking);

    // じゃんけんボタンのイベントリスナー
    playBtn.addEventListener('click', playRound);

    // 手のトラッキングを開始する関数
    async function startHandTracking() {
        console.log('Starting hand tracking...');
        if (isRunning) return;

        try {
            console.log('Initializing MediaPipe Hands...');
            // MediaPipe Handsの初期化
            hands = new Hands({
                locateFile: (file) => {
                    console.log(`Loading MediaPipe file: ${file}`);
                    return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
                }
            });

            // 設定
            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 1,
                minDetectionConfidence: 0.5,
                minTrackingConfidence: 0.5
            });

            // 結果のコールバック
            hands.onResults(onResults);

            // カメラの設定（ネイティブgetUserMedia APIを使用）
            console.log('Setting up camera with native getUserMedia API...');

            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('ブラウザがgetUserMediaをサポートしていません');
            }

            // カメラストリームを取得
            const constraints = {
                video: {
                    width: 640,
                    height: 480
                }
            };

            console.log('Requesting camera access...');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera access granted');

            // ビデオ要素にストリームを設定
            video.srcObject = stream;
            video.onloadedmetadata = () => {
                video.play();
            };

            // カメラストリームを保存
            camera = stream;

            // フレーム処理ループを開始
            console.log('Starting frame processing loop...');
            const processFrame = async () => {
                if (isRunning) {
                    await hands.send({ image: video });
                    requestAnimationFrame(processFrame);
                }
            };

            video.addEventListener('play', () => {
                requestAnimationFrame(processFrame);
            });

            isRunning = true;
            console.log('Camera started successfully');

            // ボタンの状態更新
            startBtn.disabled = true;
            stopBtn.disabled = false;

            resultDiv.textContent = '手を検出中...';
            computerGestureDiv.textContent = '待機中...';
            gameResultDiv.textContent = 'ゲーム開始前';
        } catch (error) {
            console.error('エラーが発生しました:', error);
            console.error('エラーのスタックトレース:', error.stack);
            resultDiv.textContent = `エラー: ${error.message}`;
            alert('カメラへのアクセスに失敗しました。ブラウザのコンソールで詳細を確認してください。');
        }
    }

    // 手のトラッキングを停止する関数
    function stopHandTracking() {
        if (!isRunning) return;

        // カメラ停止
        if (camera) {
            // ストリームのすべてのトラックを停止
            camera.getTracks().forEach(track => track.stop());
        }

        // MediaPipe Hands停止
        if (hands) {
            hands.close();
        }

        isRunning = false;

        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ボタンの状態更新
        startBtn.disabled = false;
        stopBtn.disabled = true;

        resultDiv.textContent = '停止しました';
        playBtn.disabled = true;
        isValidGesture = false;
    }

    // MediaPipe Handsの結果を処理する関数
    function onResults(results) {
        // キャンバスのサイズをビデオに合わせる
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // キャンバスをクリア
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 検出された手がある場合
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // 各手のランドマークを描画（カスタム描画関数を使用）
            for (const landmarks of results.multiHandLandmarks) {
                drawConnectors(ctx, landmarks, HAND_CONNECTIONS, { color: '#00FF00', lineWidth: 5 });
                drawLandmarks(ctx, landmarks, { color: '#FF0000', lineWidth: 2 });

                // ジェスチャーを認識
                const gesture = recognizeGesture(landmarks);

                // 同じジェスチャーが連続して検出された場合のみ結果を更新
                if (gesture === lastGesture) {
                    gestureCounter++;
                    if (gestureCounter >= gestureThreshold) {
                        updateGestureResult(gesture);
                    }
                } else {
                    lastGesture = gesture;
                    gestureCounter = 1;
                }
            }
        } else {
            // 手が検出されない場合はカウンターとジェスチャーをリセット
            lastGesture = '';
            gestureCounter = 0;
            resultDiv.textContent = '手を検出中...';
        }
    }

    // ジェスチャーを認識する関数
    function recognizeGesture(landmarks) {
        // 親指の先端と付け根
        const thumbTip = landmarks[4];
        const thumbBase = landmarks[2];

        // 人差し指の先端と付け根
        const indexTip = landmarks[8];
        const indexBase = landmarks[5];

        // 中指の先端と付け根
        const middleTip = landmarks[12];
        const middleBase = landmarks[9];

        // 薬指の先端と付け根
        const ringTip = landmarks[16];
        const ringBase = landmarks[13];

        // 小指の先端と付け根
        const pinkyTip = landmarks[20];
        const pinkyBase = landmarks[17];

        // 手のひらの中心
        const palmBase = landmarks[0];

        // 指先の高さを比較（y座標が小さいほど上にある）
        const fingersUp = [
            thumbTip.y < thumbBase.y, // 親指
            indexTip.y < indexBase.y, // 人差し指
            middleTip.y < middleBase.y, // 中指
            ringTip.y < ringBase.y,   // 薬指
            pinkyTip.y < pinkyBase.y    // 小指
        ];

        // 指が上がっている数をカウント
        const upFingerCount = fingersUp.filter(Boolean).length;

        // パー（すべての指を広げる）- 4本以上の指が上がっている
        if (upFingerCount >= 4) {
            return 'パー';
        }

        // チョキ（人差し指と中指を立てる）- 人差し指と中指が上がっている
        if (fingersUp[1] && fingersUp[2] && !fingersUp[3] && !fingersUp[4]) {
            return 'チョキ';
        }

        // グー（拳を作る）- すべての指が下がっているか、1本以下の指しか上がっていない
        if (upFingerCount <= 1) {
            return 'グー';
        }

        // 認識できないジェスチャー
        return '認識中...';
    }

    // 2点間の距離を計算する関数
    function calculateDistance(point1, point2) {
        return Math.sqrt(
            Math.pow(point1.x - point2.x, 2) +
            Math.pow(point1.y - point2.y, 2) +
            Math.pow(point1.z - point2.z, 2)
        );
    }

    // ジェスチャー結果を更新する関数
    function updateGestureResult(gesture) {
        if (gesture === '認識中...') {
            resultDiv.textContent = gesture;
            playBtn.disabled = true;
            isValidGesture = false;
            return;
        }

        resultDiv.textContent = gesture;
        currentPlayerGesture = gesture;
        isValidGesture = true;
        playBtn.disabled = false;
    }

    // コンピュータのジェスチャーをランダムに選択する関数
    function getComputerGesture() {
        const gestures = ['グー', 'チョキ', 'パー'];
        const randomIndex = Math.floor(Math.random() * gestures.length);
        return gestures[randomIndex];
    }

    // じゃんけんの勝敗を判定する関数
    function determineWinner(playerGesture, computerGesture) {
        if (playerGesture === computerGesture) {
            return 'あいこ';
        }

        if (
            (playerGesture === 'グー' && computerGesture === 'チョキ') ||
            (playerGesture === 'チョキ' && computerGesture === 'パー') ||
            (playerGesture === 'パー' && computerGesture === 'グー')
        ) {
            return 'あなたの勝ち！';
        }

        return 'コンピュータの勝ち！';
    }

    // じゃんけんのラウンドを実行する関数
    function playRound() {
        if (!isValidGesture) {
            alert('有効なジェスチャーが検出されていません。もう一度試してください。');
            return;
        }

        // プレイボタンを無効化
        playBtn.disabled = true;

        // カウントダウンを開始
        startCountdown(3, () => {
            // カウントダウン終了後の処理

            // コンピュータのジェスチャーを選択
            const computerGesture = getComputerGesture();
            computerGestureDiv.textContent = computerGesture;

            // 勝敗を判定
            const result = determineWinner(currentPlayerGesture, computerGesture);
            gameResultDiv.textContent = result;

            // スコアを更新
            if (result === 'あなたの勝ち！') {
                playerScore++;
                playerScoreSpan.textContent = playerScore;
            } else if (result === 'コンピュータの勝ち！') {
                computerScore++;
                computerScoreSpan.textContent = computerScore;
            }

            // プレイボタンを再度有効化
            playBtn.disabled = false;
        });
    }

    // カウントダウンを実行する関数
    function startCountdown(seconds, callback) {
        // カウントダウン表示を初期化
        countdownElement.textContent = seconds;
        countdownContainer.classList.add('active');

        // カウントダウンを開始
        let remainingSeconds = seconds;

        const countdownInterval = setInterval(() => {
            remainingSeconds--;

            if (remainingSeconds <= 0) {
                // カウントダウン終了
                clearInterval(countdownInterval);
                countdownContainer.classList.remove('active');
                callback();
            } else {
                // カウントダウン表示を更新
                countdownElement.textContent = remainingSeconds;
            }
        }, 1000);
    }
});

// MediaPipe Drawingユーティリティ関数
function drawConnectors(ctx, landmarks, connections, options) {
    const color = options.color || 'white';
    const lineWidth = options.lineWidth || 1;

    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;

    for (const connection of connections) {
        const [start, end] = connection;

        if (landmarks[start] && landmarks[end]) {
            ctx.beginPath();
            ctx.moveTo(landmarks[start].x * ctx.canvas.width, landmarks[start].y * ctx.canvas.height);
            ctx.lineTo(landmarks[end].x * ctx.canvas.width, landmarks[end].y * ctx.canvas.height);
            ctx.stroke();
        }
    }
}

function drawLandmarks(ctx, landmarks, options) {
    const color = options.color || 'red';
    const lineWidth = options.lineWidth || 1;

    ctx.fillStyle = color;

    for (const landmark of landmarks) {
        ctx.beginPath();
        ctx.arc(
            landmark.x * ctx.canvas.width,
            landmark.y * ctx.canvas.height,
            lineWidth * 2,
            0,
            2 * Math.PI
        );
        ctx.fill();
    }
}

// MediaPipe Handsの接続定義
const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],           // 親指
    [0, 5], [5, 6], [6, 7], [7, 8],           // 人差し指
    [5, 9], [9, 10], [10, 11], [11, 12],      // 中指
    [9, 13], [13, 14], [14, 15], [15, 16],    // 薬指
    [13, 17], [17, 18], [18, 19], [19, 20],   // 小指
    [0, 17], [5, 9], [9, 13], [13, 17]        // 手のひら
];
