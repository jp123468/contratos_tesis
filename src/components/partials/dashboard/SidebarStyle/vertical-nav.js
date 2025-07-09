import React, { useState, useContext, memo, Fragment, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Accordion, useAccordionButton, AccordionContext } from 'react-bootstrap';

import { doc, getDoc, getFirestore } from "firebase/firestore";

import { firebaseConfig } from '../../../../firebase/firebase_settings';
import { initializeApp } from 'firebase/app';

initializeApp(firebaseConfig);

const db = getFirestore();

function CustomToggle({ children, eventKey, onClick }) {
  const { activeEventKey } = useContext(AccordionContext);
  const decoratedOnClick = useAccordionButton(eventKey, (active) => onClick({ state: !active, eventKey: eventKey }));
  const isCurrentEventKey = activeEventKey === eventKey;

  return (
    <Link to="#" aria-expanded={isCurrentEventKey ? 'true' : 'false'} className="nav-link" role="button" onClick={(e) => {
      decoratedOnClick(isCurrentEventKey);
    }}>
      {children}
    </Link>
  );
}

const VerticalNav = memo((props) => {
  const [activeMenu, setActiveMenu] = useState(false);
  const [active, setActive] = useState('');
  const [userRole, setUserRole] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const userId = localStorage.getItem('userId'); // Obtener el ID del usuario almacenado

  useEffect(() => {
    const fetchUserRole = async () => {
      if (userId) {
        const userRef = doc(db, "users", userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserRole(userData.role);  // Guardar el rol del usuario
        } else {
          console.log("No se encontró el documento del usuario.");
          navigate("/");
        }
      } else {
        console.log("No se encontró el ID del usuario en sessionStorage.");
        navigate("/");
      }
    };

    fetchUserRole();
  }, [navigate]);



  if (userRole === null) {
    return <div>Cargando...</div>;
  }

  return (
    <Fragment>
      <Accordion as="ul" className="navbar-nav iq-main-menu">
        <li><hr className="hr-horizontal" /></li>
        <li className="nav-item static-item">
  <Link className="nav-link static-item disabled" to="#" tabIndex="-1">
    <span className="default-icon text-capitalize">Menú</span>
    <span className="mini-icon">-</span>
  </Link>
</li>


        {userRole === 'admin' ? (
          <>
            <li className="nav-item">
              <Link className={`${location.pathname === '/dashboard/app/user-list' ? 'active' : ''} nav-link`} to="/dashboard/app/user-list">
                <i className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M12 4a4 4 0 0 1 4 4 4 4 0 0 1-4 4 4 4 0 0 1-4-4 4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4.02V20h-16v-1.98C4 15.79 7.58 14 12 14z" />
                  </svg>
                </i>
                <i className="sidenav-mini-icon"> V </i>
                <span className="item-name">Usuarios</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`${location.pathname === '/dashboard/admin/admin' ? 'active' : ''} nav-link`} to="/dashboard/admin/admin">
                <i className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19 3H6c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h13c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H6V5h13v14zM9 7h6v2H9V7zm0 4h6v2H9v-2zm0 4h3v2H9v-2z" />
                  </svg>
                </i>
                <i className="sidenav-mini-icon"> A </i>
                <span className="item-name">Aprobar Contratos</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`${location.pathname === '/dashboard/table/contracts-table' ? 'active' : ''} nav-link`} to="/dashboard/table/contracts-table">
                <i className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M9 16h6v-6h-6v6m8-10V4H7a2 2 0 00-2 2v12a2 2 0 002 2h10v-2h-2v-4h6V6l-6 6z" />
                  </svg>
                </i>
                <i className="sidenav-mini-icon"> C </i>
                <span className="item-name">Contratos</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`${location.pathname === '/dashboard/table/clients-table' ? 'active' : ''} nav-link`} to="/dashboard/table/clients-table">
                <i className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4a4 4 0 100 8 4 4 0 000-8zm0 10c-4.42 0-8 1.79-8 4v2h16v-2c0-2.21-3.58-4-8-4z" />
                  </svg>
                </i>
                <i className="sidenav-mini-icon"> B </i>
                <span className="item-name">Base Clientes</span>
              </Link>
            </li>
            <li className='nav-item'>
              <Link className={`${location.pathname === '/dashboard/table/service' ? 'active' : ''} nav-link`} to="/dashboard/table/service">
                <i className='icon'>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z" />
                  </svg>
                </i>
                <i className="sidenav-mini-icon"> S </i>
                <span className="item-name">Servicios</span>
              </Link>
            </li>
          </>
        ) : userRole === 'vendedor' ? (

          <>
            <li className="nav-item">
              <Link className={`${location.pathname === '/dashboard/table/contracts-table' ? 'active' : ''} nav-link`} to="/dashboard/table/contracts-table">
                <i className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M0 0h20v20H0V0zm5 14h2v-4H5v4zm4 0h2v-8H9v8zm4 0h2v-6h-2v6z" />
                  </svg>
                </i>
                <i className="sidenav-mini-icon"> B </i>
                <span className="item-name">Contratos</span>
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`${location.pathname === '/dashboard/table/clients-table' ? 'active' : ''} nav-link`} to="/dashboard/table/clients-table">
                <i className="icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 0a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM10 11c-4.418 0-8 2.686-8 6v1h16v-1c0-3.314-3.582-6-8-6z" />
                  </svg>
                </i>
                <i className="sidenav-mini-icon"> D </i>
                <span className="item-name">Base Clientes</span>
              </Link>
            </li>

          </>
        ) : (
          <div>No tienes acceso a esta página</div>
        )}
      </Accordion>
    </Fragment>
  );
});

export default VerticalNav;
