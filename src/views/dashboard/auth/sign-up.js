import React, { useState } from 'react';
import { Row, Col, Image, Form, Button, ListGroup } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import Card from '../../../components/Card'
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../../firebase/firebase_settings'; 
// img
import facebook from '../../../assets/images/brands/fb.svg'
import google from '../../../assets/images/brands/gm.svg'
import instagram from '../../../assets/images/brands/im.svg'
import linkedin from '../../../assets/images/brands/li.svg'
import auth5 from '../../../assets/images/auth/05.png'
import Logo from '../../../assets/images/pages/logo3.png'

// Inicializa Firebase
initializeApp(firebaseConfig);

const db = getFirestore();

const SignUp = () => {
   let history = useNavigate();
   const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role : ''
   });
   const [error, setError] = useState('');

   // Manejar el cambio de los inputs
   const handleChange = (e) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
   };

   // Función para registrar el usuario
   const handleSignUp = async () => {
      const { firstName, lastName, email, phone, password, confirmPassword } = formData;

      if (password !== confirmPassword) {
         setError('Las contraseñas no coinciden');
         return;
      }

 
   };

   return (
      <section className="login-content">
         <Row className="m-0 align-items-center bg-white vh-100">
            <div className="col-md-6 d-md-block d-none bg-primary p-0 mt-n1 vh-100 overflow-hidden">
               <Image src={auth5} className="Image-fluid gradient-main animated-scaleX" alt="images" />
            </div>
            <Col md="6">
               <Row className="justify-content-center">
                  <Col md="15">
                     <Card className="card-transparent auth-card shadow-none d-flex justify-content-center mb-0">
                        <Card.Body>
                           <Link to="/dashboard" className="navbar-brand d-flex align-items-center mb-3">
                              <img src={Logo} alt="logo" className="img-fluid" style={{ height: "4vh" }} />
                              <h4 className="logo-title ms-3">Stroit Corp</h4>
                           </Link>
                           <h2 className="mb-2 text-center">Registrate</h2>
                           <p className="text-center">Cree su cuenta en Stroit Corp</p>
                           {error && <p className="text-danger text-center">{error}</p>}
                           <Form>
                              <Row>
                                 <Col lg="6">
                                    <Form.Group className="form-group">
                                       <h3 htmlFor="firstName">Nombres</h3>
                                       <Form.Control type="text" id="firstName" placeholder=" " onChange={handleChange} />
                                    </Form.Group>
                                 </Col>
                                 <Col lg="6">
                                    <Form.Group className="form-group">
                                       <h3 htmlFor="lastName">Apellidos</h3>
                                       <Form.Control type="text" id="lastName" placeholder=" " onChange={handleChange} />
                                    </Form.Group>
                                 </Col>
                                 <Col lg="6">
                                    <Form.Group className="form-group">
                                       <h3 htmlFor="email">Correo Electrónico</h3>
                                       <Form.Control type="email" id="email" placeholder=" " onChange={handleChange} />
                                    </Form.Group>
                                 </Col>
                                 <Col lg="6">
                                    <Form.Group className="form-group">
                                       <h3 htmlFor="phone">No. Celular</h3>
                                       <Form.Control type="text" id="phone" placeholder=" " onChange={handleChange} />
                                    </Form.Group>
                                 </Col>
                                 <Col lg="6">
                                    <Form.Group className="form-group">
                                       <h3 htmlFor="password">Contraseña</h3>
                                       <Form.Control type="password" id="password" placeholder=" " onChange={handleChange} />
                                    </Form.Group>
                                 </Col>
                                 <Col lg="6">
                                    <Form.Group className="form-group">
                                       <h3 htmlFor="confirmPassword">Repita la contraseña</h3>
                                       <Form.Control type="password" id="confirmPassword" placeholder=" " onChange={handleChange} />
                                    </Form.Group>
                                 </Col>
                              </Row>
                              <div className="d-flex justify-content-center">
                                 <Button onClick={handleSignUp} type="button" variant="primary">Registrarse</Button>
                              </div>
                              <p className="text-center my-3">O registrate con otras cuentas?</p>
                                 <div className="d-flex justify-content-center">
                                    <ListGroup as="ul" className="list-group-horizontal list-group-flush">
                                       <ListGroup.Item as="li" className="list-group-item border-0 pb-0">
                                          <Link to="#"><Image src={facebook} alt="fb" /></Link>
                                       </ListGroup.Item>
                                       <ListGroup.Item as="li" className="list-group-item border-0 pb-0">
                                          <Link to="#"><Image src={google} alt="gm" /></Link>
                                       </ListGroup.Item>
                                       <ListGroup.Item as="li" className="list-group-item border-0 pb-0">
                                          <Link to="#"><Image src={instagram} alt="im" /></Link>
                                       </ListGroup.Item>
                                       <ListGroup.Item as="li" className="list-group-item border-0 pb-0">
                                          <Link to="#"><Image src={linkedin} alt="li" /></Link>
                                       </ListGroup.Item>
                                    </ListGroup>
                                 </div>
                                 <p className="mt-3 text-center">
                                 Ya tienes una cuenta? <Link to="/auth/sign-in" className="text-underline">Inicie Sesión</Link>
                                 </p>
                           </Form>
                        </Card.Body>
                     </Card>
                  </Col>
               </Row>
            </Col>
         </Row>
      </section>
   );
};

export default SignUp;