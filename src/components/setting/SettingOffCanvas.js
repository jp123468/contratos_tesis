import { useState, useEffect, memo, Fragment } from "react";

//react-bootstrap
import { Offcanvas, Row, Col } from "react-bootstrap";

// Redux Selector / Action
import { useSelector } from "react-redux";

// Import selectors & action from setting store
import * as SettingSelector from "../../store/setting/selectors";

// Section Components
// Style Setting Section Components
import ThemeScheme from "./sections/theme-scheme";
// import ColorCustomizer from "./sections/color-customizer";
import MenuColor from "./sections/menu-color";
import MenuStyle from "./sections/menu-style";
import MenuActiveStyle from "./sections/menu-active-style";
import NavbarStyle from "./sections/navbar-style";
import CardStyle from "./sections/card-style";

const SettingOffCanvas = memo((props) => {
  const [show, setShow] = useState(false);

  // Define selectors
  const themeScheme = useSelector(SettingSelector.theme_scheme);
  const themeSchemeDirection = useSelector(
    SettingSelector.theme_scheme_direction
  );
  const themeColor = useSelector(SettingSelector.theme_color);

  const headerNavbar = useSelector(SettingSelector.header_navbar);
  const cardStyle = useSelector(SettingSelector.card_style);

  const sidebarColor = useSelector(SettingSelector.sidebar_color);
  const sidebarType = useSelector(SettingSelector.sidebar_type);

  const sidebarMenuStyle = useSelector(SettingSelector.sidebar_menu_style);

  useEffect(() => {
    const onClick = (e) => {
      if (show) {
        if (
          e.target.closest(".live-customizer") == null &&
          e.target.closest("#settingbutton") == null
        ) {
          setShow(false);
        }
      }
    };
    document.body.addEventListener("click", onClick);

    return () => {
      document.body.removeEventListener("click", onClick);
    };
  });
  return (
    <Fragment>

    </Fragment>
  );
});

SettingOffCanvas.displayName = "SettingOffCanvas";
export default SettingOffCanvas;
