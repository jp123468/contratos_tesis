import React, { useState, useEffect, useRef, memo, Fragment } from "react";
import { Row, Col, Dropdown, Button, Modal, Form, Toast, ToastContainer } from "react-bootstrap";
import { FaEdit, FaCamera, FaPlus } from 'react-icons/fa';
import { getFirestore, doc, setDoc, Timestamp, getDoc, collection, getDocs, updateDoc, where } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import { firebaseConfig } from '../../firebase/firebase_settings';
import Card from '../../components/Card'
import { Link } from 'react-router-dom'
import SalesChartByRange from './SalesChartByRange.js'; // ajusta la ruta según corresponda
import CameraCapture from '../dashboard/CameraCapture'
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';

// AOS
import AOS from "aos";
import "../../../node_modules/aos/dist/aos";
import "../../../node_modules/aos/dist/aos.css";
//apexcharts
import { Swiper, SwiperSlide } from "swiper/react";


// Inicializa Firebase
initializeApp(firebaseConfig);
const db = getFirestore();

const Index = memo((props) => {
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('');
  const [showToast, setShowToast] = useState(false);

  const [show, setShow] = useState(false);
  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  const [show2, setShow2] = useState(false);
  const handleShow2 = () => setShow2(true);
  const handleClose2 = () => setShow2(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [newGoal, setNewGoal] = useState(''); // Para almacenar el nuevo objetivo
  const [currentUser, setCurrentUser] = useState(null);
  const canvasRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);
  const [totalSales, setTotalSales] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const [photoPago, setPhotoPago] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const [showModalImg, setShowModalImg] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState('');
  const [photoUrls, setPhotoUrls] = useState({});

  const getVariableColor = () => {
    let prefix =
      getComputedStyle(document.body).getPropertyValue("--prefix") || "bs-";
    if (prefix) {
      prefix = prefix.trim();
    }
    const color1 = getComputedStyle(document.body).getPropertyValue(
      `--${prefix}primary`
    );
    return {
      primary: color1.trim(),
    };
  };
  const variableColors = getVariableColor();

  const colors = [variableColors.primary, variableColors.info];
  useEffect(() => {
    return () => colors;
  });

  useEffect(() => {
    AOS.init({
      startEvent: "DOMContentLoaded",
      disable: function () {
        var maxWidth = 996;
        return window.innerWidth < maxWidth;
      },
      throttleDelay: 10,
      once: true,
      duration: 700,
      offset: 10,
    });
  });


  // David 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [targetDate, setTargetDate] = useState(new Date());
  const [remainingTime, setRemainingTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [newDate, setNewDate] = useState('');
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState(null);

  // Obtener el ID del usuario almacenado
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    const fetchChronometerDate = async () => {
      try {
        const chronometerDoc = doc(db, "chronometer", "chronometer_pri");
        const docSnapshot = await getDoc(chronometerDoc);

        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          const dateFromFirestore = data.date.toDate();
          setTargetDate(dateFromFirestore);
        } else {
          console.log('La tabla cronómetro no existe.');
          setToastMessage('La tabla cronómetro no existe');
          setToastVariant('danger');
          setShowToast(true);
        }
      } catch (error) {
        console.error('Error al recuperar la fecha desde Firestore:', error);
        setError('Error al recuperar la fecha: ' + error.message);
        setToastMessage('La tabla cronómetro no existe');
        setToastVariant('danger');
        setShowToast(true);
      }
    };

    fetchChronometerDate();
  }, []);

  const handleDateInputChange = (e) => {
    setNewDate(e.target.value);
  };

  const handleCreateChronometer = async () => {
    if (!newDate) {
      setToastMessage('Debes ingresar una fecha');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }

    try {
      const selectedDate = new Date(newDate);
      const current = new Date();

      if (selectedDate < current) {
        setToastMessage('La fecha ingresada no puede ser menor a la fecha actual');
        setToastVariant('danger');
        setShowToast(true);
        return;
      }

      const targetTimestamp = Timestamp.fromDate(selectedDate);
      const newChronometerRef = doc(db, "chronometer", "chronometer_pri");

      // Obtener la fecha anterior para guardar en el historial
      const existingDoc = await getDoc(newChronometerRef);
      let previousDate = null;

      if (existingDoc.exists()) {
        const existingData = existingDoc.data();
        previousDate = existingData.date; // Timestamp
      }

      // Actualizar la fecha principal
      await setDoc(newChronometerRef, {
        date: targetTimestamp
      });

      // Guardar en el historial solo si ya había una fecha anterior
      if (previousDate) {
        const historyRef = collection(db, "chronometer_history");
        await setDoc(doc(historyRef), {
          previousDate: targetTimestamp,       // La nueva que se está colocando
          savedAt: Timestamp.now()
        });
      }

      setTargetDate(selectedDate);
      handleClose();
      setToastMessage('Actualización exitosa');
      setToastVariant('success');
      setShowToast(true);
    } catch (error) {
      console.error('Error creando el registro en Firestore:', error);
      setToastMessage('Error');
      setToastVariant('danger');
      setShowToast(true);
    }
  };



  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const timeDifference = targetDate - now;

      if (timeDifference > 0) {
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);
        const seconds = Math.floor((timeDifference / 1000) % 60);

        setRemainingTime({ days, hours, minutes, seconds });
      } else {
        clearInterval(interval);
        setRemainingTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const formatDate = (date) => {
    return date.toLocaleDateString("es-ES", { day: '2-digit', month: 'long', year: 'numeric' });
  };

    useEffect(() => {
      const fetchUserRole = async () => {
        if (!userId) {
          console.log("No hay sesión de usuario activa");
          return;
        }

        try {
          const userRef = doc(db, "users", userId);
          console.log(userRef)
          const userDoc = await getDoc(userRef);
console.log(userDoc)
          if (userDoc.exists()) {
            const userData = userDoc.data();

            // ✅ Guarda el rol
            setUserRole(userData.role);
            console.log(userRole)
            // ✅ Guarda todo el usuario actual, incluyendo su ID
            setCurrentUser({
              id: userId,
              ...userData
            });
          } else {
            console.log("No se encontró el documento del usuario.");
            setToastMessage('No se encontró el documento del usuario.');
            setToastVariant('danger');
            setShowToast(true);
          }
        } catch (error) {
          console.error("Error al obtener el rol del usuario:", error);
          setError('Error al obtener el rol del usuario: ' + error.message);
          setToastMessage('Error al obtener el rol del usuario');
          setToastVariant('danger');
          setShowToast(true);
        }
      };

      fetchUserRole();
    }, [userId]);


  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [userSales, setUserSales] = useState({}); // Ventas mensuales
  const [startDate, setStartDate] = useState(''); // Fecha de inicio del filtro
  const [endDate, setEndDate] = useState(''); // Fecha de fin del filtro

  const [year, setYear] = useState(new Date().getFullYear()); // Año ingresado por el usuario

  const handleYearChange = (e) => {
    setYear(e.target.value); // Actualiza el año cuando el usuario lo ingresa
  };
  const [contractGoal, setContractGoal] = useState(0); // Inicializar con 0

  const fetchUsersAndContracts = async () => {
    try {
      // Obtener usuarios, contratos y el documento del cronómetro desde Firestore
      const usersCollection = collection(db, "users");
      const contractsCollection = collection(db, "contracts");
      const chronometerDocRef = doc(db, "chronometer", "chronometer_pri"); // Reference to chronometer_pri document

      const [usersSnapshot, contractsSnapshot, chronometerSnapshot] = await Promise.all([
        getDocs(usersCollection),
        getDocs(contractsCollection),
        getDoc(chronometerDocRef) // Get the chronometer document
      ]);

      // Determine the end date for monthly sales
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

      let endDate = today; // Default to today

      if (chronometerSnapshot.exists()) {
        const chronometerData = chronometerSnapshot.data();
        const counterDate = chronometerData.date; // Assuming 'date' is the field name

        if (counterDate && counterDate !== 0) { // Check if counterDate exists and is not zero
          // Assuming counterDate is a Firestore Timestamp or a format Date can parse
          endDate = new Date(counterDate.seconds * 1000); // Convert Firestore Timestamp to Date
        }
      }

      // Ensure the endDate is not past today if the counterDate is in the future (unlikely but good for robustness)
      if (endDate > today) {
        endDate = today;
      }
      // Ensure endDate is within the current month, even if chronometer_pri.date is from a previous month
      if (endDate.getMonth() !== today.getMonth() || endDate.getFullYear() !== today.getFullYear()) {
        endDate = today; // If counterDate is from a different month, default to today
      }


      // Filtrar contratos que sean 'contractCodeaprov' y estén dentro del rango mensual
      const contractsList = contractsSnapshot.docs.map(doc => doc.data());
      const filteredMonthlyContracts = contractsList.filter(contract => {
        const contractDate = contract.date ? new Date(contract.date) : null;
        // Check for 'contractCodeaprov' and date within the calculated monthly range
        return contract.contractCodeaprov !== "0" && contractDate && contractDate >= startOfMonth && contractDate <= endDate;
      });
      const salesData = {}; // Will store monthly sales

      const usersList = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const usersWithContractCount = usersList.map(user => {
        // Filter monthly contracts for the current user
        const userMonthlyContracts = filteredMonthlyContracts.filter(contract => contract.id_vent === user.id );

        const contractCount = userMonthlyContracts.length; // Count of approved contracts for the month

        const totalMonthlySales = userMonthlyContracts.reduce((sum, contract) => {
          return sum + (parseFloat(contract.valorPactadoHoy) || 0);
        }, 0);

        const goal = user.goal || 0; // Still use goal if it's relevant for something else, but not for remainingToGoal
        const remainingToGoal = totalMonthlySales - goal; //comprobar si funciona correctamente
        salesData[user.id] = totalMonthlySales; // Store monthly sales

        return {
          ...user,
          contractCount,
          remainingToGoal: remainingToGoal.toFixed(2) // Based on monthly sales now
        };
      });

      // Actualizar estado
      setUsers(usersWithContractCount);
      setUserSales(salesData);
    } catch (error) {
      console.error('Error al obtener usuarios y contratos:', error);
    }
  };

  useEffect(() => {
    fetchUsersAndContracts(); // Ejecutar la función combinada en el useEffect
  }, [startDate, endDate, year, contractGoal]);
  // Manejar el cambio de los inputs del formulario
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const fetchUsers = async () => {
    try {
      const usersCollection = collection(db, "users");
      const usersSnapshot = await getDocs(usersCollection);
      const usersList = usersSnapshot.docs.map(doc => doc.data());
      setUsers(usersList);
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
    }
  };
  const [formData, setFormData] = useState({
    goal: ''
  });

  const [editUserId, setEditUserId] = useState('');

  const handleEdit = (user) => {
    console.log('Usuario a editar:', user);
    setFormData({
      id: user.id,
      goal: user.goal
    });
    setEditUserId(user.id);
    handleShow2();
  };

  const handleUpdateUser = async () => {
    if (!editUserId) {
      console.error("ID de usuario no definido.");
      return;
    }

    try {
      const userDocRef = doc(db, "users", editUserId);
      const timestamp = formData.createdAt ? Timestamp.fromDate(new Date(formData.createdAt)) : Timestamp.now(); // Convertir a Timestamp

      await updateDoc(userDocRef, {
        goal: formData.goal
      });

      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === editUserId ? { ...user, ...formData, createdAt: timestamp } : user
        )
      );
      fetchUsersAndContracts();
      console.log('Usuario actualizado correctamente');
      setToastMessage('Usuario actualizado correctamente');
      setToastVariant('success');
      setShowToast(true);
      handleClose2();
      fetchUsers();
    } catch (error) {
      console.error("Error actualizando usuario:", error);

      setToastMessage('Error actualizando usuario');
      setToastVariant('danger');
      setShowToast(true);
    }
  };

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [chronometerHistory, setChronometerHistory] = useState([]);

  const handleShowHistory = async () => {
    try {
      const historyCollection = collection(db, "chronometer_history");
      const historySnapshot = await getDocs(historyCollection);
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setChronometerHistory(historyData.sort((a, b) =>
        b.savedAt?.toDate() - a.savedAt?.toDate()
      ));

      setShowHistoryModal(true);
    } catch (error) {
      console.error("Error al obtener historial de fechas:", error);
      setToastMessage("Error al obtener historial de fechas");
      setToastVariant("danger");
      setShowToast(true);
    }
  };

  const usersByRole = userRole === 'vendedor'
    ? users.filter(user => user.id === currentUser?.id)
    : users;

  const filteredUsers = usersByRole.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchUsers();
  }, []);

  const handlePhotoCapture = async (photoUrl) => {
    if (!selectedUser || !selectedUser.id) {
      setToastMessage('Error: Por favor, seleccione un usuario para guardar la foto de pago.');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }

    const storage = getStorage();
    const timestamp = Date.now();
    const captureDate = new Date();

    // Nombre del archivo con timestamp, no se sobrescribe en Storage
    const filePath = `pago_v/${selectedUser.id}-${timestamp}.png`;
    const storageRef = ref(storage, filePath);

    try {
      // ✅ Subir imagen a Firebase Storage
      await uploadString(storageRef, photoUrl, 'data_url');

      // ✅ Obtener URL pública
      const downloadURL = await getDownloadURL(storageRef);

      // ✅ Guardar solo la última URL y fecha en Firestore
      const photoDocRef = doc(db, "photoPagos", selectedUser.id);
      await setDoc(photoDocRef, {
        url: downloadURL,
        captureDate: captureDate.toISOString()
      });

      // ✅ Actualizar estado local para mostrar la nueva foto
      setPhotoPago(downloadURL);
      setShowCamera(false);
      setToastMessage('Foto de pago capturada y guardada correctamente.');
      setToastVariant('success');
      setShowToast(true);

    } catch (error) {
      console.error('Error al subir la foto de pago a Firebase: ', error);
      setToastMessage(`Error al capturar o guardar la foto de pago: ${error.message}`);
      setToastVariant('danger');
      setShowToast(true);
    }
  };


  const handleImageClick = (imageUrl) => {
    setModalImage(imageUrl);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalImage('');
  };
  const handleCapture = (user) => {
    setSelectedUser(user);
    setShowCamera(true);
  };

  const isValidImageUrl = (url) => {
    return (
      typeof url === 'string' &&
      url.trim() !== '' &&
      (url.startsWith('http://') || url.startsWith('https://'))
    );
  };
  useEffect(() => {
    const fetchPhotoUrls = async () => {
      const urls = {};

      // Asegúrate de que filteredUsers tenga usuarios válidos
      for (const user of filteredUsers) {
        const photoDocRef = doc(db, "photoPagos", user.id);
        const photoSnapshot = await getDoc(photoDocRef);

        if (photoSnapshot.exists()) {
          const data = photoSnapshot.data();
          urls[user.id] = data.url;
        }
      }

      setPhotoUrls(urls); // Actualiza el estado global de photoUrls
    };

    if (filteredUsers.length > 0) {
      fetchPhotoUrls();
    }
  }, [filteredUsers]);




  return (
    <Fragment>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title className="text-center w-100" id="modal-contract-title">
            Editar Fecha</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Control
              type="datetime-local" id="newTargetDate" onChange={handleDateInputChange} value={newDate}
              placeholder="Ingresar Nueva Fecha" />
          </Form.Group>
          <Modal.Footer className="d-flex justify-content-center">
            <Button variant="primary" onClick={handleCreateChronometer}>
              Agregar / Editar Fecha
            </Button>
            <Button variant="secondary" onClick={handleShowHistory} className="ms-2">
              Ver Historial
            </Button>
          </Modal.Footer>

        </Modal.Body>
      </Modal>

      <Modal show={show2} onHide={handleClose2}>
        <Modal.Header closeButton>
          <Modal.Title className="text-center w-100" id="modal-contract-title">
            Agregar / Editar Objetivo</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <div className="form-group">
              <label>Objetivo</label>
              <input
                type="number"
                id="goal"
                value={formData.goal}
                onChange={handleChange}
                className="form-control"
              />
            </div>

          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-center">
          <Button variant="primary" onClick={handleUpdateUser}>
            Agregar / Editar Objetivo
          </Button>

        </Modal.Footer>
      </Modal>
      <Modal show={showHistoryModal} onHide={() => setShowHistoryModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Historial de Fechas</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {chronometerHistory.length === 0 ? (
            <p>No hay historial disponible.</p>
          ) : (
            <ul className="list-group">
              {chronometerHistory.map((entry, index) => (
                <li key={entry.id || index} className="list-group-item">
                  Fecha Anterior: <strong>{entry.previousDate?.toDate().toLocaleString('es-EC')}</strong><br />
                  Guardado el: {entry.savedAt?.toDate().toLocaleString('es-EC')}
                </li>
              ))}
            </ul>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowHistoryModal(false)}>
            Cerrar
          </Button>
        </Modal.Footer>
      </Modal>

      <Col md="12" lg="12">
        <Row className="row-cols-1">
          <div className="overflow-hidden d-slider1" data-aos="fade-up" data-aos-delay="800">
            <Swiper
              className="p-0 m-0 mb-2 list-inline"
              slidesPerView={1}
              spaceBetween={0}
            >
              <SwiperSlide className="card card-slide">
                {userRole === 'admin' ? (
                  <>

                    <div className="card-body">
                      <Card.Header>
                        <h4 className="card-title mb-0"></h4>
                        <Button variant="info" onClick={handleShow} className="btn btn-primary" aria-label="Add Client">
                          <FaPlus /> Editar Fecha
                        </Button>
                      </Card.Header>
                      <div className="text-center">
                        <h4 className="text-primary fs-1 fw-bold">Cierre de Vigencia</h4>
                        <h4 className="text-primary fs-1 fw-bold mt-4">
                          {`${remainingTime.days} | ${remainingTime.hours} | ${remainingTime.minutes} | ${remainingTime.seconds}`}
                        </h4>
                        <h4 className="text-primary fs-6" style={{ marginRight: '-15px' }}>
                          <span style={{ marginRight: '25px' }}>Días</span>
                          <span style={{ marginRight: '25px' }}>Horas</span>
                          <span style={{ marginRight: '25px' }}>Minutos</span>
                          <span>Segundos</span>
                        </h4>
                        <h4 className="text-primary fs-5 fw-bold mt-3">
                          {formatDate(targetDate)}
                        </h4>
                      </div>
                    </div>
                    <SalesChartByRange userRole={userRole} currentUserId={currentUser?.id} />

                  </>
                ) : userRole === 'vendedor' ? (

                  <>
                    <div className="card-body">

                      <div className="text-center">
                        <h4 className="text-primary fs-1 fw-bold">Cierre de Vigencia</h4>
                        <h4 className="text-primary fs-1 fw-bold mt-4">
                          {`${remainingTime.days} | ${remainingTime.hours} | ${remainingTime.minutes} | ${remainingTime.seconds}`}
                        </h4>
                        <h4 className="text-primary fs-6">Dias Horas Minutos Segundos</h4>
                        <h4 className="text-primary fs-5 fw-bold mt-3">
                          {formatDate(targetDate)}
                        </h4>
                      </div>
                    </div>

                    <SalesChartByRange userRole={userRole} currentUserId={currentUser?.id} />

                  </>
                ) : (
                  <div>No tienes acceso a esta página</div>
                )}

              </SwiperSlide>
            </Swiper>
          </div>
        </Row>
      </Col>

      {userRole === "admin" ? (
        <Row>
          <Col sm="12">
            <Card>
              <Card.Header className="d-flex justify-content-between">
                <div className="header-title">
                  <h4 className="card-title">Estadsticas de Ventas</h4>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                    Este módulo permite ver las estadísticas de ventas de los vendedores.
                  </p>
                </div>
              </Card.Header>
              <Card.Body className="px-0">

                <div className="input-group mb-3">
                  <span className="input-group-text" id="search-input">
                    <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                      <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                  </span>
                  <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="search" className="form-control" placeholder="Buscar por (nombres o apellidos)" />
                </div>

                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  <table className="table table-striped table-bordered" id="basic-table">
                    <thead>
                      <tr className="ligth">
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Contratos del Mes</th>
                        <th>Ventas mensuales</th>
                        <th>Objetivo</th>
                        <th>Diferencia</th>
                        <th>Pago</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <tr key={user.id}>
                            <td>{user.firstName}</td>
                            <td>{user.lastName}</td>
                            <td style={{ textAlign: 'center' }}>{user.contractCount}</td>
                            <td style={{ textAlign: 'center' }}>
                              $ {Number(userSales[user.id] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              $ {Number(user.goal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td style={{ textAlign: 'center', color: (user.remainingToGoal || 0) < 0 ? 'red' : 'green' }}>
                              $ {Number(user.remainingToGoal || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}
                            </td>

                            <td>
                              {photoUrls[user.id] ? (
                                <img
                                  src={photoUrls[user.id]}
                                  alt="Pago"
                                  style={{ height: '50px', width: 'auto', borderRadius: '5px', cursor: 'pointer' }}
                                  onClick={() => handleImageClick(photoUrls[user.id])}
                                />
                              ) : (

                                <h6 className="data-value">Sin foto </h6>

                              )}
                            </td>
                            <td>
                              <Button
                                variant="link"
                                onClick={() => handleEdit(user)} // Mantengo `user` como en tu código original. Cambia a `user.id` si corresponde.
                                aria-label="Edit"
                              >
                                <FaEdit />
                              </Button>
                              <Button variant="link"
                                onClick={() => handleCapture(user)}
                                arial-label="Capture"
                              >
                                <FaCamera />
                              </Button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center">No se encontraron usuarios</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col sm="12">
          </Col>
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
        </Row>

      ) : userRole === "vendedor" ? (
        <>
          <Row>
            <Col sm="12">
              <Card>
                <Card.Header className="d-flex justify-content-between">
                  <div className="header-title">
                    <h4 className="card-title">Estadisticas de Ventas</h4>
                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                      Este módulo permite ver las estadisticas de tus ventas.
                    </p>
                  </div>
                </Card.Header>
                <Card.Body className="px-0">

                  <div className="input-group mb-3">
                    <span className="input-group-text" id="search-input">
                      <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                        <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                      </svg>
                    </span>
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} type="search" className="form-control" placeholder="Buscar por (nombres o apellidos)" />
                  </div>
                  <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <table className="table table-striped table-bordered w-100" id="basic-table">
                      <thead>
                        <tr className="light">
                          <th>Nombre</th>
                          <th>Apellido</th>
                          <th>Contratos mes</th>
                          <th>Ventas mensuales</th>
                          <th>Objetivo</th>
                          <th>Diferencia</th>
                          <th> Pago</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.length > 0 ? (
                          filteredUsers.map((user) => (
                            <tr key={user.id}>
                              <td>{user.firstName}</td>
                              <td>{user.lastName}</td>
                              <td style={{ textAlign: 'center' }}>{user.contractCount}</td>
                              <td style={{ textAlign: 'center' }}>
                                $ {Number(userSales[user.id] || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                $ {Number(user.goal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                $ {Number(user.remainingToGoal || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                              <td>
                                {photoUrls[user.id] ? (
                                  <img
                                    src={photoUrls[user.id]}
                                    alt="Pago"
                                    style={{ height: '50px', width: 'auto', borderRadius: '5px', cursor: 'pointer' }}
                                    onClick={() => handleImageClick(photoUrls[user.id])}
                                  />
                                ) : (

                                  <h6 className="data-value">Sin foto de pago reciente</h6>

                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center">No se encontraron usuarios</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>


                </Card.Body>
              </Card>
            </Col>
            <Col sm="12">
            </Col>
            <ToastContainer position="top-end" className="p-3">
              <Toast
                bg={toastVariant === 'success' ? 'success' : 'danger'}
                show={showToast}
                onClose={() => setShowToast(false)}
                delay={30000000}
                autohide
              >
                <Toast.Body>{toastMessage}</Toast.Body>
              </Toast>
            </ToastContainer>
          </Row>
        </>

      )
        : (
          <p></p>
        )}

      {showCamera && (
        <CameraCapture
          show={showCamera}
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
      <Modal
        show={showModal}
        onHide={handleCloseModal}
        centered
        size="lg"
        dialogClassName="modal-90w"
        aria-labelledby="modal-title"
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-center w-100" id="modal-contract-title">
            Vista de Imagen Pago</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img
            src={modalImage}
            alt="Imagen ampliada"
            style={{
              width: '100%',
              height: 'auto',
              maxHeight: '80vh',
              objectFit: 'contain'
            }}
          />
        </Modal.Body>
      </Modal>
    </Fragment>

  );
})

export default Index
