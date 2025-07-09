import { useEffect, memo, Fragment, useContext, useState } from "react";
import { useLocation, Outlet, useNavigate } from "react-router-dom";

//react-shepherd
import { ShepherdTourContext } from "react-shepherd";

// header
import Header from "../../components/partials/dashboard/HeaderStyle/header";
import SubHeader from "../../components/partials/dashboard/HeaderStyle/sub-header";
import SubHeaderVendedor from "../../components/partials/dashboard/HeaderStyle/sub-header-vendedor";

//sidebar
import Sidebar from "../../components/partials/dashboard/SidebarStyle/sidebar";

//footer
import Footer from "../../components/partials/dashboard/FooterStyle/footer";
import SettingOffCanvas from "../../components/setting/SettingOffCanvas";

// Import selectors & action from setting store
import * as SettingSelector from "../../store/setting/selectors";

// Redux Selector / Action
import { useSelector } from "react-redux";

// Firebase imports
import { doc, getDoc, getFirestore } from "firebase/firestore"; 
import { firebaseConfig } from '../../firebase/firebase_settings';
import { initializeApp } from 'firebase/app';

initializeApp(firebaseConfig);
const db = getFirestore();


const Tour = () => {
  const tour = useContext(ShepherdTourContext);
  const { pathname } = useLocation();
  useEffect(() => {
    if (pathname === "/dashboard" && sessionStorage.getItem("tour") !== "true") {
      tour?.start();
    }
  }, [pathname, tour]);
  return <Fragment></Fragment>;
};

const Default = memo((props) => {
  const appName = useSelector(SettingSelector.app_name);
  const [userRole, setUserRole] = useState(null);
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
      {userRole === "admin" ? (
        <>
          <Sidebar app_name={appName} />
          <Tour />
          <main className="main-content">
            <div className="position-relative">
              <Header />
              <SubHeader />
            </div>
            <div className="py-0 container-fluid content-inner mt-n5">
              <Outlet />
            </div>
          </main>
          <SettingOffCanvas />
        </>
      ) : userRole === "vendedor" ? (
        <>
          <Sidebar app_name={appName} />
          <main className="main-content">
            <div className="position-relative">
              <Header />
              <SubHeaderVendedor />
            </div>
            <div className="py-0 container-fluid content-inner mt-n5">
              <Outlet />
            </div>
          </main>
        </>
      ) : (
        <div>No tienes acceso a esta página</div>
      )}
    </Fragment>
  );
});

Default.displayName = "Default";
export default Default;
