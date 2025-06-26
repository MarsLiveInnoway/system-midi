import { useState, useRef, useEffect } from 'react';
import * as Tone from 'tone';

// Tailwind CSS classes for styling (to avoid needing a separate CSS file)
const styles = {
    container: "min-h-screen bg-gray-100 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8",
    main: "max-w-xl w-full space-y-8 p-10 bg-white shadow-lg rounded-xl",
    title: "text-center text-3xl font-extrabold text-gray-900",
    uploadBox: "mb-6",
    label: "block text-sm font-medium text-gray-700 mb-2",
    input: "block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer",
    button: "group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white",
    buttonEnabled: "bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500",
    buttonDisabled: "bg-gray-400 cursor-not-allowed",
    results: "mt-8 border-t pt-6",
    resultsTitle: "text-lg font-medium text-gray-900 mb-4",
    buttonGroup: "flex space-x-4",
    playButton: "flex-1 py-2 px-4 bg-green-600 text-white rounded-md hover:bg-green-700",
    downloadLink: "flex-1 py-2 px-4 bg-gray-800 text-white text-center rounded-md hover:bg-gray-900",
    errorBox: "mt-4 p-4 bg-red-100 text-red-700 rounded-md",
};


export default function Home() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalFile, setOriginalFile] = useState(null);
    const [processedFile, setProcessedFile] = useState(null);
    const [error, setError] = useState(null);
    
    // 用 useRef 来持久化 Tone.js 的实例，避免重复创建
    const synthRef = useRef(null);
    const midiRef = useRef(null);

    // 在组件加载时初始化合成器
    useEffect(() => {
        if (!synthRef.current) {
            synthRef.current = new Tone.PolySynth(Tone.Synth).toDestination();
        }
    }, []);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setOriginalFile(file);
            setProcessedFile(null);
            setError(null);
        }
    };

    const handleUpload = async () => {
        if (!originalFile) return;

        setIsProcessing(true);
        setError(null);

        try {
            const formData = new FormData();
            formData.append('file', originalFile);

            // [修正] 使用相对路径调用API
            const response = await fetch('/process-midi', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Server error: ${response.status}`);
            }

            const midiBlob = await response.blob();
            setProcessedFile(midiBlob);

        } catch (err) {
            console.error("Processing failed:", err);
            setError(err.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const playMidi = async () => {
        if (!processedFile || !synthRef.current) return;
        
        try {
            // [修正] 使用 Tone.Midi 来播放
            if (Tone.Transport.state === 'started') {
                Tone.Transport.stop();
                Tone.Transport.cancel();
            }

            const objectURL = URL.createObjectURL(processedFile);
            
            // 加载MIDI文件
            const midi = await Tone.Midi.fromUrl(objectURL);
            midiRef.current = midi; // 保存引用以便停止

            // 将MIDI文件的每个音符事件连接到合成器
            midi.tracks.forEach(track => {
                Tone.Transport.schedule(time => {
                    track.notes.forEach(note => {
                        synthRef.current.triggerAttackRelease(note.name, note.duration, note.time + time, note.velocity);
                    });
                }, "0");
            });

            // 启动播放
            await Tone.start();
            Tone.Transport.start();

        } catch (err) {
            console.error("Playback error:", err);
            setError("Failed to parse or play MIDI file.");
        }
    };
    
    // 用于添加<script>标签，因为Next.js静态导出不直接支持
    const TailwindScript = () => (
      <script src="https://cdn.tailwindcss.com"></script>
    );

    return (
        <>
        <TailwindScript />
        <div className={styles.container}>
            <div className={styles.main}>
                <div>
                    <h1 className={styles.title}>
                        MIDI-A Lightweight Processor
                    </h1>
                </div>
                
                <div className={styles.uploadBox}>
                    <label htmlFor="midi-upload" className={styles.label}>
                        1. Upload a MIDI File (.mid)
                    </label>
                    <input
                        id="midi-upload"
                        type="file"
                        accept=".mid,.midi"
                        onChange={handleFileChange}
                        className={styles.input}
                        disabled={isProcessing}
                    />
                    {originalFile && (
                        <p className="mt-2 text-sm text-gray-600">
                            Selected: {originalFile.name}
                        </p>
                    )}
                </div>
                
                <button
                    onClick={handleUpload}
                    disabled={!originalFile || isProcessing}
                    className={`${styles.button} ${!originalFile || isProcessing ? styles.buttonDisabled : styles.buttonEnabled}`}
                >
                    {isProcessing ? 'Processing...' : '2. Process MIDI'}
                </button>
                
                {processedFile && (
                    <div className={styles.results}>
                        <h2 className={styles.resultsTitle}>3. Play or Download</h2>
                        <div className={styles.buttonGroup}>
                            <button
                                onClick={playMidi}
                                className={styles.playButton}
                            >
                                Play Processed MIDI
                            </button>
                            <a
                                href={URL.createObjectURL(processedFile)}
                                download={`processed_${originalFile.name}`}
                                className={styles.downloadLink}
                            >
                                Download
                            </a>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className={styles.errorBox}>
                        <p><strong>Error:</strong> {error}</p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}