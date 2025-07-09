import React, { useState, useEffect } from 'react'
import { Row, Col, Modal, Form, Button, Toast, InputGroup, ToastContainer } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Card from '../../../components/Card'
import { getFirestore, getDoc, doc, setDoc, query, collection, where, getDocs, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../../firebase/firebase_settings';
import { FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import './user-list.css'


// Inicializa Firebase
initializeApp(firebaseConfig);
const db = getFirestore();


const UserList = ({ mockedUsers }) => {
   const [toastMessage, setToastMessage] = useState('');
   const [toastVariant, setToastVariant] = useState('');
   const [showToast, setShowToast] = useState(false);
   const currentUserId = localStorage.getItem('userId'); // o sessionStorage.getItem('userId')
   const [showPassword, setShowPassword] = useState(false);
   const [showConfirmPassword, setShowConfirmPassword] = useState(false);

   const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
   };

   const toggleConfirmPasswordVisibility = () => {
      setShowConfirmPassword(!showConfirmPassword);
   };



   const [show, setShow] = useState(false);
   const handleShow = () => setShow(true);
   const handleClose = () => setShow(false);

   const [show2, setShow2] = useState(false);
   const handleShow2 = () => setShow2(true);
   const handleClose2 = () => setShow2(false);

   const [showModal, setShowModal] = useState(false);
   const [selectedUser, setSelectedUser] = useState(null);
   const [searchTerm, setSearchTerm] = useState('');

   const [formData, setFormData] = useState({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: '',
      createdAt: ''
   });

   const [error, setError] = useState('');

   const [users, setUsers] = useState([]);
   const [editUserId, setEditUserId] = useState('');

   // Manejar el cambio de los inputs del formulario
   const handleChange = (e) => {
      setFormData({ ...formData, [e.target.id]: e.target.value });
   };

   const handleSignUp = async () => {
      // Eliminar espacios al inicio y al final
      const firstName = formData.firstName.trim();
      const lastName = formData.lastName.trim();
      const email = formData.email.trim();
      const phone = formData.phone.trim();
      const password = formData.password.trim();
      const confirmPassword = formData.confirmPassword.trim();
      const createdAt = formData.createdAt;



      // Validación de campos vacíos
      if (!firstName || !lastName || !email || !phone || !password || !confirmPassword) {
         setToastMessage('Todos los campos son obligatorios.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }

      // Validación de longitud máxima
      if (firstName.length > 15 || lastName.length > 15) {
         setToastMessage('Nombre y Apellido deben tener máximo 15 letras.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }

      // Validación de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         setToastMessage('El correo electrónico no es válido.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }

      // Validación de número de celular
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
         setToastMessage('El número de celular debe tener 10 números.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }

      // Validación de contraseñas
      if (password !== confirmPassword) {
         setToastMessage('Las contraseñas no coinciden.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }

      // Validación de duplicados
      const isDuplicate = users.some(user =>
         user.firstName.toLowerCase() === firstName.toLowerCase() ||
         user.lastName.toLowerCase() === lastName.toLowerCase() ||
         user.email.toLowerCase() === email.toLowerCase() ||
         user.phone === phone
      );

      if (isDuplicate) {
         setToastMessage('Ya existe un Usuario con el mismo nombre, correo o teléfono.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }

      try {
         const newUserId = generateRandomId();
         const timestamp = createdAt ? Timestamp.fromDate(new Date(createdAt)) : Timestamp.now();

         await setDoc(doc(db, "users", newUserId), {
            id: newUserId,
            firstName,
            lastName,
            email,
            phone,
            password,
            createdAt: timestamp,
            role: 'vendedor'
         });

         setToastMessage('Usuario registrado correctamente');
         setToastVariant('success');
         setShowToast(true);
         handleClose();
         fetchUsers();
      } catch (error) {
         console.error('Error al crear la cuenta:', error);
         setToastMessage('Error al crear la cuenta: ' + error.message);
         setToastVariant('danger');
         setShowToast(true);
      }
   };




   // Función para generar un ID único para el Usuario
   const generateRandomId = () => {
      return 'user_' + Math.random().toString(36).substr(2, 9);
   };

   const fetchUsers = async () => {
      try {
         const usersCollection = collection(db, "users");
         const usersSnapshot = await getDocs(usersCollection);
         const usersList = usersSnapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
         }));
         setUsers(usersList);
      } catch (error) {
         console.error('Error al obtener Usuarios:', error);
      }
   };

   useEffect(() => {
      if (mockedUsers && Array.isArray(mockedUsers)) {
        setUsers(mockedUsers);
        return;
      }
      fetchUsers();
    }, [mockedUsers]);
    

   const [previousPassword, setPreviousPassword] = useState('');

   const handleEdit = (user) => {
      setFormData({
         id: user.id,
         firstName: user.firstName,
         lastName: user.lastName,
         email: user.email,
         password: user.password,
         phone: user.phone,
         role: user.role
      });
      setEditUserId(user.id);
      setPreviousPassword(user.password); // 👈 aquí guardas la contraseña anterior
      handleShow2();
   };
   const handleUpdateUser = async () => {
      if (!editUserId) {
         console.error("ID de Usuario no definido.");
         return;
      }

      // Obtener y limpiar valores
      const firstName = formData.firstName?.trim() || '';
      const lastName = formData.lastName?.trim() || '';
      const email = formData.email?.trim() || '';
      const phone = formData.phone?.trim() || '';
      const password = formData.password?.trim() || '';
      const role = formData.role;

      // Validaciones previas
      // Campos obligatorios
      if (!firstName || !lastName || !email || !phone || !password) {
         setToastMessage('Todos los campos son obligatorios.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }
      // Longitud máxima nombre/apellido
      if (firstName.length > 15 || lastName.length > 15) {
         setToastMessage('Nombre y Apellido deben tener máximo 15 letras.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }
      // Formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
         setToastMessage('El correo electrónico no es válido.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }
      // Formato de teléfono: 10 dígitos
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(phone)) {
         setToastMessage('El número de celular debe tener 10 dígitos.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }
      const isDuplicate = users.some(user =>
         user.id !== editUserId && (
            user.firstName.toLowerCase() === firstName.toLowerCase() ||
            user.lastName.toLowerCase() === lastName.toLowerCase() ||
            user.email.toLowerCase() === email.toLowerCase() ||
            user.phone === phone
         )
      );
      

      if (isDuplicate) {
         setToastMessage('Ya existe un Usuario con el mismo nombre, apellido, correo o teléfono.');
         setToastVariant('danger');
         setShowToast(true);
         return;
      }

      // Restricción: si edita su propio usuario, no permitir cambiar rol
      if (editUserId === currentUserId) {
         const currentRole = users.find(u => u.id === currentUserId)?.role;
         if (role !== currentRole) {
            setToastMessage('No puedes cambiar el rol del usuario con el que estás trabajando.');
            setToastVariant('danger');
            setShowToast(true);
            return;
         }
      }

      try {
         // Preparar referencia y timestamp si hace falta
         const userDocRef = doc(db, "users", editUserId);
         // Si guardas createdAt, podrías reconstruir timestamp; 
         // aquí sólo actualizamos los campos relevantes.
         await updateDoc(userDocRef, {
            firstName,
            lastName,
            email,
            password,
            phone,
            role,
         });

         // Actualizar estado localmente: asegurarse de incluir trimmed fields
         setUsers((prevUsers) =>
            prevUsers.map((user) =>
               user.id === editUserId
                  ? {
                     ...user,
                     firstName,
                     lastName,
                     email,
                     password,
                     phone,
                     role,
                     // Mantener otros campos como createdAt (si necesitas actualizarlo, ajusta aquí)
                  }
                  : user
            )
         );
         setToastMessage('Usuario actualizado correctamente.');
         setToastVariant('success');
         setShowToast(true);

         // Si la contraseña cambió, mostrar mensaje extra luego de 1.5s
         if (password !== previousPassword) {
            setTimeout(() => {
               setToastMessage('Contraseña actualizada correctamente.');
               setToastVariant('success');
               setShowToast(true);
               console.log('Contraseña actualizada correctamente');

            }, 1500);

         }
         handleClose2();

         fetchUsers();
      } catch (error) {
         console.error("Error actualizando Usuario:", error);
         setToastMessage('Error actualizando usuario.');
         setToastVariant('danger');
         setShowToast(true);
      }
   };



   const handleDeleteUser = async (userId) => {
      try {
         const userDocRef = doc(db, "users", userId);
         // Usar getDoc en lugar de getDocs:
         const userSnap = await getDoc(userDocRef);

         if (!userSnap.exists()) {
            setToastMessage('El usuario no existe.');
            setToastVariant('danger');
            setShowToast(true);
            return;
         }

         const userData = userSnap.data();

         // 1. No eliminar si rol admin
         if (userData.role === 'admin') {
            setToastMessage('No se puede eliminar un usuario con rol de administrador.');
            setToastVariant('warning');
            setShowToast(true);
            return;
         }

         // 2. Verificar si tiene contratos vinculados (campo id_vent)
         // Se asume que en cada contrato hay un campo `id_vent` con el ID del usuario/vendedor
         const contractsRef = collection(db, 'contracts');
         const q = query(contractsRef, where('id_vent', '==', userId));
         const contractSnapshot = await getDocs(q);
         if (!contractSnapshot.empty) {
            // Hay al menos un contrato con este usuario
            setToastMessage('No se puede eliminar el usuario porque tiene contratos asociados.');
            setToastVariant('danger');
            setShowToast(true);
            return;
         }

         // Si no hay contratos, proceder a eliminar
         await deleteDoc(userDocRef);
         setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));

         setToastMessage('Usuario eliminado correctamente.');
         setToastVariant('success');
         setShowToast(true);
         fetchUsers();
      } catch (error) {
         console.error('Error al eliminar el usuario:', error);
         setToastMessage('Error al eliminar el usuario.');
         setToastVariant('danger');
         setShowToast(true);
      }
   };

   // Función para abrir el modal con los datos del Usuario seleccionado
   const openModal = (user) => {
      setSelectedUser(user); // Almacena los datos del Usuario
      setShowModal(true); // Muestra el modal
   };

   // Función para confirmar la eliminación
   const confirmDelete = async () => {
      if (!selectedUser) return;

      try {
         const contractsRef = collection(db, "contracts");
         const q = query(contractsRef, where("id_vent", "==", selectedUser.id));
         const querySnapshot = await getDocs(q);

         if (!querySnapshot.empty) {
            setToastMessage('No se puede eliminar el usuario porque tiene contratos asignados.');
            setToastVariant('danger');
            setShowToast(true);
            return;
         }

         handleDeleteUser(selectedUser.id);
         setShowModal(false);
      } catch (error) {
         console.error("Error al verificar contratos del usuario:", error);
         setToastMessage('No se pudo verificar los cantratos del Usuario. Intentelo de nuevo.');
         setToastVariant('danger');
         setShowToast(true);

      }
   };

   const filteredUsers = users.filter(user =>
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
   );


   return (
      <>
         <div>
            <Row>
               <Col sm="12">
                  <Card>
                     <Card.Header className="d-flex justify-content-between">
                        <div className="header-title">
                           <label className="card-title">Usuarios</label>
                           <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                              Este módulo permite gestionar de vendedores y personal administrativo.
                           </p>
                        </div>
                        <Button variant="info" onClick={handleShow} class="btn btn-primary" aria-label="Add Client"> <FaPlus /> Nuevo Usuario</Button>
                     </Card.Header>
                     <Card.Body className="px-0">
                        <Modal show={show} onHide={handleClose} >

                           <Modal.Header closeButton>
                              <Modal.Title className="w-100 text-center">Nuevo </Modal.Title>
                           </Modal.Header>
                           <Modal.Body>
                              <Form>
                                 <Row>
                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="firstName" className="text-black">Nombre</label>
                                          <Form.Control
                                             required
                                             type="text"
                                             id="firstName"
                                             placeholder="Nombre"
                                             maxLength={15}
                                             onChange={handleChange}
                                             onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                             }}
                                          />
                                       </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="lastName" className="text-black">Apellido</label>
                                          <Form.Control
                                             required
                                             type="text"
                                             id="lastName"
                                             placeholder="Apellido"
                                             maxLength={15}
                                             onChange={handleChange}
                                             onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                             }}
                                          />
                                       </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="email" className="text-black">Correo Electrónico</label>
                                          <Form.Control
                                             required
                                             type="email"
                                             id="email"
                                             placeholder="Correo"
                                             pattern="[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+"
                                             onChange={handleChange}
                                          />
                                       </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="phone" className="text-black">No. Celular</label>
                                          <Form.Control
                                             required
                                             type="text"
                                             id="phone"
                                             placeholder="Teléfono"
                                             pattern="\d{10}"
                                             maxLength={10}
                                             onChange={handleChange}
                                          />
                                       </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="password" className="text-black">Contraseña</label>
                                          <InputGroup>
                                             <Form.Control
                                                required
                                                type={showPassword ? "text" : "password"}
                                                id="password"
                                                value={formData.password}
                                                placeholder="Ingresar Contraseña"
                                                onChange={handleChange}
                                             />
                                             <InputGroup.Text onClick={togglePasswordVisibility} style={{ cursor: 'pointer' }}>
                                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                                             </InputGroup.Text>
                                          </InputGroup>
                                       </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="confirmPassword" className="text-black">Repita la contraseña</label>
                                          <InputGroup>
                                             <Form.Control
                                                required
                                                type={showConfirmPassword ? "text" : "password"}
                                                id="confirmPassword"
                                                value={formData.confirmPassword}
                                                placeholder="Confirmar Contraseña"
                                                onChange={handleChange}
                                             />
                                             <InputGroup.Text onClick={toggleConfirmPasswordVisibility} style={{ cursor: 'pointer' }}>
                                                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                                             </InputGroup.Text>
                                          </InputGroup>
                                       </Form.Group>
                                    </Col>
                                 </Row>

                                 <Modal.Footer className="justify-content-center">
                                    <Button variant="success" onClick={handleSignUp}>
                                       Guardar
                                    </Button>
                                 </Modal.Footer>
                              </Form>

                           </Modal.Body>
                        </Modal>
                        <Modal show={show2} onHide={handleClose2} >
                           <Modal.Header closeButton>
                              <Modal.Title className="text-center w-100" id="modal-contract-title">
                                 Editar</Modal.Title>
                           </Modal.Header>
                           <Modal.Body>
                              <Form>
                                 <Row>
                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label  htmlFor="firstName"  className="text-black">Nombre</label>
                                          <Form.Control
                                             type="text"
                                             id="firstName"
                                             value={formData.firstName}
                                             maxLength={15}
                                             onChange={handleChange}
                                             onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                             }}
                                          />
                                       </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="lastName"  className="text-black">Apellido</label>
                                          <Form.Control
                                             type="text"
                                             id="lastName"
                                             value={formData.lastName}
                                             onChange={handleChange}
                                             maxLength={15}
                                             onInput={(e) => {
                                                e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                             }}
                                          />
                                       </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="email" className="text-black">Email</label>
                                          <Form.Control
                                             type="email"
                                             id="email"
                                             value={formData.email}
                                             onChange={handleChange}
                                          />
                                       </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label  htmlFor="phone"  className="text-black">Teléfono</label>
                                          <Form.Control
                                             type="text"
                                             id="phone"
                                             maxLength={10}
                                             value={formData.phone}
                                             onChange={handleChange}
                                          />
                                       </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1" style={{ position: "relative" }}>
                                          <label htmlFor="password" className="text-black">Contraseña</label>
                                          <Form.Control
                                             type={showPassword ? "text" : "password"}
                                             id="password"
                                             value={formData.password}
                                             onChange={handleChange}
                                             data-testid="password-input"  // <-- Agrega esta línea
                                          />

                                          <span
                                             onClick={togglePasswordVisibility}
                                             style={{
                                                position: "absolute",
                                                top: "70%",
                                                right: "10px",
                                                transform: "translateY(-50%)",
                                                cursor: "pointer",
                                                color: "#6c757d",
                                                fontSize: "1.2rem"
                                             }}
                                          >
                                             {showPassword ? <FaEyeSlash /> : <FaEye />}
                                          </span>
                                       </Form.Group>
                                    </Col>

                                    <Col md={6}>
                                       <Form.Group className="mb-5 ml-1">
                                          <label htmlFor="role" className="text-black">Rol</label>
                                          <Form.Select
                                             id="role"
                                             value={formData.role}
                                             onChange={handleChange}
                                          >
                                             <option value="" disabled>Seleccionar</option>
                                             <option value="vendedor">Vendedor</option>
                                             <option value="admin">Administrador</option>
                                          </Form.Select>
                                       </Form.Group>
                                    </Col>
                                 </Row>
                              </Form>
                           </Modal.Body>
                           <Modal.Footer className="justify-content-center">
                              <Button variant="success" onClick={handleUpdateUser}>
                                 Guardar
                              </Button>
                           </Modal.Footer>
                        </Modal>
                        <Modal show={showModal} onHide={() => setShowModal(false)}>
                           <Modal.Header closeButton>
                              <Modal.Title className="w-100 text-center">Eliminar</Modal.Title>
                           </Modal.Header>

                           <Modal.Body>
                              {selectedUser && (
                                 <>
                                    <label className="mb-5 text-center">¿Estás seguro de que deseas eliminar el siguiente Usuario?</label>
                                    <ul className="list-unstyled ps-3">
                                       <li>
                                          <strong className="text-dark">Nombres:</strong>{' '}
                                          <span className="data-value">{selectedUser.firstName}</span>
                                       </li>
                                       <li>
                                          <strong className="text-dark">Apellidos:</strong>{' '}
                                          <span className="data-value">{selectedUser.lastName}</span>
                                       </li>
                                       <li>
                                          <strong className="text-dark">Email:</strong>{' '}
                                          <span className="data-value">{selectedUser.email}</span>
                                       </li>
                                       <li>
                                          <strong className="text-dark">Contraseña:</strong>{' '}
                                          <span className="data-value">{selectedUser.password}</span>
                                       </li>
                                       <li>
                                          <strong className="text-dark">Teléfono:</strong>{' '}
                                          <span className="data-value">{selectedUser.phone}</span>
                                       </li>
                                       <li>
                                          <strong className="text-dark  ">Rol:</strong>{' '}
                                          <span className="data-value">{selectedUser.role}</span>
                                       </li>
                                    </ul>
                                 </>
                              )}
                           </Modal.Body>

                           <Modal.Footer style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                              <Button variant="danger" onClick={confirmDelete}>
                                 Confirmar Eliminación
                              </Button>
                           </Modal.Footer>
                        </Modal>

                        <div className="input-group mb-5">
                           <span className="input-group-text" id="search-input">
                              <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                 <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                                 <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                              </svg>
                           </span>
                           <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="search" className="form-control" placeholder="Buscar por (nombres, apellidos, correo)" />
                        </div>

                        <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto', padding: '0 1rem' }}>
                           <table
                              className="table table-striped table-bordered"
                              id="basic-table"
                              style={{ width: '98%', margin: '0 auto', borderCollapse: 'collapse' }}
                           >
                              <thead>
                                 <tr className="ligth">
                                    <th style={{ padding: '8px 12px' }}>Nombre</th>
                                    <th style={{ padding: '8px 12px' }}>Apellido</th>
                                    <th style={{ padding: '8px 12px' }}>Email</th>
                                    <th style={{ padding: '8px 12px' }}>Contraseña</th>
                                    <th style={{ padding: '8px 12px' }}>Teléfono</th>
                                    <th style={{ padding: '8px 12px' }}>Rol</th>
                                    <th style={{ padding: '8px 12px' }}>Fecha Creación</th>
                                    <th style={{ padding: '8px 12px', minWidth: '100px' }}>Acciones</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {filteredUsers.length > 0 ? (
                                    filteredUsers.map((user) => (
                                       <tr key={user.id}>
                                          <td style={{ padding: '6px 10px' }}>{user.firstName}</td>
                                          <td style={{ padding: '6px 10px' }}>{user.lastName}</td>
                                          <td style={{ padding: '6px 10px' }}>{user.email}</td>
                                          <td style={{ padding: '6px 10px' }}>{'*'.repeat(user.password.length)}</td>
                                          <td style={{ padding: '6px 10px' }}>{user.phone}</td>
                                          <td style={{ padding: '6px 10px' }}>{user.role}</td>
                                          <td style={{ padding: '6px 10px' }}>{user.createdAt.toDate().toLocaleDateString()}</td>
                                          <td style={{ padding: '6px 10px' }}>
                                             <Button
                                                variant="link"
                                                onClick={() => handleEdit(user)}
                                                aria-label="Edit"
                                                title="Editar"
                                             >
                                                <FaEdit />
                                             </Button>
                                             <Button
                                                variant="link"
                                                onClick={() => openModal(user)}
                                                aria-label="Delete"
                                                title="Eliminar"
                                             >
                                                <FaTrash />
                                             </Button>
                                          </td>
                                       </tr>
                                    ))
                                 ) : (
                                    <tr>
                                       <td colSpan="8" className="text-center" style={{ padding: '8px' }}>
                                          No se encontraron Usuarios
                                       </td>
                                    </tr>
                                 )}
                              </tbody>
                           </table>
                        </div>

                     </Card.Body>
                  </Card>
               </Col>
            </Row>
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
         </div>
      </>
   )

}

export default UserList;