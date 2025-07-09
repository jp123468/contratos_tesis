import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button } from 'react-bootstrap';

const CameraCapture = ({ show, onCapture, onClose }) => {
    const [photoUrl, setPhotoUrl] = useState('');
    const [error, setError] = useState('');
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [facingMode, setFacingMode] = useState('user'); // 'user' for front camera, 'environment' for rear camera
    const videoRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        if (show) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [show, facingMode]);

    const startCamera = async () => {
        try {
            const constraints = {
                video: { facingMode: facingMode }
            };
            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = mediaStream;
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                };
            }
        } catch (error) {
            console.error('Error accessing the camera: ', error);
            setError('No se pudo acceder a la cámara. Asegúrate de que está habilitada.');
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const captureImage = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas');
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const imageUrl = canvas.toDataURL('image/png');
                setPhotoUrl(imageUrl);
            } else {
                setError('Error al crear el contexto del canvas.');
            }
        } else {
            setError('No se ha capturado ninguna foto. Inténtalo de nuevo.');
        }
    };

    const handleCapture = () => {
        if (photoUrl) {
            onCapture(photoUrl);
            setConfirmationMessage('Foto cargada y guardada correctamente.');
            setTimeout(() => {
                setConfirmationMessage('');
                onClose();
            }, 8000);
        } else {
            setError('No se ha capturado ninguna foto. Inténtalo de nuevo.');
        }
    };

    const toggleCamera = () => {
        setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
    };

    return (
        <Modal show={show} onHide={onClose} centered style={{ zIndex: 12000 }} >
            <Modal.Header closeButton>
                <Modal.Title className="text-center w-100" id="modal-contract-title">
                    Captura de Foto</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className="d-flex justify-content-center">
                    <video ref={videoRef} width="100%" height="auto" />
                </div>
                <div className="mt-2 d-flex justify-content-between">
                    <Button variant="primary" onClick={captureImage}>
                        Capturar Foto
                    </Button>
                    <Button variant="secondary" onClick={toggleCamera}>
                        Cambiar Cámara
                    </Button>
                </div>
                {photoUrl && (
                    <div className="mt-2">
                        <img src={photoUrl} alt="Captured" style={{ width: '100%' }} />
                    </div>
                )}
                {error && <div className="text-danger mt-2">{error}</div>}
                {confirmationMessage && <div className="text-success mt-2">{confirmationMessage}</div>}
            </Modal.Body>
            <Modal.Footer style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                <Button type="submit" variant="success" onClick={handleCapture} style={{ minWidth: '150px' }}>
                    Guardar Foto
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default CameraCapture;