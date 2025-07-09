import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Modal, ToastContainer, Toast, Form } from 'react-bootstrap';
import Card from '../../../components/Card';
import { Link, useLocation, Route } from 'react-router-dom';
import { collection, getDocs, doc, addDoc, updateDoc, arrayUnion, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase_settings';
import PDFGenerator from "../pdfgenerator";
import './admin.css';
const Admin = () => {

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('todos'); // 'todos', 'true', 'false'

    const [selectedContract, setSelectedContract] = useState(null);
    const [corrections, setCorrections] = useState('');

    const [show, setShow] = useState(false);
    const handleShow = () => setShow(true);
    const handleClose = () => setShow(false);

    const [showModal, setShowModal] = useState(false);
    const [modalImage, setModalImage] = useState('');
    const [showContractModal, setShowContractModal] = useState(false); // para abrir/cerrar el modal principal
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const UserIdact = localStorage.getItem('userId'); // Obtener el ID del usuario almacenado


    const handleImageClick = (imageUrl) => {
        setModalImage(imageUrl);
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setModalImage('');
    };

    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    const location = useLocation();

    function calculateAge(birthdateString) {
        const [day, month, year] = birthdateString.split('/').map(Number);
        const birthDate = new Date(year, month - 1, day);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age;
    }

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, 'contracts'));

                const contractsData = await Promise.all(
                    querySnapshot.docs.map(async (doc) => {
                        const contractData = {
                            id: doc.id,
                            ...doc.data(),
                        };

                        try {
                            const clientIdNumber = contractData.client?.idnumber;

                            if (clientIdNumber) {
                                const clientQuery = query(
                                    collection(db, 'clients'),
                                    where('idnumber', '==', clientIdNumber)
                                );
                                const clientSnapshot = await getDocs(clientQuery);

                                if (!clientSnapshot.empty) {
                                    const clientData = clientSnapshot.docs[0].data();

                                    const age = clientData.birthdate
                                        ? calculateAge(clientData.birthdate)
                                        : null;

                                    contractData.client = {
                                        ...contractData.client,
                                        ...clientData,
                                        age, // Agregamos la edad calculada
                                    };
                                }
                            }
                        } catch (clientErr) {
                            console.warn('Error al obtener datos del cliente:', clientErr);
                        }

                        return contractData;
                    })
                );

                contractsData.sort((a, b) =>
                    a.contractCode.localeCompare(b.contractCode)
                );

                setContracts(contractsData);
            } catch (err) {
                console.error('Error al obtener contratos: ', err);
                setToastMessage('No hay contratos.');
                setToastVariant('danger');
                setShowToast(true);
            } finally {
                setLoading(false);
            }
        };

        fetchContracts();
    }, []);


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


    const handleCloseContractModal = () => {
        setShowContractModal(false);
    };
    const handleReject = async () => {
        if (selectedContract) {
            try {
                const contractRef = doc(db, "contracts", selectedContract.id);

                // Actualizar el contrato con las correcciones
                await updateDoc(contractRef, {
                    corrections: corrections
                });

                // Obtener el ID del usuario
                const userId = selectedContract.id_vent;

                const client = selectedContract.client;
                const clientName = client ? `${client.name} ${client.lastname}` : null;

                // Validar que los datos sean válidos antes de registrar la notificación
                if (!clientName || !userId) {
                    console.error("Faltan campos obligatorios: clientName o userId.");
                    setToastMessage('No se pudo agregar la corrección, faltan datos obligatorios.');
                    setToastVariant('danger');
                    setShowToast(true);
                    return;
                }

                // Actualizar el estado de los contratos localmente
                setContracts(prevContracts =>
                    prevContracts.map(c =>
                        c.id === selectedContract.id
                            ? { ...c, corrections }
                            : c
                    )
                );

                setToastMessage('Corrección agregada correctamente.');
                setToastVariant('success');
                setShowToast(true);

                handleClose();
            } catch (error) {
                console.error("Error rechazando el contrato:", error);
                setToastMessage('Error al agregar la corrección.');
                setToastVariant('danger');
                setShowToast(true);
            }
        }
    };

    const approveContract = async (contract) => {
        try {

            const currentUser = JSON.parse(localStorage.getItem("currentUser"));
            const currentUserId = currentUser?.id;
            console.log(UserIdact)
            console.log(contract.id_vent)
            // Validar que no apruebe su propio contrato
            if (UserIdact === contract.id_vent) {
                setToastMessage('No puedes aprobar tu propio contrato.');
                setToastVariant('danger');
                setShowToast(true);
                return;
            }

            const contractRef = doc(db, "contracts", contract.id);
            await updateDoc(contractRef, {
                approved: true,
                corrections: ''
            });

            // Actualiza el estado localmente
            setContracts(prevContracts =>
                prevContracts.map(c =>
                    c.id === contract.id ? { ...c, approved: true, corrections: '' } : c
                )
            );

            // Obtener el ID del usuario y el cliente
            const userId = contract.id_vent;
            const client = contract.client;
            const clientName = client ? `${client.name} ${client.lastname}` : null;

            if (!clientName || !userId) {
                console.error("Faltan campos obligatorios: clientName o userId.");
                return;
            }

            setToastMessage('Contrato aprobado correctamente.');
            setToastVariant('success');
            setShowToast(true);
            setIsApproveModalOpen(false);

        } catch (error) {
            console.error("Error aprobando el contrato:", error);
            setToastMessage('Error al aprobar el contrato.');
            setToastVariant('danger');
            setShowToast(true);
            setIsApproveModalOpen(false);
        }
    };




    const prepareContractDataForPDF = (contract) => {

        return {
            contractCode: contract.contractCode,
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

            paymentMethod: {
                label: contract.paymentMethod?.label
            },
            paymentType: {
                label: contract.paymentType?.label
            },
            trainingPlace: {
                label: contract.trainingPlace?.label
            },

            estadoVenta: contract.estadoVenta,
            valorInicialHoy: contract.valorInicialHoy,
            valorPactadoHoy: contract.valorPactadoHoy,
            valorPactadoMasCUI: contract.valorPactadoMasCUI,
            services: contract.services?.map(service => ({
                label: service.label
            })),
            headlines: contract.headlines?.map(headline => ({
                name: headline.name,
                idNumber: headline.idNumber,
                birthdate: headline.birthdate,
                photoFront: headline.photoFront,
                photoBack: headline.photoBack
            }))
        };
    };

    const handleSearchChange = (event) => {
        setSearchTerm(event.target.value);
    };

    const filteredContracts = contracts.filter(contract => {
        const clientName = `${contract.client?.name || ''} ${contract.client?.lastname || ''}`.toLowerCase();
        const searchTermLower = searchTerm.toLowerCase();

        // Filtrar por coincidencia en el nombre completo del cliente
        const nameMatches = clientName.includes(searchTermLower);

        // Filtrar por estado
        const statusMatches = statusFilter === 'todos'
            || (statusFilter === 'true' && contract.approved)
            || (statusFilter === 'false' && !contract.approved);

        return nameMatches && statusMatches;
    });

    const renderHeadlinesWithDetails = (headlines = []) => {

        if (!Array.isArray(headlines)) {
            return null;
        }

        return headlines.map((headline, index) => (
            <tr key={index}>
                <td>
                    Titular: {headline.name} <br />
                    Cédula: {headline.idNumber}
                </td>
                <td className='margin-top-10em'>
                    {headline.photoFront ? (
                        <img
                            src={headline.photoFront}
                            alt="N/A"
                            style={{ width: '100px', cursor: 'pointer', marginRight: '10px' }}
                            onClick={() => handleImageClick(headline.photoFront)}
                        />
                    ) : (
                        'Sin foto frontal  '
                    )}
                    {headline.photoBack ? (
                        <img
                            src={headline.photoBack}
                            alt="N/A"
                            style={{ width: '100px', cursor: 'pointer', marginRight: '10px' }}
                            onClick={() => handleImageClick(headline.photoBack)}
                        />
                    ) : (
                        '  Sin foto trasera'
                    )}
                </td>
            </tr>
        ));
    };

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
                        <Card.Header className="d-flex justify-content-between">
                            <div className="header-title">
                                <h4 className="card-title">Lista de Contratos</h4>
                                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                    Este módulo permite gestionar todos los contratos.
                                </p>
                            </div>


                        </Card.Header>
                        <Card.Body className="p-0">
                            <div className="table-responsive mt-4">

                                <div className="m-3">
                                    <Form.Check
                                        type="radio"
                                        label="Todos"
                                        name="statusFilter"
                                        id="statusAll"
                                        checked={statusFilter === 'todos'}
                                        onChange={() => setStatusFilter('todos')}
                                        inline
                                    />
                                    <Form.Check
                                        type="radio"
                                        label="Aprobado"
                                        name="statusFilter"
                                        id="statusApproved"
                                        checked={statusFilter === 'true'}
                                        onChange={() => setStatusFilter('true')}
                                        inline
                                    />
                                    <Form.Check
                                        type="radio"
                                        label="Pendiente"
                                        name="statusFilter"
                                        id="statusPending"
                                        checked={statusFilter === 'false'}
                                        onChange={() => setStatusFilter('false')}
                                        inline
                                    />
                                </div>

                                <div className="input-group mb-3">
                                    <span className="input-group-text" id="search-input">
                                        <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                                            <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        </svg>
                                    </span>
                                    <input value={searchTerm} onChange={handleSearchChange}
                                        type="search" className="form-control" placeholder="Buscar por Cliente" />
                                </div>

                                {loading ? (
                                    <div>Cargando...</div>
                                ) : error ? (
                                    <div>{error}</div>
                                ) : (
                                    <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto', maxWidth: '95%', marginLeft: '20px' }}>
                                        <table className="table table-striped table-bordered" id="basic-table">
                                            <thead>
                                                <tr>
                                                    <th>Estado</th>
                                                    <th>Código</th>
                                                    <th>Fecha</th>
                                                    <th>Cliente</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredContracts.length > 0 ? (
                                                    filteredContracts.map((contract) => (
                                                        <tr key={contract.id}>
                                                            <td>{contract.approved ? 'Aprobado' : 'Pendiente'}</td>
                                                            <td>{contract.contractCode}</td>
                                                            <td>{contract.date}</td>
                                                            <td>{contract.client.name} {contract.client.lastname}</td>


                                                            <td>
                                                                <Button
                                                                    variant="primary"
                                                                    onClick={() => {
                                                                        setSelectedContract(contract);
                                                                        setShowContractModal(true); // <- Esto abre el modal
                                                                    }}
                                                                >
                                                                    Detalles
                                                                </Button>
                                                            </td>

                                                        </tr>
                                                    ))
                                                ) : (
                                                    <tr>
                                                        <td colSpan="19" className="text-center">No se encontraron contratos.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <Modal
                show={showContractModal}
                onHide={handleCloseContractModal}
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
                                    <h4 style={{ color: '#0817ba' }} >Información del Contrato</h4>
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
                                                    onClick={() => handleImageClick(url)}
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
                                                        <>
                                                            <div className="text-center">
                                                                <h6 className="data-value">Parte Frontal:</h6>
                                                                <img
                                                                    src={titular.photoFront}
                                                                    alt="Titular Foto Frontal"
                                                                    style={{ width: '80px', cursor: 'pointer' }}
                                                                    onClick={() => handleImageClick(titular.photoFront)}
                                                                />
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <h6 className="data-value">Sin foto frontal</h6>
                                                    )}

                                                    {titular.photoBack ? (
                                                        <>
                                                            <div className="text-center">
                                                                <h6 className="data-value">Parte Trasera:</h6>
                                                                <img
                                                                    src={titular.photoBack}
                                                                    alt="Titular Foto Trasera"
                                                                    style={{ width: '80px', cursor: 'pointer' }}
                                                                    onClick={() => handleImageClick(titular.photoBack)}
                                                                />
                                                            </div>
                                                        </>
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

                                    <h5>Correciones del administrador:</h5>
                                    <h6 className="data-value">{selectedContract.corrections || 'Sin correciones.'}</h6>
                                </div>

                                {/* Botones */}
                                <div className="col-12 d-flex gap-2 justify-content-center mt-4">
                                    <Button
                                        variant={selectedContract.approved ? 'secondary' : 'success'}
                                        disabled={selectedContract.approved}
                                        onClick={() => {
                                            approveContract(selectedContract);
                                            setShowContractModal(false);
                                        }}
                                    >
                                        {selectedContract.approved ? 'Aprobado' : 'Aprobar'}
                                    </Button>

                                    {!selectedContract.approved && (
                                        <Button
                                            variant="danger"
                                            onClick={() => {
                                                setSelectedContract(selectedContract);
                                                setShow(true);
                                            }}
                                        >
                                            Rechazar
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center">
                                No se encontraron contratos.
                            </div>
                        )}
                    </div>
                </Modal.Body>



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

            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title className="text-center w-100" id="modal-contract-title">
                        Contrato Rechazado</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <h5 >Correcciones</h5>
                        <Form.Control
                            as="textarea"
                            rows={3}
                            value={corrections}
                            onChange={(e) => setCorrections(e.target.value)}
                            placeholder="Escribe las correcciones"
                        />
                    </Form.Group>

                    <Modal.Footer className="d-flex justify-content-center">
                        <Button
                            variant="primary"
                            onClick={() => {
                                handleReject();
                                setShowContractModal(false);
                                setShow(false);
                            }}
                        >
                            Agregar Observación
                        </Button>

                    </Modal.Footer>

                </Modal.Body>
            </Modal>
            <ToastContainer position="fixed" top={20} right={20} style={{ zIndex: 100000 }}>
                <Toast
                    bg={toastVariant === 'success' ? 'success' : 'danger'}

                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={5000}
                    autohide
                    variant={toastVariant}
                >

                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </>

    );
};

export default Admin;