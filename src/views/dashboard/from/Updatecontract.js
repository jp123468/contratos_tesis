import React, { useState, useEffect } from 'react';
import { Row, Col, Form, Button, Card, ToastContainer, Toast } from 'react-bootstrap';
import { db } from '../../../firebase/firebase_settings';
import { useParams } from 'react-router-dom';
import { collection, doc, getDoc, updateDoc, getDocs, query, where, addDoc } from 'firebase/firestore';
import { getStorage, ref, uploadString, getDownloadURL } from 'firebase/storage';
import Select from 'react-select';
import CameraCapture from '../CameraCapture';
import { useNavigate } from 'react-router-dom';
import PDFGenerator from '../pdfgenerator';
import './Createcontract.css';


const UpdateContract = () => {
  const [contractCode, setContractCode] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [client, setClient] = useState({ name: '', lastname: '', idnumber: '', phone: '', email: '', birthdate:'' });
  const [headlines, setTitulares] = useState([{ name: '', birthdate: '', idNumber: '', photoFront: '', photoBack: '' }]);
  const [showToast, setShowToast] = useState(false);
  const [photoPago, setPhotoPago] = useState(''); // Inicializar el estado para photoPago
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [selectedServices, setSelectedServices] = useState([]);
  const [valorPactadoHoy, setValorPactadoHoy] = useState('');
  const [ciudadOptions, setCiudadOptions] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState([]);
  const [observations, setObservations] = useState('');
  const [observationsadmin, setObservationsadmin] = useState('');
  const [selectCiudad, setSelectedCiudad] = useState([]);
  const [corrections, setCorrections] = useState('');
  const [serviceOptions, setServiceOptions] = useState([]);
  const [paymentMethodOptions, setPaymentMethodOptions] = useState([]);
  const [contractData, setContractData] = useState(null);
  const [capturedStates, setCapturedStates] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState('');
  const [currentTitularIndex, setCurrentTitularIndex] = useState(null);
  const [currentStep, setCurrentStep] = useState(1); // Start at Step 1
  const [photos, setPhotos] = useState([]);

  const navigate = useNavigate();

  const { id } = useParams();

  const sellerId = localStorage.getItem('userId'); // Obtener el ID del usuario almacenado
  // Función para generar un ID único para el usuario
  const generateRandomId = () => {
    return 'notificacion_' + Math.random().toString(36).substr(2, 9);
  };
  const notificationType = 'Notificación de pago'; // Tipo de notificación



  useEffect(() => {
    fetchOptions();
    if (id) {
      fetchContract(id);
    }
  }, [id]);

  const formatOptions = (optionsObject) => {
    return Object.keys(optionsObject).map((key) => ({
      value: key,
      label: optionsObject[key]
    }));
  };

  const fetchOptions = async () => {
    try {
      const optionsSnapshot = await getDocs(collection(db, 'OptionsSelect'));
      if (!optionsSnapshot.empty) {
        const optionsData = optionsSnapshot.docs[0].data();


        // Asegúrate de que cada campo sea un objeto
        const serviceOptions = formatOptions(optionsData.serviceOptions || {});
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

  const fetchContract = async (id) => {
    console.log('Fetching contract with id:', id);
    try {
      const docRef = doc(db, 'contracts', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setContractData(data);
        setCorrections(data.corrections);
        setClient(data.client);
        setContractCode(data.contractCode);
        setTitulares(data.headlines);
        setSelectedServices(data.services || []);
        setSelectedCiudad(data.ciudad || []);
        setValorPactadoHoy(data.valorPactadoHoy);
        setSelectedPaymentMethod(data.paymentMethod || []);
        setObservations(data.observations || '');
        setObservationsadmin(data.observationsadmin || '');
        if (data.headlines) {
          const initialPhotos = [];
          for (let i = 0; i < data.headlines.length; i++) {
            const titular = data.headlines[i];
            initialPhotos.push({
              front: titular.photoFront || '',
              back: titular.photoBack || ''
            });
          }

          setPhotos(initialPhotos);
        }

        if (data.photoPago) {
          const photoArray = Array.isArray(data.photoPago)
            ? data.photoPago
            : [data.photoPago];
          setPhotoPago(photoArray);
        }

      } else {
        console.warn('No se encontró el contrato con el ID proporcionado.');
      }
    } catch (error) {
      console.error('Error al obtener el contrato:', error);
    }
  };


  const handleUpdateContract = async (event) => {
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
      setToastMessage('El valor pactado hoy es obligatorio.');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }

    if (isNaN(valorPactadoHoy)) {
      setToastMessage('El valor pactado hoy debe ser un número válido.');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }

    if (Number(valorPactadoHoy) < 0) {
      setToastMessage('El valor pactado hoy no puede ser negativo.');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }

    if (selectedPaymentMethod.length === 0) {
      setToastMessage('Debe seleccionar  una forma de pago.');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }
    const sellerId = localStorage.getItem('userId'); // Obtener el ID del usuario almacenado

    try {
      const docRef = doc(db, 'contracts', id);
      await updateDoc(docRef, {
        client: {
          name: client.name,
          lastname: client.lastname,
          idnumber: client.idnumber,
          phone: client.phone,
          email: client.email,
          birthdate: client.birthdate,
        },
        headlines,
        ciudad: selectCiudad,
        photoPago,
        services: selectedServices,
        valorPactadoHoy,
        paymentMethod: selectedPaymentMethod,
        observations,
        observationsadmin,
        corrections
        
      });

      // Mostrar el primer toast
      setToastMessage('Contrato actualizado con éxito.');
      setToastVariant('success');
      setShowToast(true);

      const pdfData = {
        date: currentDate,
        client,
        headlines,
        ciudad: selectCiudad,
        services: selectedServices,
        valorPactadoHoy,
        paymentMethod: selectedPaymentMethod,
        observations,
        uidUsuario: sellerId
      };
      // Generar el PDF usando la función PDFGenerator
      await PDFGenerator(pdfData);
      setToastMessage('Creando PDF, espere un momento');
      setToastVariant('success');
      setShowToast(true);


      setTimeout(() => {
        navigate('/dashboard/table/contracts-table');
      }, 1600);

    } catch (error) {
      console.error('Error al actualizar el contrato: ', error);
      setToastMessage('Error al actualizar el contrato.');
      setToastVariant('danger');
      setShowToast(true);
    }
  };

  const handleTitularChange = (index, e) => {
    const { name, value } = e.target;
    const newHeadlines = [...headlines];
    newHeadlines[index][name] = value;
    setTitulares(newHeadlines);
  };

  const handleAddTitular = () => {
    setTitulares([...headlines, { name: '', birthdate: '', idNumber: '', photoFront: '', photoBack: '' }]);
    setCapturedStates([...capturedStates, { front: false, back: false }]);
  };

  const handleRemoveTitular = (index) => {
    const newHeadlines = headlines.filter((_, i) => i !== index);
    setTitulares(newHeadlines);
    const newCapturedStates = capturedStates.filter((_, i) => i !== index);
    setCapturedStates(newCapturedStates);
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
      filePath = `photos/${titularIdNumber}/front-${timestamp}.jpg`;
      const newCapturedStates = [...capturedStates];
      newCapturedStates[currentTitularIndex].front = true;
      setCapturedStates(newCapturedStates);
    } else if (currentPhotoType === 'back') {
      filePath = `photos/${titularIdNumber}/back-${timestamp}.jpg`;
      const newCapturedStates = [...capturedStates];
      newCapturedStates[currentTitularIndex].back = true;
      setCapturedStates(newCapturedStates);
    } else if (currentPhotoType === 'pago') {
      filePath = `photos/${client.idnumber}/pago-${timestamp}.jpg`;
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
      <Card className="form-card">
        <Card.Header className="d-flex justify-content-between align-items-center card-header-custom">
          <div className="header-title w-100 text-center">
            <h1 className="card-title m-0 w-100 text-center">Editar</h1>
          </div>
          <button
            className="btn btn-link text-danger fs-4"
            onClick={() => navigate('/dashboard/table/contracts-table')}
            style={{ textDecoration: 'none' }}
          >
            &times;
          </button>
        </Card.Header>
        <Card.Body>
          <Form onSubmit={handleUpdateContract}>
            {contractData && (
              <div>
                {currentStep === 1 && (
                  <div>
                    <h4>Correcciones a Realizar</h4>
                    <h5 className='data-value'>{corrections}</h5>
                    <hr />
                    <h4 className='text-center' >Detalles del Contrato</h4>
                    {/* Código del contrato: h5 + h6 en la misma línea */}
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="mb-0">Código del Contrato:</h5>
                      <h6 className="data-value mb-0">{contractCode}</h6>
                    </div>
                    {/* Cliente */}
                    <h4 className='text-center'> Detalle del Cliente</h4>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="mb-0"> Nombre:</h5>
                      <h6 className="data-value mb-0"> {client.name} {client.lastname}</h6>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <h5 className="mb-0"> Cédula:</h5>
                      <h6 className="data-value mb-0"> {client.idnumber}</h6>
                    </div>
                    <div className="d-flex justify-content-end mt-4">
                      <Button variant="primary" className="btn-custom" onClick={nextStep}>
                        Siguiente
                      </Button>
                    </div>
                  </div>

                )}
              </div>
            )}
            {/* === Paso 2: Titulares === */}
            {currentStep === 2 && (
              <>
                <div>
                  <h4 className="section-title text-center" style={{ color: '#0817ba' }}>Titulares </h4>
                  <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                    Puedes agregar un maximo de 3 beneficiarios adicionales con el nombre de "Titulares".
                  </p>
                </div>
                {headlines.map((titular, index) => (
                  <div key={index} className="titular-section">
                    <Form.Group className="mb-3">
                      <h5 className="label_form">Nombre</h5>
                      <Form.Control
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
                        placeholder="Número de cédula del titular"
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
                <h4 className="section-title text-center" style={{ color: '#0817ba' }} >CIUDAD Y SERVICIO</h4>
                <Form.Group className="mb-3">
                  <h5 className="label_form">Ciudad</h5>
                  <Select
                    options={ciudadOptions}
                    value={selectCiudad}
                    onChange={(selected) => setSelectedCiudad(selected)}
                    classNamePrefix="react-select-custom"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <h5 className="label_form">Servicio</h5>
                  <Select
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
                <h4 className="section-title mt-4 text-center" style={{ color: '#0817ba' }}>VALORES</h4>
                <Form.Group className="mb-3">
                  <h5 className="label_form">Valor Pactado Hoy</h5>
                  <Form.Control
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
                    options={paymentMethodOptions}
                    value={selectedPaymentMethod}
                    onChange={(selected) => setSelectedPaymentMethod(selected)}
                    classNamePrefix="react-select-custom"
                  />
                </Form.Group>
                <div className="d-flex justify-content-center mb-3">
                  <h5 style={{ fontWeight: '700', marginTop: '7px', marginRight: '27px' }}>Foto Pago:</h5>

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
                <h4 className="section-title text-center" style={{ color: '#0817ba' }}>OBSERVACIONES</h4>
                <Form.Group className="mb-3">
                  <h5 className="label_form">Observaciones hechas del cliente</h5>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    maxLength={70}
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
                    value={observationsadmin}
                    onChange={(a) => setObservationsadmin(a.target.value)}
                    className="form-control-custom"
                  />
                </Form.Group>

                <div className="d-flex justify-content-between mt-4">
                  <Button variant="light" className="btn-light-custom" onClick={prevStep}>
                    Anterior
                  </Button>
                  <Button type="submit" variant="success" className="btn-submit-custom" onClick={handleUpdateContract}>
                    Actualizar
                  </Button>
                </div>
              </>
            )}
          </Form>
        </Card.Body>
      </Card>


      {showCamera && (
        <CameraCapture
          show={showCamera}
          onCapture={handlePhotoCapture}
          onClose={() => setShowCamera(false)}
        />
      )}
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

export default UpdateContract;