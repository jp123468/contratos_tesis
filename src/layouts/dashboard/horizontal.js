import React, {memo,Fragment} from 'react'
import { Button } from 'react-bootstrap'

//headerstyle1
import HeaderStyle1  from '../../components/partials/dashboard/HeaderStyle/header-style-1'

//footer
import Footer from '../../components/partials/dashboard/FooterStyle/footer'

//default 
import HorizontalRouter from '../../router/horizontal-router'
import SettingOffCanvas from '../../components/setting/SettingOffCanvas'



const Horizontal = memo((props) => {
 
    return (
        <Fragment>
            <main className="main-content">
                <HeaderStyle1 />
                <div className="conatiner-fluid content-inner">
                   <HorizontalRouter />
                </div>
                <Footer />
            </main>
            <SettingOffCanvas/>
        </Fragment>
    )
})

export default Horizontal
