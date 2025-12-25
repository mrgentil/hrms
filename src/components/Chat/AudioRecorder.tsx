"use client";

import React, { useState, useRef } from 'react';

interface AudioRecorderProps {
    onRecordingComplete: (audioBlob: Blob) => void;
    onCancel: () => void;
}

export default function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                onRecordingComplete(blob);
                stopTimer();
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            startTimer();
        } catch (err) {
            console.error('Error accessing microphone:', err);
            onCancel();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        setRecordingTime(0);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Start recording automatically on mount
    React.useEffect(() => {
        startRecording();
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                mediaRecorderRef.current.stop();
            }
            stopTimer();
        };
    }, []);

    return (
        <div className="flex items-center space-x-2 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-full animate-pulse">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-red-600 dark:text-red-400 font-mono text-sm">{formatTime(recordingTime)}</span>

            <button
                onClick={stopRecording}
                className="ml-2 p-1 text-red-600 hover:text-red-700 dark:text-red-400 rounded-full border border-red-200 dark:border-red-800"
                title="Arrêter et envoyer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
            </button>

            <button
                onClick={() => {
                    if (mediaRecorderRef.current) {
                        mediaRecorderRef.current.stop(); // Stop technically but ignore result handled in parent via cancel logic if needed? 
                        // Better to just cancel:
                        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
                    }
                    onCancel();
                }}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400"
                title="Annuler"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
}
