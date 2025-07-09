import React from 'react'
import { Row, Col, Image } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import mail from '../../../assets/images/auth/03.png'
import Card from '../../../components/Card'
import Logo from '../../../assets/images/pages/logo3.png';
const ConfirmMail = () => {
   return (
      <>
         <section className="login-content">
            <Row className="m-0 align-items-center bg-white vh-100">
               <Col md="6" className="p-0">
                  <Card className="card-transparent auth-card shadow-none d-flex justify-content-center mb-3">
                     <Card.Body>
                        <Link to="/dashboard" className="navbar-brand d-flex align-items-center mb-3">
                           <img src={Logo} alt="logo" className="img-fluid " style={{ height: "4vh" }} />

                           <h4 className="logo-title ms-3">Stroit Corp</h4>
                        </Link>
                        <h2 className="mt-3 mb-0">Success !</h2>
                        <p className="cnf-mail mb-1">A email has been send to youremail@domain.com. Please check for an
                           email from company and click
                           on the included link to reset your password.</p>
                        <div className="d-inline-block w-100">
                           <Link to="/dashboard" className="btn btn-primary mt-3">Back to Home</Link>
                        </div>
                     </Card.Body>
                  </Card>
               </Col>
               <Col md="6" className="d-md-block d-none bg-primary p-0 mt-n1 vh-100 overflow-hidden">
                  <Image src={mail} className="img-fluid gradient-main animated-scaleX" alt="images" />
               </Col>
            </Row>
         </section>
      </>
   )
}

export default ConfirmMail;
