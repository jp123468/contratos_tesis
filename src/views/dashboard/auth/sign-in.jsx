import React, { useState } from 'react';
import { Row, Col, Image, Form, Button, ListGroup, ToastContainer, Toast } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../../firebase/firebase_settings';
import Card from '../../../components/Card';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

// img
import auth1 from '../../../assets/images/auth/01.png';
import Logo from '../../../assets/images/pages/logo3.png';

initializeApp(firebaseConfig);
const db = getFirestore();

const SignIn = () => {

    // Toast States
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success'); // 'success' or 'danger'

    let history = useNavigate();
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSignIn = async () => {
        const { email, password } = formData;

        try {
            // Realizar consulta a Firestore para verificar si el usuario existe con el correo y contraseña
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email), where('password', '==', password));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const userDoc = querySnapshot.docs[0];
                const userData = userDoc.data();
                const userRole = userData.role;

                // Guardar el ID del usuario en el localStorage
                localStorage.setItem('userId', userDoc.id);

                // Redirigir según el rol del usuario
                if (userRole === 'admin') {
                    history('/dashboard');
                } else if (userRole === 'vendedor') {
                    history('/dashboard');
                } else {
                    setError('Rol no reconocido');
                    setToastMessage('Rol no reconocido');
                    setToastVariant('danger');
                    setShowToast(true);
                }

                setToastMessage('Exito: Inicio de sesión exitoso');
                setToastVariant('success');
                setShowToast(true);

            } else {
                setError('Correo o contraseña incorrectos');
                setToastMessage('Correo o contraseña incorrectos');
                setToastVariant('danger');
                setShowToast(true);
            }

        } catch (error) {
            setError('Error al iniciar sesión: ' + error.message);
            setToastMessage('Error al iniciar sesión');
            setToastVariant('danger');
            setShowToast(true);
        }
    };
    const [showPassword, setShowPassword] = useState(false);

    const togglePassword = () => {
        setShowPassword(prev => !prev);
    };

    return (
        <>
            <ToastContainer position="top-end" className="p-3">
                <Toast
                    bg={toastVariant === 'success' ? 'success' : 'danger'}
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                >
                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

            <section className="login-content">
                <Row className="m-0 align-items-center bg-white vh-100">
                    <Col md="6">
                        <Row className="justify-content-center">
                            <Col md="10">
                                <Card className="card-transparent shadow-none d-flex justify-content-center mb-0 auth-card">
                                    <Card.Body>
                                        <Link to="/" className="navbar-brand d-flex align-items-center mb-3">
                                            <img src={Logo} alt="logo" className="img-fluid " style={{ height: "4vh" }} />
                                            <h4 className="logo-title ms-3">Stroit Corp</h4>
                                        </Link>
                                        <Form>
                                            <Row>
                                                <Col lg="12">
                                                    <Form.Group className="form-group">
                                                        <label htmlFor="email">Correo electrónico</label>
                                                        <Form.Control type="email" id="email" placeholder="Correo electrónico" onChange={handleChange} />
                                                    </Form.Group>
                                                </Col>
                                                <Col lg="12">
                                                    <Form.Group className="form-group" style={{ position: 'relative' }}>
                                                        <label htmlFor="password">Contraseña</label>
                                                        <Form.Control
                                                            type={showPassword ? 'text' : 'password'}
                                                            id="password"
                                                            placeholder="Contraseña"
                                                            onChange={handleChange}
                                                        />
                                                        <span
                                                            onClick={togglePassword}
                                                            style={{
                                                                position: 'absolute',
                                                                right: '10px',
                                                                top: '38px',
                                                                cursor: 'pointer',
                                                                zIndex: 2,
                                                                color: '#6c757d'
                                                            }}
                                                        >
                                                            {showPassword ? <FaEyeSlash /> : <FaEye />}
                                                        </span>
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <div className="d-flex justify-content-center mt-5">
                                                <Button onClick={handleSignIn} type="button" variant="primary">Iniciar sesión</Button>
                                            </div>
                                        </Form>
                                    </Card.Body>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                    <Col md="6" className="d-md-block d-none bg-primary p-0 mt-n1 vh-100 overflow-hidden">
                        <Image src={auth1} className="Image-fluid gradient-main animated-scaleX" alt="images" />
                    </Col>
                </Row>
            </section>
        </>
    );
};

export default SignIn;
