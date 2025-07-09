import React, { useEffect, useState, Fragment, memo } from 'react'
import { Navbar, Container, Nav, Dropdown, Modal, Form, Button, Toast, ToastContainer, InputGroup } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import CustomToggle from '../../../dropdowns'
import { getFirestore, doc, getDoc, Timestamp, updateDoc, collection, getDocs, query, where, deleteDoc } from "firebase/firestore";
import './header.css';
import { FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import shapes1 from '../../../../assets/images/shapes/01.png'
import shapes2 from '../../../../assets/images/shapes/02.png'
import shapes3 from '../../../../assets/images/shapes/03.png'
import shapes4 from '../../../../assets/images/shapes/04.png'
import shapes5 from '../../../../assets/images/shapes/05.png'
import avatars1 from '../../../../assets/images/avatars/01.png'

// logo
import Logo from '../../../../assets/images/icons/logo3.png'


// Redux Selector / Action
import { useSelector } from 'react-redux';

// Import selectors & action from setting store
import * as SettingSelector from '../../../../store/setting/selectors'
const db = getFirestore();

const Header = memo((props) => {

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('');
    const [showToast, setShowToast] = useState(false);

    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);
    const [editUser, setEditUser] = useState(null); // Estado para almacenar los datos del usuario en edición
    const [users, setUsers] = useState([]);

    const navbarHide = useSelector(SettingSelector.navbar_show); // array
    const headerNavbar = useSelector(SettingSelector.header_navbar)
    const [user, setUser] = useState(null);  // Estado para guardar la información del usuario
    const navigate = useNavigate();  // Para redireccionar después de cerrar sesión
    const userId = localStorage.getItem('userId'); // Obtener el ID del usuario almacenado
    const [userRole, setUserRole] = useState(null);
    const [showPassword, setShowPassword] = useState(false);
    const currentUserId = localStorage.getItem('userId'); // o sessionStorage.getItem('userId')

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };




    // Función para eliminar el ID de la sesión
    const handleDeleteUserId = () => {
        localStorage.removeItem('userId'); // Eliminar el ID del usuario de localStorage     
    };
    const fetchUserData = async () => {
        if (!userId) {
            return;
        }

        try {
            // Referencia al documento del usuario en Firestore
            const userDocRef = doc(db, "users", userId);

            // Obtener el documento del usuario
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                // Combinar el firstName y lastName
                const userData = userDoc.data();

                const fullName = `${userData.firstName} ${userData.lastName}`;

                // Actualizar el estado del usuario con el nombre completo
                setUser({ fullName, email: userData.email });

            } else {
                console.warn("No such document!");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };
    useEffect(() => {
        fetchUserData();
    }, []);
    const minisidebar = () => {
        document.getElementsByTagName('ASIDE')[0].classList.toggle('sidebar-mini');
    };
    const handleEdit = async () => {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            console.warn("No hay sesión de usuario activa");
            return;
        }

        try {
            const userDocRef = doc(db, "users", userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                const fullName = `${userData.firstName} ${userData.lastName}`;

                setEditUser({
                    id: userId,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    password: userData.password,
                    phone: userData.phone,
                    role: userData.role,
                    createdAt: userData.createdAt ? userData.createdAt.toDate().toISOString().slice(0, 16) : '' // Formato datetime-local
                });

                handleShow();
            } else {
                console.warn("No such document!");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };


    const handleUpdateUser = async () => {
        if (!editUser.id) {
            console.error("ID de usuario no definido.");
            return;
        }

        // Limpiar espacios
        const trimmedFirstName = editUser.firstName.trim();
        const trimmedLastName = editUser.lastName.trim();
        const trimmedEmail = editUser.email.trim();
        const trimmedPassword = editUser.password.trim();
        const trimmedPhone = editUser.phone.trim();
        const trimmedRole = editUser.role.trim();

        // Validación: campos obligatorios
        if (!trimmedFirstName || !trimmedLastName || !trimmedEmail || !trimmedPassword || !trimmedPhone || !trimmedRole) {
            setToastMessage("Todos los campos son obligatorios.");
            setToastVariant("danger");
            setShowToast(true);
            return;
        }

        // Validación: longitud nombre y apellido
        if (trimmedFirstName.length > 15 || trimmedLastName.length > 15) {
            setToastMessage("El nombre y el apellido deben tener como máximo 15 caracteres.");
            setToastVariant("danger");
            setShowToast(true);
            return;
        }

        // Validación: email válido
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
            setToastMessage("El correo electrónico no es válido.");
            setToastVariant("danger");
            setShowToast(true);
            return;
        }

        // Validación: teléfono de 10 dígitos
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(trimmedPhone)) {
            setToastMessage("El número de teléfono debe tener exactamente 10 dígitos.");
            setToastVariant("danger");
            setShowToast(true);
            return;
        }

        // Obtener todos los usuarios de la base
        const usersRef = collection(db, "users");
        const usersSnapshot = await getDocs(usersRef);
        const allUsers = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Evitar duplicados en nombre o apellido (excepto el actual)
        const nameConflict = allUsers.some(user => {
            const userFirst = user.firstName?.trim().toLowerCase();
            const userLast = user.lastName?.trim().toLowerCase();
            return (
                user.id !== editUser.id &&
                (userFirst === trimmedFirstName.toLowerCase() || userLast === trimmedLastName.toLowerCase())
            );
        });

        if (nameConflict) {
            setToastMessage("Ya existe un usuario con el mismo nombre o apellido. Por favor ingresa el segundo nombre o una inicial.");
            setToastVariant("danger");
            setShowToast(true);
            return;
        }

        // Evitar duplicado de correo
        const emailConflict = allUsers.some(user =>
            user.id !== editUser.id &&
            user.email?.trim().toLowerCase() === trimmedEmail.toLowerCase()
        );

        if (emailConflict) {
            setToastMessage("Ya existe un usuario con el mismo correo electrónico.");
            setToastVariant("danger");
            setShowToast(true);
            return;
        }

        // Evitar duplicado de teléfono
        const phoneConflict = allUsers.some(user =>
            user.id !== editUser.id &&
            user.phone?.trim() === trimmedPhone
        );

        if (phoneConflict) {
            setToastMessage("Ya existe un usuario con el mismo número de teléfono.");
            setToastVariant("danger");
            setShowToast(true);
            return;
        }

        // Verificar si el usuario no hizo cambios
        const originalUser = allUsers.find(u => u.id === editUser.id);
        const noChanges =
            originalUser &&
            originalUser.firstName?.trim() === trimmedFirstName &&
            originalUser.lastName?.trim() === trimmedLastName &&
            originalUser.email?.trim() === trimmedEmail &&
            originalUser.password?.trim() === trimmedPassword &&
            originalUser.phone?.trim() === trimmedPhone &&
            originalUser.role?.trim() === trimmedRole;

        if (noChanges) {
            setToastMessage("No se detectaron cambios en los datos del usuario.");
            setToastVariant("info");
            setShowToast(true);
            return;
        }

        try {
            const userDocRef = doc(db, "users", editUser.id);

            await updateDoc(userDocRef, {
                firstName: trimmedFirstName,
                lastName: trimmedLastName,
                email: trimmedEmail,
                password: trimmedPassword,
                phone: trimmedPhone,
                role: trimmedRole,

            });

            setUsers(prevUsers =>
                prevUsers.map(user =>
                    user.id === editUser.id
                        ? {
                            ...user,
                            firstName: trimmedFirstName,
                            lastName: trimmedLastName,
                            email: trimmedEmail,
                            password: trimmedPassword,
                            phone: trimmedPhone,
                            role: trimmedRole,

                        }
                        : user
                )
            );

            fetchUserData();
            setToastMessage("Usuario actualizado correctamente");
            setToastVariant("success");
            setShowToast(true);
            handleClose();
        } catch (error) {
            console.error("Error actualizando usuario:", error);
            setToastMessage("Error actualizando usuario");
            setToastVariant("danger");
            setShowToast(true);
        }
    };


    useEffect(() => {
        const fetchUserRole = async () => {
            if (userId) {
                const userRef = doc(db, "users", userId);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserRole(userData.role);  // Guardar el rol del usuario
                } else {
                    setToastMessage("No se encontró el documento del usuario.");
                    setToastVariant('danger');
                    setTimeout(() => {
                        navigate("/");
                    }, 1600);
                }
            } else {
                setToastMessage("No se encontró el ID del usuario.");
                setToastVariant('danger');
                setTimeout(() => {
                    navigate("/");
                }, 1600);

            }
        };

        fetchUserRole();
    }, [navigate]);


    const [notificaciones, setNotificaciones] = useState([]);

    // Si existen notificaciones, cambia la apariencia del icono
    const hayNotificaciones = notificaciones.length > 0;


    const [showEditModal, setShowEditModal] = useState(false);
    const [currentNotification, setCurrentNotification] = useState(null); // Datos actuales de la notificación a editar
    const [editedNotification, setEditedNotification] = useState({
        corrections: '',

    }); // Datos editados

    // Función para editar una notificación
    const editarNotificacion = async (notificacionId, nuevosDatos) => {
        try {
            const notificacionRef = doc(db, 'notifications', notificacionId);
            await updateDoc(notificacionRef, nuevosDatos);
            setToastMessage('Notificación editada correctamente.');
            setToastVariant('success');
            setShowToast(true);


        } catch (err) {
            setToastMessage('Error al editar la notificación.');
            setToastVariant('danger');
            setShowToast(true);
        }
    };

    const openEditModal = (notificacion) => {
        setCurrentNotification(notificacion);
        setEditedNotification({
            corrections: notificacion.corrections,

        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async () => {
        if (currentNotification && editedNotification.corrections) {
            await editarNotificacion(currentNotification.id, editedNotification); // Usar la función de editar notificación
            setShowEditModal(false); // Cerrar el modal tras la edición
        } else {
            setToastMessage('Debe completar todos los campos.');
            setToastVariant('danger');
        }
    };

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [notificationToDelete, setNotificationToDelete] = useState(null);
    const openDeleteModal = (notificacion) => {
        setNotificationToDelete(notificacion); // Guardamos toda la notificación para mostrar detalles
        setShowDeleteModal(true);
    };


    const eliminarNotificacion = async (notificationId) => {
        try {
            // Verifica que notificationId es una cadena válida
            if (typeof notificationId !== 'string') {
                throw new Error('El ID de la notificación no es válido.');
            }

            const notificationDoc = doc(db, 'notifications', notificationId);
            await deleteDoc(notificationDoc);

            setToastMessage('Notificación eliminada exitosamente.');
            setToastVariant('success');
            setShowToast(true);
            setShowDeleteModal(false);
        } catch (error) {
            setToastMessage('Error al eliminar la notificación.');
            setToastVariant('danger');
            setShowToast(true);
        }
    };

    if (userRole === null) {
        return <div>Cargando...</div>;  // Mensaje de carga mientras se obtiene el rol del usuario
    }
    return (
        <Fragment>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title className="text-center w-100" id="modal-contract-title">
                        Editar
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>

                    {userRole === 'admin' ? (
                        <>
                            <Form.Group className="mb-3">
                                <label htmlFor="firstName"  className="text-black">Nombres</label>
                                <Form.Control
                                    type="text"
                                    id="firstName"
                                    placeholder=" Nombre "
                                    maxLength={15}
                                    value={editUser ? editUser.firstName : ''}
                                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="lastName"  className="text-black">Apellidos</label>
                                <Form.Control
                                    type="text"
                                    id="lastName"
                                    placeholder="Apellido"
                                    maxLength={15}
                                    value={editUser ? editUser.lastName : ''}
                                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="email"  className="text-black">Correo Electrónico</label>
                                <Form.Control
                                    type="email"
                                    id="email"
                                    placeholder="Ingresar Un Correo Electrónico"
                                    pattern="[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+"
                                    value={editUser ? editUser.email : ''}
                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <label htmlFor="password"  className="text-black">Contraseña</label>
                                <div className="input-group">
                                    <Form.Control
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        placeholder="Ingresar Contraseña"
                                        value={editUser ? editUser.password : ''}
                                        onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                    />
                                    <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </InputGroup.Text>
                                </div>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <label htmlFor="phone"  className="text-black">No. Celular</label>
                                <Form.Control
                                    type="text"
                                    id="phone"
                                    placeholder="Ingresar Un Numero de Celular"
                                    maxLength={10}
                                    value={editUser ? editUser.phone : ''}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, ''); // Eliminar todo lo que no sea número
                                        if (value.length <= 10) {
                                            setEditUser({ ...editUser, phone: value });
                                        }
                                    }}
                                />
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <label htmlFor="role"  className="text-black">Rol</label>
                                <Form.Select
                                    type="text" // 'type' is not standard for Form.Select, but it won't break anything.
                                    id="role"
                                    placeholder="Ingresar Rol"
                                    value={editUser ? editUser.role : ''}
                                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                >
                                    <option disabled value="">Seleccionar Rol</option>
                                    <option value="admin">Administrador</option>
                                    <option value="vendedor">Vendedor</option>
                                </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                                <label htmlFor="createdAt"  className="text-black">Fecha de Creación</label>
                                <Form.Control
                                    type="datetime-local"
                                    id="createdAt"
                                    placeholder=""
                                    value={editUser ? editUser.createdAt : ''}
                                    onChange={(e) => setEditUser({ ...editUser, createdAt: e.target.value })}
                                    disabled // <--- Add this attribute
                                />
                            </Form.Group>
                            <Modal.Footer className="justify-content-center">
                                <Button variant="success" onClick={handleUpdateUser}>
                                    Actualizar
                                </Button>
                            </Modal.Footer>


                        </>
                    ) : userRole === 'vendedor' ? (

                        <>
                            <Form.Group className="mb-3">
                                <label htmlFor="firstName"  className="text-black">Nombres</label>
                                <Form.Control
                                    type="text"
                                    id="firstName"
                                    placeholder="Nombre"
                                    maxLength={15}
                                    value={editUser ? editUser.firstName : ''}
                                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="lastName"  className="text-black">Apellidos</label>
                                <Form.Control
                                    type="text"
                                    id="lastName"
                                    placeholder="Apellido"
                                    maxLength={15}
                                    value={editUser ? editUser.lastName : ''}
                                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="email"  className="text-black">Correo Electrónico</label>
                                <Form.Control
                                    type="email"
                                    id="email"
                                    placeholder="Ingresar Un Correo Electrónico"
                                    value={editUser ? editUser.email : ''}
                                    onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                                    disabled
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="password"  className="text-black">Contraseña</label>
                                <div className="input-group">
                                    <Form.Control
                                        type={showPassword ? "text" : "password"} // Alterna entre 'text' y 'password'
                                        id="password"
                                        placeholder="Ingresar Contraseña"
                                        value={editUser ? editUser.password : ''}
                                        onChange={(e) => setEditUser({ ...editUser, password: e.target.value })}
                                        disabled
                                    />
                                    <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </InputGroup.Text>
                                </div>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="phone" className="text-black" >No. Celular</label>
                                <Form.Control
                                    type="number"
                                    id="phone"
                                    placeholder="Ingresar Un Numero de Celular"
                                    value={editUser ? editUser.phone : ''}
                                    onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })}
                                    disabled
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="role"  className="text-black">Rol</label>
                                <Form.Control
                                    readOnly
                                    type="text"
                                    id="role"
                                    placeholder="Rol"
                                    value={editUser ? editUser.role : ''}
                                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}
                                    disabled
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <label htmlFor="createdAt"  className="text-black">Fecha de Creación</label>
                                <Form.Control
                                    readOnly
                                    type="datetime-local"
                                    id="createdAt"
                                    placeholder=""
                                    value={editUser ? editUser.createdAt : ''}
                                    onChange={(e) => setEditUser({ ...editUser, createdAt: e.target.value })}
                                    disabled
                                />
                            </Form.Group>
                            <Modal.Footer className="justify-content-center">
                                <Button variant="success" onClick={handleUpdateUser}>
                                    Actualizar
                                </Button>
                            </Modal.Footer>


                        </>
                    ) : (
                        <div>No tienes acceso a esta página</div>
                    )}

                </Modal.Body>
            </Modal>

            <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Notificación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="formNotificationTitle">
                            <label>Correcciones</label>
                            <Form.Control
                                type="text"
                                value={editedNotification.corrections}
                                onChange={(e) =>
                                    setEditedNotification({ ...editedNotification, corrections: e.target.value })
                                }
                            />
                        </Form.Group>

                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowEditModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={handleEditSubmit}>
                        Guardar Cambios
                    </Button>
                </Modal.Footer>
            </Modal>


            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {notificationToDelete ? (
                        <>
                            <p>¿Estás seguro de que deseas eliminar esta notificación?</p>
                            <p><strong>Información:</strong> {notificationToDelete.corrections}</p>
                            <p><strong>Cliente:</strong> {notificationToDelete.client}</p>
                            <p><strong>Contrato:</strong> {notificationToDelete.id_contract}</p>

                            <p>
                                <strong>Fecha:</strong>{' '}
                                {notificationToDelete.timestamp
                                    ? new Date(notificationToDelete.timestamp.toDate()).toLocaleString()  // Convierte correctamente el timestamp
                                    : 'Fecha no disponible'}
                            </p>

                        </>
                    ) : (
                        <p>Cargando datos de la notificación...</p>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Cancelar
                    </Button>
                    <Button variant="danger" onClick={() => eliminarNotificacion(notificationToDelete.id)}>
                        Confirmar Eliminación
                    </Button>

                </Modal.Footer>
            </Modal>




            <Navbar expand="lg" variant="light" className={`nav iq-navbar ${headerNavbar} ${navbarHide.join(" ")}`}>
                <Container fluid className="navbar-inner">
                    <Link to="/dashboard" className="navbar-brand">
                        <img src={Logo} alt="logo" className="img-fluid " style={{ height: "4vh", }} />
                        <h4 className="logo-title">Stroit Corp</h4>
                    </Link>
                    <div className="sidebar-toggle" data-toggle="sidebar" data-active="true" onClick={minisidebar}>
                        <i className="icon">
                            <svg width="20px" height="20px" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M4,11V13H16L10.5,18.5L11.92,19.92L19.84,12L11.92,4.08L10.5,5.5L16,11H4Z" />
                            </svg>
                        </i>
                    </div>

                    <Navbar.Toggle aria-controls="navbarSupportedContent">
                        <span className="navbar-toggler-icon">
                            <span className="mt-2 navbar-toggler-bar bar1"></span>
                            <span className="navbar-toggler-bar bar2"></span>
                            <span className="navbar-toggler-bar bar3"></span>
                        </span>
                    </Navbar.Toggle>

                    <Navbar.Collapse id="navbarSupportedContent">
                        <Nav as="ul" className="mb-2 ms-auto navbar-list mb-lg-0 align-items-center">
                            <Dropdown as="li" className="nav-item">
                                <Dropdown.Toggle as={CustomToggle} variant=" nav-link py-0 d-flex align-items-center" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">

                                    <img src={avatars1} alt="User-Profile" className="theme-color-default-img img-fluid avatar avatar-50 avatar-rounded" />

                                    <div className="caption ms-3 d-none d-md-block ">
                                        <h6 className="mb-0 caption-title">{user ? user.fullName : "Usuario"}</h6>
                                        <p className="mb-0 caption-sub-title">{user ? user.email : "Desarrollador"}</p>
                                    </div>
                                </Dropdown.Toggle>
                                <Dropdown.Menu className="dropdown-menu-end" aria-labelledby="navbarDropdown">
                                    <Dropdown.Item onClick={handleEdit}> Perfil</Dropdown.Item>

                                    <Dropdown.Divider />

                                    <Dropdown.Item onClick={handleDeleteUserId} href="/">Cerrar Sesión</Dropdown.Item>

                                </Dropdown.Menu>
                            </Dropdown>
                        </Nav>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
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
        </Fragment>
    )
})

export default Header
