import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, ToastContainer, Toast, Container, Modal } from 'react-bootstrap';
import { db } from '../../../firebase/firebase_settings';
import { collection, query, where, getDocs, getDoc, addDoc, doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import CameraCapture from '../CameraCapture';
import Select from 'react-select';
import './Createcontract.css';
import PDFGenerator from '../pdfgenerator';


const Createcontract = () => {
    const [contractCode, setContractCode] = useState('');
    const [contractCodeaprov, setcontractCodeaprov] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [searchCriterion, setSearchCriterion] = useState('idnumber');
    const [searchValue, setSearchValue] = useState('');
    const [client, setCliente] = useState({ name: '', lastname: '', idnumber: '', birthdate: '' });
    const [headlines, setTitulares] = useState([{ name: '', birthdate: '', idNumber: '', photoFront: '', photoBack: '' }]);
    const [showCamera, setShowCamera] = useState(false);
    const [currentPhotoType, setCurrentPhotoType] = useState('');
    const [currentTitularIndex, setCurrentTitularIndex] = useState(null);
    const [capturedStates, setCapturedStates] = useState([{ front: false, back: false }]);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success'); // 'success' or 'danger'
    const [selectedServices, setSelectedServices] = useState([]);
    const [selectCiudad, setSelectedCiudad] = useState([]);
    const [valorPactadoHoy, setValorPactadoHoy] = useState('');
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState([]);
    const [observations, setObservations] = useState('');
    const [observationsadmin, setObservationsadmin] = useState('');
    const [serviceOptions, setServiceOptions] = useState([]);
    const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
    const [photoPago, setPhotoPago] = useState('');
    const [ciudadOptions, setCiudadOptions] = useState([]);
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(1); // Start at Step 1
    const [photos, setPhotos] = useState([]);




    useEffect(() => {
        const initializeContractCode = async () => {
          const nextCode = await getNextContractCode();
          console.log('código generado', nextCode);
          setContractCode(nextCode);
          setCurrentDate(new Date().toISOString().split('T')[0]);
        };
        initializeContractCode();
        fetchOptions();
      }, []);
      

    useEffect(() => {
        // Inicializa el estado de captura para cada titular
        setCapturedStates(headlines.map(() => ({ front: false, back: false })));
    }, [headlines]);

    const sellerId = localStorage.getItem('userId');

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const cargarUsuario = async () => {

            try {
                const idUsuario = sellerId; // o de donde lo estés guardando
                const docRef = doc(db, 'users', idUsuario);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setCurrentUser(docSnap.data());
                }
            } catch (error) {
                console.error('Error al obtener el usuario:', error);
            }
        };

        cargarUsuario();
    }, []);


    const fetchOptions = async () => {
        try {
            const optionsSnapshot = await getDocs(collection(db, 'OptionsSelect'));
            if (!optionsSnapshot.empty) {
                const optionsData = optionsSnapshot.docs[0].data();


                // Asegúrate de que cada campo sea un objeto
                const serviceOptions = formatOptions(optionsData.serviceOptions || {});
                const trainingPlaceOptions = formatOptions(optionsData.trainingPlaceOptions || {});
                const paymentMethodOptions = formatOptions(optionsData.paymentMethodOptions || {});
                const ciudadOptions = formatOptions(optionsData.cityOptions || {});

                setServiceOptions(serviceOptions);
                setPaymentMethodOptions(paymentMethodOptions);
                setCiudadOptions(ciudadOptions);
            } else {
                console.warn('No se encontraron documentos en la colección OptionsSelect.');
            }

        } catch (error) {
            console.error('Error al obtener las opciones de la base de datos:', error);
        }
    };

    const formatOptions = (optionsObject) => {

        return Object.keys(optionsObject).map((key) => ({
            value: key,
            label: optionsObject[key]  // Asegúrate de usar 'label' en minúsculas
        }));
    };




    const getNextContractCode = async () => {
        try {
            const q = query(collection(db, 'contracts'));
            const querySnapshot = await getDocs(q);
            let maxCode = 0;
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                const code = parseInt(data.contractCode, 10);
                if (code > maxCode) {
                    maxCode = code;
                }
            });
            return (maxCode + 1).toString().padStart(6, '0');
        } catch (error) {
            console.error('Error al obtener el próximo código de contrato: ', error);
            setToastMessage('Error al obtener el proximo código de contrato');
            setToastVariant('danger');
            setShowToast(true);
        }
    };


    const handleSearch = async () => {
        let q;
        let queryMessage = '';
        console.log(searchValue)
        const formattedSearchValue = searchValue.trim();
        console.log(formattedSearchValue)
        console.log(searchValue)
        // Validación de campos vacíos
        if (!searchValue.trim()) {
            setToastMessage('Por favor ingresa un valor de búsqueda.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        console.log(currentUser)

        try {

            if (!currentUser) {
                setToastMessage('No se pudo obtener la información del cliente a buscar.');
                setToastVariant('danger');
                setShowToast(true);
                return;
            }

            const clientsRef = collection(db, 'clients');
            console.log(currentUser.role)
            console.log(searchCriterion)
            // Criterio: por cédula
            if (currentUser.role !== 'admin') {
                if (searchCriterion === 'idnumber') {

                    q = query(clientsRef, where('idnumber', '==', formattedSearchValue));
                } else {
                    q = query(clientsRef, where('idnumber', '==', formattedSearchValue), where('id_vent', '==', currentUser.id));
                }
                queryMessage = 'cédula';
            }


            // Ejecutar la consulta
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                querySnapshot.forEach((doc) => {
                    setCliente(doc.data());
                });

                setToastMessage(`Cliente encontrado por ${queryMessage}.`);
                setToastVariant('success');
                setShowToast(true);
            } else {
                setCliente(null); // o limpia el estado si es necesario
                setToastMessage(`No se encontró ningún cliente con esa ${queryMessage} para este vendedor.`);
                setToastVariant('danger');
                setShowToast(true);
            }

        } catch (error) {
            console.error('Error realizando la búsqueda: ', error);
            setToastMessage(`Error inesperado: ${error.message || error}`);
            setToastVariant('danger');
            setShowToast(true);
        }
    };



    const handleCriterionChange = (e) => {
        setSearchCriterion(e.target.value);
        // Borra el mensaje de error y éxito al cambiar el criterio de búsqueda
        setToastMessage('');
        setToastVariant('success');
        setSearchValue(''); // Borra el valor del campo de búsqueda
        setCliente({ name: '', lastname: '', idnumber: '' }); // Limpiar la información del cliente
    };

    const handleAddTitular = () => {
        if (headlines.length >= 3) {
            setToastMessage('Solo se permiten hasta 3 titulares.');
            setToastVariant('warning');
            setShowToast(true);
            return;
        }
        setTitulares([...headlines, { name: '', birthdate: '', idNumber: '', photoFront: '', photoBack: '' }]);
    };


    const handleRemoveTitular = (index) => {
        setTitulares(headlines.filter((_, i) => i !== index));
    };

    const handleTitularChange = (index, event) => {
        const newTitulares = headlines.slice();
        newTitulares[index][event.target.name] = event.target.value;
        setTitulares(newTitulares);
    };

    const handleSubmit = async (event) => {

        event.preventDefault();


        if (!client.name || !client.lastname || !client.idnumber) {
            setToastMessage('Debe buscar y seleccionar un cliente válido.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        if (headlines.some(titular => !titular.name || !titular.birthdate || !titular.idNumber)) {
            setToastMessage('Todos los titulares deben tener nombre, fecha de nacimiento, número de cédula y sus fotos (frontal y trasera).');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        if (headlines.some(titular =>
            String(titular.idNumber).trim() === String(client.idnumber).trim()
        )) {
            setToastMessage('La cédula del cliente no puede ser la misma que la del titular.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        const idNumbers = headlines.map(t => String(t.idNumber).trim());
        const hasDuplicateIdNumbers = new Set(idNumbers).size !== idNumbers.length;

        if (hasDuplicateIdNumbers) {
            setToastMessage('No se puede repetir la cédula entre los titulares.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        if (selectedServices.length === 0) {
            setToastMessage('Debe seleccionar al menos un servicio.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        if (selectCiudad.length === 0) {
            setToastMessage('Debe seleccionar la ciudad.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        if (!valorPactadoHoy) {
            setToastMessage('El valor  es obligatorio.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        if (isNaN(valorPactadoHoy)) {
            setToastMessage('El valor  debe ser un número válido.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        if (Number(valorPactadoHoy) < 0) {
            setToastMessage('El valor  no puede ser negativo.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        if (selectedPaymentMethod.length === 0) {
            setToastMessage('Debe seleccionar una forma de pago.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        const sellerId = localStorage.getItem('userId'); // Obtener el ID del usuario almacenado

        if (!sellerId) {
            setToastMessage('No se pudo obtener el ID del vendedor.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        try {
            // Guardar los datos en Firestore
            const docRef = await addDoc(collection(db, 'contracts'), {
                contractCode,
                date: currentDate,
                client,
                photoPago,
                headlines,
                ciudad: selectCiudad,
                services: selectedServices, // Guardar los servicios seleccionados
                valorPactadoHoy,
                paymentMethod: selectedPaymentMethod, // Guardar la forma de pago
                observations, // Guardar observaciones adicionales
                observationsadmin,
                approved: false,
                id_vent: sellerId,
                corrections: '',
                contractCodeaprov: '0'
            });

            const clientName = client ? `${client.name} ${client.lastname}` : null;

            // Registrar la notificación en Firestore
            const notificationRef = collection(db, 'notifications');
            const newNotification = {
                id_contract: contractCode,
                id_user: sellerId,
                client: clientName,
                corrections: "Contrato en enviado para revisión",
                timestamp: new Date(), // Fecha y hora de la notificación
                type: "Revision"
            };

            setToastMessage('Contrato guardado con éxito.');
            setToastVariant('success');
            setShowToast(true);
            await addDoc(notificationRef, newNotification);

            const pdfData = {
                contractCodeaprov,
                date: currentDate,
                client,
                headlines,
                ciudad: selectCiudad,
                services: selectedServices,
                valorPactadoHoy,
                paymentMethod: selectedPaymentMethod,
                observations,
                observationsadmin,
                uidUsuario: sellerId
            };

            // Generar el PDF usando la función PDFGenerator
            await PDFGenerator(pdfData);
            setToastMessage('Creando PDF, espere un momento');
            setToastVariant('success');
            setShowToast(true);

            setTimeout(() => {
                navigate('/dashboard/table/contracts-table');
            }, 1800);

        } catch (error) {
            console.error('Error al guardar el contrato: ', error);
            setToastMessage('Error al guardar el contrato.');
            setToastVariant('danger');
            setShowToast(true);
        }
    };


    const handleCapture = (type, index) => {
        setCurrentPhotoType(type);
        setCurrentTitularIndex(index);
        setShowCamera(true);
    };

    const handlePhotoCapture = async (photoUrl) => {
        if (!headlines[currentTitularIndex]?.idNumber) {
            setToastMessage('Error: Por favor, ingrese el número de identificación antes de capturar la foto.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        const storage = getStorage();
        const updatedTitulares = [...headlines]; // clonar arreglo titulares
        const timestamp = new Date().getTime();
        let filePath = '';

        const titularIdNumber = headlines[currentTitularIndex].idNumber;

        if (currentPhotoType === 'front') {
            filePath = `photos/${titularIdNumber}/front.jpg`;
            const newCapturedStates = [...capturedStates];
            newCapturedStates[currentTitularIndex].front = true;
            setCapturedStates(newCapturedStates);
        } else if (currentPhotoType === 'back') {
            filePath = `photos/${titularIdNumber}/back.jpg`;
            const newCapturedStates = [...capturedStates];
            newCapturedStates[currentTitularIndex].back = true;
            setCapturedStates(newCapturedStates);
        } else if (currentPhotoType === 'pago') {
            filePath = `photos/${client.idnumber}/pago.jpg`;
        }

        const storageRef = ref(storage, filePath);

        try {
            const snapshot = await uploadString(storageRef, photoUrl, 'data_url');
            const downloadURL = await getDownloadURL(snapshot.ref);

            if (currentPhotoType === 'front') {
                updatedTitulares[currentTitularIndex].photoFront = downloadURL;
            } else if (currentPhotoType === 'back') {
                updatedTitulares[currentTitularIndex].photoBack = downloadURL;
            } else if (currentPhotoType === 'pago') {
                if (!photoPago) setPhotoPago([]);
                setPhotoPago((prevPhotoPago) => [...prevPhotoPago, downloadURL]);
            }

            setTitulares(updatedTitulares);

            // Actualizar estado photos para miniaturas front/back
            const updatedPhotos = [...photos];
            if (currentPhotoType === 'front') {
                updatedPhotos[currentTitularIndex] = {
                    ...updatedPhotos[currentTitularIndex],
                    front: downloadURL,
                };
            } else if (currentPhotoType === 'back') {
                updatedPhotos[currentTitularIndex] = {
                    ...updatedPhotos[currentTitularIndex],
                    back: downloadURL,
                };
            }
            setPhotos(updatedPhotos);

            setShowCamera(false);

            setToastMessage('Foto capturada y guardada correctamente.');
            setToastVariant('success');
            setShowToast(true);
        } catch (error) {
            console.error('Error al subir la foto a Firebase: ', error);
            setToastMessage(`Error al capturar o guardar la foto: ${error.message}`);
            setToastVariant('danger');
            setShowToast(true);
        }
    };


    const nextStep = () => setCurrentStep((prev) => prev + 1);
    const prevStep = () => setCurrentStep((prev) => prev - 1);


    return (
        <div className="justify-content-center align-items-center dark-background step-container">

            {/* The Main Form Card */}
            <Card className="form-card">
                <Card.Header className="d-flex justify-content-between align-items-center card-header-custom">
                    <div className="header-title w-100 text-center">
                        <h1 className="w-100 text-center card-title m-0">Nuevo</h1>
                    </div>
                    <button
                        className="btn btn-link text-danger fs-4"
                        onClick={() => navigate('/dashboard/table/contracts-table')}
                        style={{ textDecoration: 'none' }}
                    >
                        &times;
                    </button>
                </Card.Header>


                <Card.Body >
                    <Form onSubmit={handleSubmit}>
                        {/* === Paso 1: Datos del Cliente === */}
                        {currentStep === 1 && (
                            <>
                                <h4 className="section-title text-center">Datos del Cliente</h4>
                                <Form.Group className="mb-3">
                                    <h5 htmlFor="searchCriterion " className="label_form">Buscar Cliente Por</h5>
                                    <Form.Select
                                        id="searchCriterion"
                                        value={searchCriterion}
                                        onChange={handleCriterionChange}
                                        className="form-control-custom"
                                    >
                                        <option value="idnumber">Número de Cédula</option>
                                    </Form.Select>
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <h5 className="label_form" >Valor de Búsqueda</h5>
                                    <Form.Control
                                        type="text"
                                        placeholder="Ingrese el valor de búsqueda"
                                        value={searchValue}
                                        maxLength={13}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d{0,13}$/.test(value)) {
                                                setSearchValue(value);
                                            }
                                        }}
                                        className="form-control-custom"
                                    />
                                </Form.Group>

                                <Button variant="info" className="btn-custom" onClick={handleSearch}>
                                    Buscar Cliente
                                </Button>

                                {client && (
                                    <div className="mt-3 client-info-box">
                                        <h6 className='text-center'>Cliente encontrado</h6>
                                        <p className="label_form">Nombre: </p><p>{client.name} {client.lastname}</p>
                                        <p className="label_form">Cédula: </p> <p>{client.idnumber} </p>
                                    </div>
                                )}

                                <div className="d-flex justify-content-end mt-4">
                                    <Button variant="light" className="btn-custom" onClick={nextStep}>
                                        Siguiente
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* === Paso 2: Titulares === */}
                        {currentStep === 2 && (
                            <>
                                <h4 className="section-title text-center">Titulares
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                        Puedes agregar un maximo de 3 beneficiarios adicionales con el nombre de "Titulares".
                                    </p>
                                </h4>

                                {headlines.map((titular, index) => (
                                    <div key={index} className="titular-section">
                                        <Form.Group className="mb-3">
                                            <h5 className="label_form">Nombre</h5>
                                            <Form.Control
                                                aria-label={`Nombre del titular ${index + 1}`}
                                                type="text"
                                                name="name"
                                                value={titular.name}
                                                onChange={(e) => handleTitularChange(index, e)}
                                                placeholder="Nombre del titular"
                                                className="form-control-custom"
                                                maxLength={40}
                                                onInput={(e) => {
                                                    e.target.value = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
                                                }}
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <h5 className="label_form">Fecha de Nacimiento</h5>
                                            <Form.Control
                                                aria-label={`birthdate ${index + 1}`}
                                                type="date"
                                                name="birthdate"
                                                value={titular.birthdate}
                                                onChange={(e) => handleTitularChange(index, e)}
                                                className="form-control-custom"
                                            />
                                        </Form.Group>

                                        <Form.Group className="mb-3">
                                            <h5 className="label_form">Número de Cédula</h5>
                                            <Form.Control
                                                type="text"
                                                name="idNumber"
                                                value={titular.idNumber}
                                                onChange={(e) => handleTitularChange(index, e)}
                                                placeholder={`Número de cédula del titular ${index + 1}`}
                                                maxLength={10}
                                                pattern="\d*"
                                                required
                                                className="form-control-custom"
                                            />
                                        </Form.Group>

                                        <Row className="mb-3">
                                            {/* Foto Frontal */}
                                            <Col md={6}>
                                                <Form.Group>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                                        <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Foto Cédula Frontal:</h3>

                                                        {/* Mostrar foto capturada */}
                                                        {photos[index]?.front && (
                                                            <img
                                                                src={photos[index].front}
                                                                alt="Foto Frontal"
                                                                style={{ height: '80px', maxWidth: '120px', borderRadius: '4px' }}
                                                            />
                                                        )}

                                                        {/* Si no hay foto capturada, mostrar la guardada en Firebase */}
                                                        {!photos[index]?.front && headlines[index]?.photoFront && (
                                                            <img
                                                                src={headlines[index].photoFront}
                                                                alt="Foto Frontal (Guardada)"
                                                                style={{ height: '80px', maxWidth: '120px', borderRadius: '4px' }}
                                                            />
                                                        )}

                                                        <Button
                                                            variant="info"
                                                            className="btn-secondary-custom"
                                                            onClick={() => handleCapture('front', index)}
                                                            disabled={capturedStates[index]?.front}
                                                        >
                                                            Capturar
                                                        </Button>
                                                    </div>
                                                </Form.Group>
                                            </Col>

                                            {/* Foto Trasera */}
                                            <Col md={6}>
                                                <Form.Group>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
                                                        <h3 style={{ fontWeight: '700', fontSize: '1.1rem' }}>Foto Cédula Trasera:</h3>

                                                        {/* Mostrar foto capturada */}
                                                        {photos[index]?.back && (
                                                            <img
                                                                src={photos[index].back}
                                                                alt="Foto Posterior"
                                                                style={{ height: '80px', maxWidth: '120px', borderRadius: '4px' }}
                                                            />
                                                        )}

                                                        {/* Si no hay foto capturada, mostrar la guardada en Firebase */}
                                                        {!photos[index]?.back && headlines[index]?.photoBack && (
                                                            <img
                                                                src={headlines[index].photoBack}
                                                                alt="Foto Posterior (Guardada)"
                                                                style={{ height: '80px', maxWidth: '120px', borderRadius: '4px' }}
                                                            />
                                                        )}

                                                        <Button
                                                            variant="info"
                                                            className="btn-secondary-custom"
                                                            onClick={() => handleCapture('back', index)}
                                                            disabled={capturedStates[index]?.back}
                                                        >
                                                            Capturar
                                                        </Button>
                                                    </div>
                                                </Form.Group>
                                            </Col>
                                        </Row>



                                        {index > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px' }}>
                                                <Button
                                                    variant="danger"
                                                    onClick={() => handleRemoveTitular(index)}
                                                    className="mb-3 btn-danger-custom"
                                                >
                                                    Eliminar Titular
                                                </Button>
                                            </div>
                                        )}
                                        {index < headlines.length - 1 && <hr className="section-divider" />}
                                    </div>
                                ))}

                                <div className="d-flex justify-content-center mb-4">
                                    <Button
                                        variant="primary"
                                        className="btn-custom"
                                        onClick={handleAddTitular}
                                        disabled={headlines.length >= 3}  // deshabilitar si hay 3 titulares
                                    >
                                        Agregar Titular
                                    </Button>
                                </div>


                                <div className="d-flex justify-content-between mt-4">
                                    <Button variant="light" className="btn-light-custom" onClick={prevStep}>
                                        Anterior
                                    </Button>
                                    <Button variant="primary" className="btn-custom" onClick={nextStep}>
                                        Siguiente
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* === Paso 3: Ciudad, Servicios, Tipo de Pago, Valores === */}
                        {currentStep === 3 && (
                            <>
                                <h4 className="section-title text-center">Ciudad y Servicio</h4>
                                <Form.Group className="mb-3">
                                    <h5 className="label_form">Ciudad</h5>
                                    <Select
                                        placeholder={`Seleccionar ciudad`}
                                        options={ciudadOptions}
                                        value={selectCiudad}
                                        onChange={(selected) => setSelectedCiudad(selected)}
                                        classNamePrefix="react-select-custom"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <h5 className="label_form">Servicio</h5>
                                    <Select
                                        placeholder={`Servicios`}
                                        isMulti
                                        options={serviceOptions}
                                        value={selectedServices}
                                        onChange={(selected) => setSelectedServices(selected)}
                                        classNamePrefix="react-select-custom"
                                    />
                                </Form.Group>
                                <div className="d-flex justify-content-between mt-4">
                                    <Button variant="light" className="btn-light-custom" onClick={prevStep}>
                                        Anterior
                                    </Button>
                                    <Button variant="primary" className="btn-custom" onClick={nextStep}>
                                        Siguiente
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* === Paso 4: Estado de Venta y Forma de Pago === */}
                        {currentStep === 4 && (
                            <>
                                <h4 className="section-title mt-4 text-center">PAGO</h4>
                                <Form.Group className="mb-3">
                                    <h5 className="label_form">Valor </h5>
                                    <Form.Control
                                        placeholder={`Pago`}
                                        type="number"
                                        value={valorPactadoHoy}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (value.length <= 4) {
                                                setValorPactadoHoy(value);
                                            }
                                        }}
                                        max={9999}
                                        className="form-control-custom"
                                    />

                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <h5 className="label_form">Forma de Pago</h5>
                                    <Select
                                        placeholder={`Forma de Pago`}
                                        options={paymentMethodOptions}
                                        value={selectedPaymentMethod}
                                        onChange={(selected) => setSelectedPaymentMethod(selected)}
                                        classNamePrefix="react-select-custom"
                                    />
                                </Form.Group>
                                <div className="d-flex justify-content-center mb-3">
                                    <h5 style={{ fontWeight: '700', marginTop: '7px', marginRight: '27px' }}>Foto:</h5>
                                    <Button
                                        variant="info"
                                        className="btn-secondary-custom"
                                        onClick={() => handleCapture('pago', 0)}
                                        disabled={capturedStates[0]?.pago}
                                    >
                                        Capturar
                                    </Button>
                                </div>

                                {photoPago && photoPago.length > 0 && (
                                    <div className="d-flex justify-content-center mb-4" style={{ gap: '10px', flexWrap: 'wrap' }}>
                                        {photoPago.map((url, index) => (
                                            <img
                                                key={index}
                                                src={url}
                                                alt={`Foto Pago ${index + 1}`}
                                                style={{ height: '100px', width: 'auto', borderRadius: '4px' }}
                                            />
                                        ))}
                                    </div>
                                )}

                                <div className="d-flex justify-content-between mt-4">
                                    <Button variant="light" className="btn-light-custom" onClick={prevStep}>
                                        Anterior
                                    </Button>
                                    <Button variant="primary" className="btn-custom" onClick={nextStep}>
                                        Siguiente
                                    </Button>
                                </div>
                            </>
                        )}

                        {/* === Paso 5: Observaciones === */}
                        {currentStep === 5 && (
                            <>
                                <h4 className="section-title text-center">Observaciones</h4>
                                <Form.Group className="mb-3">
                                    <h5 className="label_form">Observaciones hechas del cliente</h5>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        maxLength={70}
                                        placeholder={`Observaciones hechas del cliente`}
                                        value={observations}
                                        onChange={(e) => setObservations(e.target.value)}
                                        className="form-control-custom"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <h5 className="label_form">Observaciones para el administrador</h5>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        maxLength={70}
                                        placeholder={`Observaciones para el administrador`}
                                        value={observationsadmin}
                                        onChange={(e) => setObservationsadmin(e.target.value)}
                                        className="form-control-custom"
                                    />
                                </Form.Group>


                                <div className="d-flex justify-content-between mt-4">
                                    <Button variant="light" className="btn-light-custom" onClick={prevStep}>
                                        Anterior
                                    </Button>
                                    <Button type="submit" variant="success" className="btn-submit-custom" onClick={handleSubmit}>
                                        Guardar
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                </Card.Body>
            </Card>
            <Modal show={showCamera} onHide={() => setShowCamera(true)} style={{ zIndex: 7000 }}>
                <Modal.Header closeButton>
                    <Modal.Title className="text-center w-100" id="modal-contract-title">
                        Capturar Foto {currentPhotoType === 'front' ? 'Frontal' : 'Posterior'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <CameraCapture
                        show={showCamera}
                        onCapture={handlePhotoCapture}
                        onClose={() => setShowCamera(false)}
                    />
                </Modal.Body>

            </Modal>
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
    );

};

export default Createcontract;