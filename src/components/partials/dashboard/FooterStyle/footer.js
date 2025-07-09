import React from 'react'
import { Link} from 'react-router-dom'

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-body">
                <div className="right-panel">

                    ©<script>document.write(new Date().getFullYear())</script>  Derechos Reservados. Stroit Corp
                    
                </div>
            </div>
        </footer>
    )
}

export default Footer
