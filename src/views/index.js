import React, { useState, useEffect, Fragment } from 'react'

import { Link } from 'react-router-dom'


//img
import topImage from '../assets/images/dashboard/top-image.jpg'
import Logo from '../assets/images/pages/logo.png'


//prism
import '../../node_modules/prismjs/prism';
import '../../node_modules/prismjs/themes/prism-okaidia.css'

// SliderTab
import SliderTab from '../plugins/slider-tabs'





const Index = () => {


  useEffect(() => {
    return () => {
      setTimeout(() => {
        Array.from(
          document.querySelectorAll('[data-toggle="slider-tab"]'),
          (elem) => {
            return new SliderTab(elem);
          }
        );
      }, 100);
    };
  });

  return (
    <Fragment>
      <span className="uisheet screen-darken"></span>
      <div
        className="header"
        style={{
          background: `url(${topImage})`,
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
          height: "100vh",
          position: "relative",
        }}
      >
        <div className="main-img">
          <div className="container">
            <img src={Logo} alt="logo" className="img-fluid " style={{

              height: "15vh",

            }} />
            <div>
              <h1 className="my-4" style={{ textTransform: 'none' }}>
                Stroit Corp
              </h1>
              <h4 className="text-white mb-5" style={{ textTransform: 'none' }}>
                Las oportunidades no pasan, las creás.
              </h4>
              <div className="d-flex justify-content-center align-items-center">
                <Link
                  className="btn btn-light bg-white d-flex"
                  to="/auth/sign-in"
                  style={{ textTransform: 'none' }}
                >
                  <svg
                    width="22"
                    height="22"
                    className="me-1"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    ></path>
                  </svg>
                  Iniciar Sesión
                </Link>
              </div>
            </div>

          </div>
        </div>
      </div>

    </Fragment>
  )
}

export default Index;
