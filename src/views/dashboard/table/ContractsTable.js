import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Row, Col, Table, Button, Modal, ToastContainer, Toast, Form } from 'react-bootstrap';
import Card from '../../../components/Card';
import { Link, useLocation, Route } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, storage } from '../../../firebase/firebase_settings'; // Ajusta la ruta si es necesario
import PDFGenerator from "../pdfgenerator";
import SignaturePad from "react-signature-canvas"; // Importa la biblioteca para la firma
import { uploadBytes, ref, uploadString, getDownloadURL, deleteObject } from "firebase/storage"; // Importar Firebase Storage
import emailjs from 'emailjs-com';
import { FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import './client.css';

const ContractsTable = () => { // Asegúrate de pasar el objeto 'storage'
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success'); // 'success' or 'danger'
  const [contractApprovals, setContractApprovals] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false); // Estado para el modal de confirmación de eliminación
  const [userRole, setUserRole] = useState(null); // Almacena el rol del usuario
  const location = useLocation();
  const sellerId = localStorage.getItem('userId'); // Obtener el ID del usuario almacenado
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false); // Nuevo estado para bloquear el botón después de guardar
  const navigate = useNavigate();
  const signatureRef = useRef({});
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractToDelete, setContractToDelete] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState('');
  const fetchContracts = async () => {
    try {
      if (!sellerId) {
        setError('No se pudo obtener el ID del vendedor.');
        setLoading(false);
        return;
      }

      const userDoc = doc(db, "users", sellerId);
      const userSnapshot = await getDoc(userDoc);
      const userRole = userSnapshot.exists() ? userSnapshot.data().role : null;

      if (!userRole) {
        setToastMessage('No se pudo obtener el rol del usuario.');
        setToastVariant('danger');
        setShowToast(true);
        setLoading(false);
        return;
      }
      setUserRole(userRole);

      // Inicializar la consulta
      let q;
      if (userRole === "admin") {
        q = query(collection(db, 'contracts')); // Obtener todos los contratos sin filtrar
      } else if (userRole === "vendedor") {
        q = query(collection(db, 'contracts'), where('id_vent', '==', sellerId)); // Obtener contratos solo del usuario
      }

      const querySnapshot = await getDocs(q);

      const contractsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Contratos obtenidos:', contractsData);

      // Ordenar contratos por código de contrato
      contractsData.sort((a, b) => a.contractCode.localeCompare(b.contractCode));
      // Obtener aprobaciones de contratos
      const approvals = {};
      for (const contract of contractsData) {
        const contractRef = doc(db, 'contracts', contract.id);
        const contractSnap = await getDoc(contractRef);
        if (contractSnap.exists()) {
          approvals[contract.id] = contractSnap.data().approved || false; // Almacenar el estado de aprobado
        }
      }

      setContracts(contractsData);
      setContractApprovals(approvals);
      // Obtener aprobaciones de contratos

      setContracts(contractsData);
    } catch (err) {
      setToastMessage('No hay contratos.');
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
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
  useEffect(() => {
    fetchContracts();
  }, []);

  const handleShowDetails = async (contractId) => {
    console.log('Contract ID:', contractId);

    try {
      const contractDoc = doc(db, "contracts", contractId);
      const contractSnapshot = await getDoc(contractDoc);

      if (contractSnapshot.exists()) {
        const contractData = contractSnapshot.data();

        // Traer datos completos del cliente
        let fullClientData = contractData.client;

        if (contractData.client?.idnumber) {
          const clientsRef = collection(db, "clients");
          const q = query(clientsRef, where("idnumber", "==", contractData.client.idnumber));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
            fullClientData = querySnapshot.docs[0].data();
          }
        }

        setSelectedContract({
          id: contractId,
          ...contractData,
          client: fullClientData, // Ahora con todos los campos del cliente
        });

        setShowDetailsModal(true);
      } else {
        setToastMessage('Contrato no encontrado.');
        setToastVariant('danger');
        setShowToast(true);
      }
    } catch (error) {
      console.error("Error fetching contract details: ", error);
      setToastMessage('Error al obtener detalles del contrato.');
      setToastVariant('danger');
      setShowToast(true);
    }
  };


  const renderHeadlines = (headlines) => {
    return headlines.map((headline, index) => (
      <div key={index}>
        Nombre: {headline.name} <br />
        Cédula: {headline.idNumber}
        {index < headlines.length - 1 ? ', ' : ''}
      </div>
    ));
  };

  const renderServices = (services) => {
    if (!Array.isArray(services)) {
      return null;

    }
    return services.map((service, index) => (
      <div key={index}>
        {service.label}
        {index < services.length - 1 ? ', ' : ''}
      </div>
    ));
  };

  const renderpaymentMethod = (paymentMethod) => {
    if (paymentMethod && typeof paymentMethod === 'object') {
      return <div>{paymentMethod.label}</div>;
    }
    return null;
  };


  const sendContractEmail = async (contract, pdfURL) => {
    console.log(contract.client.name,  // Nombre del cliente
      contract.client.email,  // Email del cliente
    )
    try {

      // Prepara los parámetros para la plantilla de EmailJS
      const templateParams = {
        to_name: contract.client.name,  // Nombre del cliente
        client_email: contract.client.email,  // Email del cliente
        message: `Le envio a su correo personal una copia del contrato numero  ${contract.contractCodeaprov}  del cliente ${contract.client.name} ${contract.client.lastname} 
        que se encuentra en el siguiente enlace:  ${pdfURL}`,
      };
      const templateParams2 = {
        to_name: "Stroit-Corp",
        client_email: "rafmelo404@gmail.com",
        message: `Le envio a su correo personal una copia del contrato numero  ${contract.contractCodeaprov}  del cliente ${contract.client.name} ${contract.client.lastname} 
        que se encuentra en el siguiente enlace:  ${pdfURL}`,
      }

      // Envía el correo usando EmailJS
      await emailjs.send(
        'service_xr7jazi',         // Reemplaza con tu service_id
        'template_lmzcndh',        // Reemplaza con tu template_id
        templateParams,
        'EqZz6dEmjzDkT6r64'       // Reemplaza con tu public_key
      );
      setToastMessage('Correo enviado exitosamente');
      setToastVariant('success');
      setShowToast(true);

      await emailjs.send(
        'service_xr7jazi',         // Reemplaza con tu service_id
        'template_lmzcndh',        // Reemplaza con tu template_id
        templateParams2,
        'EqZz6dEmjzDkT6r64'       // Reemplaza con tu public_key
      );

    } catch (error) {
      console.error("Error al enviar correo:", error);
    }

  };

  const approveContract = async (contract, firmaBase64) => {
    try {
      if (!firmaBase64 || typeof firmaBase64 !== "string") {
        throw new Error("La firma del cliente no es válida o está vacía.");
      }

      const contractRef = doc(db, "contracts", contract.id);

      // Guarda directamente el Base64 de la firma
      await updateDoc(contractRef, {
        signatureUrl: firmaBase64,
      });

      const updatedContractSnapshot = await getDoc(contractRef);

      if (updatedContractSnapshot.exists()) {
        const updatedContract = {
          id: contract.id,
          ...updatedContractSnapshot.data(),
        };

        await generatePDF(updatedContract);

        setToastMessage('Contrato generado y PDF creado exitosamente');
        setToastVariant('success');
        setShowToast(true);
      } else {
        throw new Error('El contrato no existe en la base de datos.');
      }
    } catch (error) {
      console.error("Error al aprobar contrato:", error);
      setToastMessage(error.message || 'Error al aprobar contrato');
      setToastVariant('danger');
      setShowToast(true);
    }
  };

  const generatePDF = async (contract) => {
    try {
      if (!contract.id) {
        throw new Error('El contrato no tiene un ID válido.');
      }

      const nextContractCode = await getNextContractCodeaprov();
      const updatedContract = { ...contract, contractCodeaprov: nextContractCode };

      const contractRef = doc(db, "contracts", updatedContract.id);
      await updateDoc(contractRef, { contractCodeaprov: nextContractCode });

      console.log("Validando firma...", updatedContract.signatureUrl);

      if (
        !updatedContract.signatureUrl ||
        typeof updatedContract.signatureUrl !== 'string' ||
        !updatedContract.signatureUrl.startsWith('data:image')
      ) {
        console.error("Firma inválida:", updatedContract.signatureUrl);
        throw new Error('La firma no está en formato Base64 válido.');
      }


      const pdfData = prepareContractDataForPDF(updatedContract);
      setToastMessage('Generando el PDF y enviando por correo.');
      setToastVariant('success');
      setShowToast(true);
      const pdfBlob = await PDFGenerator(pdfData);

      const storageRef = ref(storage, `pdfs/${updatedContract.contractCodeaprov}.pdf`);
      const uploadTask = await uploadBytes(storageRef, pdfBlob, {
        contentType: 'application/pdf',
      });

      const pdfUrl = await getDownloadURL(uploadTask.ref);

       await sendContractEmail(updatedContract, pdfUrl);
    } catch (error) {
      console.error("Error al generar el PDF y enviarlo por correo:", error);
      setToastMessage('Error al generar el PDF y enviarlo por correo.');
      setToastVariant('danger');
      setShowToast(true);
    }
  };

  const handleSaveSignature = async () => {
    if (signatureRef.current.isEmpty()) {
      setToastMessage('Por favor, firme antes de guardar.');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }

    const signatureDataUrl = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
    setIsSaving(true);

    try {
      await approveContract(selectedContract, signatureDataUrl);

      // Cierra el modal y marca como guardado
      setShowSignatureModal(false);
      setIsSaved(false);

      // Mostrar mensaje de generación de PDF
      setToastMessage('Generando PDF... La página se actualizará en breve.');
      setToastVariant('success');
      setShowToast(true);

      // Espera un momento para que se vea el toast
      setTimeout(() => {
        window.location.reload(); // Refresca la pantalla
      }, 2500); // 2.5 segundos visibles antes del reload
    } catch (error) {
      console.error("Error al guardar la firma:", error);
      setToastMessage('Error al guardar la firma');
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteContract = async (contractId) => {
    try {
      // Obtener la referencia al documento del contrato
      const contractRef = doc(db, "contracts", contractId);

      // Obtener el contrato para acceder a la URL de los archivos
      const contractSnapshot = await getDoc(contractRef);
      if (contractSnapshot.exists()) {
        const contractData = contractSnapshot.data();
        // Validar contractCodeaprov
        if (contractData.contractCodeaprov != "0") {
          setToastMessage('No se puede eliminar contratos aprobados');
          setToastVariant('danger');
          setShowToast(true);
          return; // Salir de la función si  hay contractCodeaprov
        }
        // Si el contrato tiene un archivo (por ejemplo, fileUrl), eliminar el archivo de Firebase Storage
        if (contractData.fileUrl) {
          await deleteContractFiles(contractData.fileUrl);
          console.log(`Archivo ${contractData.fileUrl} eliminado correctamente.`);
        }

        // Eliminar el documento del contrato de Firestore
        await deleteDoc(contractRef);

        // Mostrar un mensaje de éxito en el Toast
        setToastMessage('Contrato y archivo eliminados exitosamente');
        setToastVariant('success');
        setShowToast(true);
        fetchContracts();

      } else {
        // Si el contrato no existe
        setToastMessage('El contrato no existe en la base de datos');
        setToastVariant('danger');
        setShowToast(true);
      }
    } catch (error) {
      // Manejo de errores
      console.error("Error al eliminar el contrato:", error);
      setToastMessage('Error al eliminar el contrato');
      setToastVariant('danger');
      setShowToast(true);
    }
  };


  const deleteContractFiles = async (fileUrl) => {
    try {
      const fileRef = ref(storage, fileUrl);
      await deleteObject(fileRef);
      console.log(`Archivo en ${fileUrl} eliminado correctamente.`);
    } catch (error) {
      console.error("Error al eliminar el archivo:", error);
    }
  };

  const getNextContractCodeaprov = async () => {
    try {
      // Definir la consulta para obtener todos los contratos ordenados por `contractCodeaprov`
      const q = query(collection(db, 'contracts'));

      // Ejecutar la consulta
      const querySnapshot = await getDocs(q);

      let maxCode = 0; // Inicializar maxCode

      // Iterar sobre los documentos para encontrar el máximo código
      querySnapshot.forEach((doc) => {
        const data = doc.data();

        // Verificar que contractCodeaprov exista y sea un string no vacío
        if (data.contractCodeaprov && typeof data.contractCodeaprov === 'string') {
          const code = parseInt(data.contractCodeaprov, 10); // Convertir a número

          // Verificar que la conversión sea exitosa
          if (!isNaN(code)) {
            // Actualizar el valor de maxCode si este código es mayor
            if (code > maxCode) {
              maxCode = code;
            }
          } else {
            console.log('No se pudo convertir contractCodeaprov a número:', data.contractCodeaprov);
          }
        } else {
          console.log('contractCodeaprov no es un string válido:', data.contractCodeaprov);
        }
      });

      // Incrementar maxCode en 1 para obtener el próximo código
      const nextCode = maxCode + 1;

      // Retornar el próximo código, asegurándose de que tenga un formato de 6 dígitos
      return nextCode.toString().padStart(6, '0');
    } catch (error) {
      console.error('Error al obtener el próximo código de contrato: ', error);
      setToastMessage('Error al obtener el próximo código de contrato');
      setToastVariant('danger');
    }
  };


  const uploadSignatureToStorage = async (signatureDataUrl) => {
    const timestamp = Date.now(); // Usar un timestamp único
    const filePath = `firmas/${sellerId}/${timestamp}-signature.png`; // Cambié el formato a PNG para soportar transparencia
    const storageRef = ref(storage, filePath);

    try {
      // Subir la firma en formato base64 a Firebase Storage
      await uploadString(storageRef, signatureDataUrl, "data_url");
      console.error("Imagen Subida", error);

      // Obtener la URL de descarga
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error al subir la firma a Storage:", error);
      throw error;
    }
  };



  const handleShowSignatureModal = (contract) => {
    setSelectedContract(contract);
    setShowSignatureModal(true);
  };



  const handleDelete = async (contractId) => {
    if (!contractId) {
      console.error("ID de contrato no definido");
      setToastMessage('Error interno: contrato inválido');
      setToastVariant('danger');
      setShowToast(true);
      return;
    }

    await deleteContract(contractId); // tu función existente
    setShowDeleteModal(false); // Cerrar el modal después de eliminar
    setShowDetailsModal(false); // También cerrar el modal de detalles si es necesario
  };


  const prepareContractDataForPDF = (contract) => {

    return {
      id: contract.id,
      contractCodeaprov: contract.contractCodeaprov,
      client: {
        name: contract.client?.name,
        lastname: contract.client?.lastname,
        idnumber: contract.client?.idnumber,
        birthdate: contract.client?.birthdate,
        address: contract.client?.address,
        email: contract.client?.email,
        phone: contract.client?.phone
      },
      date: contract.date,
      observations: contract.observations,
      observationsadmin: contract.observationsadmin,
      ciudad: {
        label: contract.ciudad?.label
      },
      paymentMethod: {
        label: contract.paymentMethod?.label
      },
      valorPactadoHoy: contract.valorPactadoHoy,
      services: contract.services?.map(service => ({
        label: service.label
      })),
      headlines: contract.headlines?.map(headline => ({
        name: headline.name,
        idNumber: headline.idNumber,
        birthdate: headline.birthdate,
        photoFront: headline.photoFront,
        photoBack: headline.photoBack
      })),
      firmas: contract.signatureUrl // Firma del contracto
    };
  };

  const filteredContracts = contracts.filter((contract) => {
    const fullName = `${contract.client.name} ${contract.client.lastname}`.toLowerCase();
    const code = contract.contractCode?.toLowerCase() || '';

    const services = Array.isArray(contract.services)
      ? contract.services.map(service => service.label || service.name || '').join(' ').toLowerCase()
      : '';

    const term = searchTerm.toLowerCase();

    // Dividir la fecha en partes (si existe)
    let year = '', month = '', day = '';
    if (contract.date) {
      const dateParts = contract.date.split('-'); // ["2025", "06", "13"]
      if (dateParts.length === 3) {
        [year, month, day] = dateParts;
      }
    }

    return (
      fullName.includes(term) ||
      code.includes(term) ||
      services.includes(term) ||
      year.includes(term) ||
      month.includes(term) ||
      day.includes(term)
    );
  });
  const fetchClientPhotos = async (idnumber) => {
    try {
      const clientQuery = query(
        collection(db, 'clients'),
        where('idnumber', '==', idnumber)
      );
      const querySnapshot = await getDocs(clientQuery);

      if (!querySnapshot.empty) {
        const clientData = querySnapshot.docs[0].data();
        return {
          photoFront: clientData.photoFront || null,
          photoBack: clientData.photoBack || null,
        };
      } else {
        console.warn('Cliente no encontrado');
        return { photoFront: null, photoBack: null };
      }
    } catch (err) {
      console.error('Error al obtener fotos del cliente: ', err);
      return { photoFront: null, photoBack: null };
    }
  };
  useEffect(() => {
    const fetchPhotosForSelectedContract = async () => {
      if (selectedContract?.client?.idnumber) {
        const clientPhotos = await fetchClientPhotos(selectedContract.client.idnumber);

        setSelectedContract((prevContract) => ({
          ...prevContract,
          client: {
            ...prevContract.client,
            photoFront: clientPhotos.photoFront,
            photoBack: clientPhotos.photoBack,
          },
        }));
      }
    };

    fetchPhotosForSelectedContract();
  }, [selectedContract]);


  return (
    <>
      <Row>
        <Col sm="12">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-start flex-column flex-md-row">
              <div className="header-title">
                <h4 className="card-title">Lista de Contratos</h4>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                  Este módulo permite gestionar los diversos contratos que creas.
                </p>
              </div>
              <Link
                to="/dashboard/contract/Createcontract"
                className={`btn btn-info d-inline-flex align-items-center mt-3 mt-md-0 ${location.pathname === '/dashboard/contract/Createcontract' ? 'active' : ''}`}
                aria-label="Crear contrato"
              >
                <FaPlus className="me-2" />
                Nuevo contrato
              </Link>
            </Card.Header>

            {/* Buscador justo aquí */}
            <div className="px-4 pt-3">
              <div className="input-group mb-3">
                <span className="input-group-text" id="search-input">
                  <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                    <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                  </svg>
                </span>
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  type="search"
                  className="form-control"
                  placeholder="Buscar por (código, nombres, fecha o servicios )"
                />
              </div>
            </div>

            <Card.Body className="p-0">
              <div className="table-responsive mt-0">
                {loading ? (
                  <div className="p-3">Cargando...</div>
                ) : error ? (
                  <div className="p-3">{error}</div>
                ) : (
                  <Table striped id="basic-table" className="mb-0" role="grid">
                    <thead>
                      <tr>
                        <th>Estado</th>
                        <th>Código</th>
                        <th>Fecha</th>
                        <th>Cliente</th>
                        <th>Servicios</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredContracts.length > 0 ? (
                        filteredContracts.map((contract) => (
                          <tr key={contract.id}>
                            <td>{contract.approved ? 'Aprobado' : 'Por Aprobar'}</td>
                            <td>{contract.contractCode}</td>
                            <td>{contract.date}</td>
                            <td>{contract.client.name} {contract.client.lastname}</td>
                            <td>{renderServices(contract.services)}</td>
                            <td>
                              <Button
                                variant="link"
                                onClick={() => handleShowDetails(contract.id)}
                                aria-label="See"
                                title="Ver detalles"
                              >
                                <FaEye />
                              </Button>
                              <Button
                                variant="link"
                                onClick={() => navigate(`/dashboard/contract/updatecontract/${contract.id}`)}
                                aria-label="Edit"
                                title="Editar contrato"
                                disabled={contract.approved === true} // ✅ Se deshabilita si está aprobado
                              >
                                <FaEdit />
                              </Button>

                              {userRole === 'admin' && (
                                <Button
                                  variant="link"
                                  onClick={() => {
                                    setContractToDelete(contract.id); // guarda el id del contrato
                                    setShowDeleteModal(true);        // muestra el modal
                                  }}
                                  aria-label="Delete"
                                  title="Eliminar contrato"
                                  disabled={contract.approved === true} // ✅ Se deshabilita si está aprobado
                                >
                                  <FaTrash />
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="8" className="text-center" style={{ padding: '8px' }}>
                            No se encontraron Contratos
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                )}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Modal
        show={showDetailsModal}
        onHide={() => setShowDetailsModal(false)}
        size="xl"
        centered
        aria-labelledby="modal-contract-title"
      >
        <Modal.Header closeButton>
          <Modal.Title className="text-center w-100" id="modal-contract-title">Detalles</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <div
            className="container-fluid"
            style={{ maxHeight: '500px', overflowY: 'auto', overflowX: 'hidden' }}
          >
            {selectedContract ? (
              <div className="row gx-4 gy-3">

                {/* Columna 1: Cliente */}
                <div className="col-12 col-md-6">
                  <h4 style={{ color: '#0817ba' }}>Datos del Cliente</h4>
                  <h5>Nombre:</h5>
                  <h6 className="data-value">{selectedContract.client.name} {selectedContract.client.lastname}</h6>

                  <h5>Cédula:</h5>
                  <h6 className="data-value">{selectedContract.client.idnumber}</h6>

                  <h5>Correo:</h5>
                  <h6 className="data-value">{selectedContract.client.email}</h6>

                  <h5>Teléfono:</h5>
                  <h6 className="data-value">{selectedContract.client.phone}</h6>

                  <h5>Dirección:</h5>
                  <h6 className="data-value">{selectedContract.client.address}</h6>

                  <h5>Fecha de nacimiento:</h5>
                  <h6 className="data-value">{selectedContract.client.birthdate}</h6>

                  <h5>Fotos de la Cédula del cliente</h5>
                  <div className="d-flex gap-3 flex-wrap">
                    {selectedContract.client.photoFront ? (
                      <div>
                        <h6 className="data-value">Parte Frontal:</h6>
                        <img
                          src={selectedContract.client.photoFront}
                          alt="Cédula Parte Frontal"
                          style={{ width: '100px', cursor: 'pointer' }}
                          onClick={() => handleImageClick(selectedContract.client.photoFront)}

                        />
                      </div>
                    ) : <h6 className="data-value">Sin foto frontal</h6>}

                    {selectedContract.client.photoBack ? (
                      <div>
                        <h6 className="data-value">Parte Trasera:</h6>
                        <img
                          src={selectedContract.client.photoBack}
                          alt="Cédula Parte Trasera"
                          style={{ width: '100px', cursor: 'pointer' }}
                          onClick={() => handleImageClick(selectedContract.client.photoBack)}

                        />
                      </div>
                    ) : <h6 className="data-value">Sin foto trasera</h6>}
                  </div>
                </div>

                {/* Columna 2: Contrato */}
                <div className="col-12 col-md-6">
                  <h4 style={{ color: '#0817ba' }}>Información del Contrato</h4>
                  <h5>Código:</h5>
                  <h6 className="data-value">{selectedContract.contractCode}</h6>

                  <h5>Ciudad:</h5>
                  <h6 className="data-value">{selectedContract.ciudad?.label}</h6>

                  <h5>Fecha del contrato:</h5>
                  <h6 className="data-value">{selectedContract.date}</h6>

                  <h5>Servicios Contratados:</h5>
                  {Array.isArray(selectedContract.services) && selectedContract.services.length > 0 ? (
                    <ul>
                      {selectedContract.services.map((service, idx) => (
                        <li key={idx}>
                          <h6 className="data-value">{service.label || service}</h6>
                        </li>
                      ))}
                    </ul>
                  ) : <h6 className="data-value">No hay servicios disponibles.</h6>}

                  <h5>Método de pago:</h5>
                  <h6 className="data-value">{selectedContract.paymentMethod?.label}</h6>

                  <h5>Valor pactado hoy:</h5>
                  <h6 className="data-value">${selectedContract.valorPactadoHoy}</h6>

                  <h5>Foto del Pago:</h5>
                  <div className="d-flex flex-wrap gap-2">
                    {Array.isArray(selectedContract.photoPago) && selectedContract.photoPago.length > 0 ? (
                      selectedContract.photoPago.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Pago ${i + 1}`}
                          style={{ width: '100px', cursor: 'pointer' }}
                          onClick={() => handleImageClick(selectedContract.photoPago)}

                        />
                      ))
                    ) : <h6 className="data-value">No hay fotos de pago disponibles.</h6>}
                  </div>
                </div>

                {/* Titulares */}
                <div className="col-12">
                  <h4 className="text-center" style={{ color: '#0817ba' }}>Titulares</h4>
                  {selectedContract.headlines && selectedContract.headlines.length > 0 ? (
                    selectedContract.headlines.map((titular, i) => (
                      <div key={i} className="mb-3">
                        <h5>Titular:</h5>
                        <h6 className="data-value">{titular.name}</h6>

                        <h5>Cédula:</h5>
                        <h6 className="data-value">{titular.idNumber}</h6>

                        <h5>Fotos de la Cédula del Titular {i + 1}</h5>
                        <div className="d-flex gap-3 align-items-center flex-wrap">
                          {titular.photoFront ? (
                            <div className="text-center">
                              <h6 className="data-value">Parte Frontal:</h6>
                              <img
                                src={titular.photoFront}
                                alt="Titular Foto Frontal"
                                style={{ width: '80px', cursor: 'pointer' }}
                                onClick={() => handleImageClick(titular.photoFront)}

                              />
                            </div>
                          ) : (
                            <h6 className="data-value">Sin foto frontal</h6>
                          )}

                          {titular.photoBack ? (
                            <div className="text-center">
                              <h6 className="data-value">Parte Trasera:</h6>
                              <img
                                src={titular.photoBack}
                                alt="Titular Foto Trasera"
                                style={{ width: '80px', cursor: 'pointer' }}
                                onClick={() => handleImageClick(titular.photoBack)}

                              />
                            </div>
                          ) : (
                            <h6 className="data-value">Sin foto trasera</h6>
                          )}
                        </div>
                      </div>
                    ))
                  ) : <h5 className="data-value">No hay titulares disponibles.</h5>}
                </div>

                {/* Observaciones */}
                <div className="col-12">
                  <h4 className="text-center" style={{ color: '#0817ba' }}>Observaciones</h4>

                  <h5>Observaciones del cliente:</h5>
                  <h6 className="data-value">{selectedContract.observations || 'Sin observaciones.'}</h6>

                  <h5>Observaciones para el administrador:</h5>
                  <h6 className="data-value">{selectedContract.observationsadmin || 'Sin observaciones.'}</h6>

                  <h5>Correcciones del administrador:</h5>
                  <h6 className="data-value">{selectedContract.corrections || 'Sin correcciones.'}</h6>
                </div>
              </div>
            ) : (
              <div className="text-center">
                No se encontraron contratos.
              </div>
            )}
          </div>
        </Modal.Body>

        {/* Botones propios del showDetailsModal */}
        {selectedContract && (
          <Modal.Footer className="justify-content-center gap-3">
            {selectedContract.approved && (
              <Button
                variant="success"
                onClick={() => setShowSignatureModal(true)}
                disabled={
                  isSaving || isSaved || !!selectedContract.signatureUrl // Aquí se añade la validación
                }
              >
                {selectedContract.signatureUrl
                  ? "Contrato ya firmado"
                  : isSaving
                    ? "Guardando..."
                    : isSaved
                      ? "Firma Guardada"
                      : "Firmar Contrato"}
              </Button>
            )}
          </Modal.Footer>
        )}

      </Modal>



      {/* Modal de Firma */}
      <Modal show={showSignatureModal} onHide={() => setShowSignatureModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title className="text-center w-100" id="modal-contract-title">
            Firma del Contrato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ position: 'relative', width: '400px', height: '200px' }}>
            {/* Margen límite visual */}
            <div
              style={{
                position: 'absolute',
                top: '5px', // Ajusta según necesites
                left: '5px', // Ajusta según necesites
                right: '5px', // Ajusta según necesites
                bottom: '5px', // Ajusta según necesites
                border: '2px dashed red', // Estilo del borde límite
                pointerEvents: 'none' // Para que el borde no interfiera con la firma
              }}
            />
            <SignaturePad
              ref={signatureRef}
              canvasProps={{ className: "signatureCanvas", width: 400, height: 200 }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={handleSaveSignature}
            disabled={isSaving || isSaved} // Deshabilita si está guardando o ya está guardado
          >
            {isSaving ? "Guardando..." : isSaved ? "Firma Guardada" : "Guardar Firma"}
          </Button>
        </Modal.Footer>
      </Modal>
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
            Vista de Imagen</Modal.Title>
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
      {/* Modal de confirmación para eliminar */}
      <div className="d-flex justify-content-center mb-5 gap-2">
        <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
          <Modal.Header closeButton>
            <Modal.Title className="w-100 text-center">
              Confirmar Eliminación</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            ¿Estás seguro de que deseas eliminar este contrato?
          </Modal.Body>
          <Modal.Footer className="d-flex justify-content-center">
            <Button variant="danger" onClick={() => handleDelete(contractToDelete)}>
              Confirmar Eliminación
            </Button>
          </Modal.Footer>
        </Modal>
      </div>


      <ToastContainer position="top-end" className="p-3 " style={{ zIndex: 9999 }}>
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
    </>
  );
};

export default ContractsTable;