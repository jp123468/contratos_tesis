
import React, { useState, useEffect } from 'react';
import { Row, Col, Table, Button, Modal, Form, ToastContainer, Toast } from 'react-bootstrap';
import Card from '../../../components/Card';
import { Link, useLocation, Route } from 'react-router-dom';
import { collection, getDocs, doc, addDoc, updateDoc, arrayUnion, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../../firebase/firebase_settings';
import { FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash } from "react-icons/fa";


const Service = () => {


    const [services, setServices] = useState([]);
    const [service, setService] = useState({});

    const [serviceOptions, setServiceOptions] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newService, setNewService] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success'); // success | danger | warning
    const [searchCityTerm, setSearchCityTerm] = useState('');
    const [searchServiceTerm, setSearchServiceTerm] = useState('');

    const [formData, setFormData] = useState({
        serviceName: "",
    });
    const fetchServiceOptions = async () => {
        try {
            const optionsCollection = collection(db, "OptionsSelect");
            const optionsSnapshot = await getDocs(optionsCollection);

            // Extraer serviceOptions de cada documento
            const optionsList = optionsSnapshot.docs.map(doc => {
                const data = doc.data();
                return data.serviceOptions || []; // Asegúrate de que sea un array
            });

            // Aplanar el array de arrays (si hay varios documentos)
            const allOptions = optionsList.flat();
            setServiceOptions(allOptions);
        } catch (error) {
            console.error('Error al obtener las:', error);
            setToastMessage('Error al obtener las opciones.');
            setToastVariant('danger');
            setShowToast(true);
        }
    };
    const capitalize = (str) => {
        return str
            .trim()
            .toLowerCase()
            .split(' ')
            .filter(word => word) // elimina espacios extra
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };


    const handleAddService = async () => {
        const formattedService = capitalize(newService);

        if (formattedService.trim() === "") {
            console.log("Por favor, ingresa un nombre válido para el servicio.");
            setToastMessage('Ingrese un nombre valido.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        if (serviceOptions.some(s => s.toLowerCase() === formattedService.trim().toLowerCase())) {
            setToastMessage('El servicio ya existe.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        try {
            const optionsDoc = (await getDocs(collection(db, "OptionsSelect"))).docs[0];
            const docRef = doc(db, "OptionsSelect", optionsDoc.id);

            await updateDoc(docRef, {
                serviceOptions: arrayUnion(formattedService)
            });

            fetchServiceOptions();
            setIsModalOpen(false);
            setNewService("");
            setToastMessage('Servicio agregado con éxito.');
            setToastVariant('success')
            setShowToast(true);;
        } catch (error) {
            console.error("Error al agregar el servicio:", error);
            setToastMessage('Error al agregar el servicio..');
            setToastVariant('danger');
            setShowToast(true);
        }

    };


    // Abrir modal y cargar los datos del servicio seleccionado
    const handleEditService = (service) => {
        setSelectedService(service);
        setFormData({ serviceName: service });
        setIsEditModalOpen(true);
    };

    const handleUpdateService = async () => {
        const formattedService = capitalize(formData.serviceName);

        if (!formattedService.trim()) {
            setToastMessage('El nombre del servicio no puede estar vacío.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        const isDuplicate = serviceOptions.some(
            s => s.toLowerCase() === formattedService.toLowerCase() && s !== selectedService
        );
        if (isDuplicate) {
            setToastMessage('Ya existe un servicio con ese nombre.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        try {
            const serviceInUse = await isServiceInUse(selectedService);

            if (serviceInUse) {
                setToastMessage('Este servicio ya está en uso y no puede ser editado.');
                setToastVariant('danger');
                setShowToast(true);
                return;
            }

            const optionsDoc = (await getDocs(collection(db, "OptionsSelect"))).docs[0];
            const docRef = doc(db, "OptionsSelect", optionsDoc.id);

            const updatedOptions = serviceOptions.map(service =>
                service === selectedService ? formattedService : service
            );

            await updateDoc(docRef, {
                serviceOptions: updatedOptions
            });

            fetchServiceOptions();
            setIsEditModalOpen(false);
            setToastMessage('Servicio actualizado con éxito.');
            setToastVariant('success');
        } catch (error) {
            console.error("Error al actualizar el servicio:", error);
            setToastMessage('Servicio no se pudo actualizar.');
            setToastVariant('danger');
        }

        setShowToast(true);
    };



    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };
    const isServiceInUse = async (serviceLabel) => {
        const querySnapshot = await getDocs(collection(db, 'contracts'));

        return querySnapshot.docs.some(doc => {
            const contract = doc.data();
            const services = contract.services;

            if (Array.isArray(services)) {
                return services.some(service => service.label === serviceLabel);
            }

            return services?.label === serviceLabel;
        });
    };


    const isCityInUse = async (cityLabel) => {
        const querySnapshot = await getDocs(collection(db, 'contracts'));

        return querySnapshot.docs.some(doc => {
            const contract = doc.data();
            const trainingPlace = contract.ciudad;

            if (Array.isArray(trainingPlace)) {
                return trainingPlace.some(place => place.label === cityLabel);
            }

            return trainingPlace?.label === cityLabel;
        });
    };



    // Abrir el modal de eliminación
    const handleDeleteService = async (serviceLabel) => {
        const inUse = await isServiceInUse(serviceLabel);
        if (inUse) {
            setToastMessage(`No se puede eliminar el servicio "${serviceLabel}" porque está en uso en un contrato.`);
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        setSelectedService(serviceLabel);
        setIsDeleteModalOpen(true);
    };

    const handleDeleteCity = async (cityLabel) => {
        const inUse = await isCityInUse(cityLabel);
        if (inUse) {
            setToastMessage(`No se puede eliminar la ciudad "${cityLabel}" porque está en uso en un contrato.`);
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        setSelectedCity(cityLabel);
        setIsDeleteCityModalOpen(true);
    };


    // Confirmar la eliminación del servicio
    const confirmDelete = async () => {
        try {
            const optionsDoc = (await getDocs(collection(db, "OptionsSelect"))).docs[0];
            const docRef = doc(db, "OptionsSelect", optionsDoc.id);

            // Filtrar el servicio a eliminar
            const updatedOptions = serviceOptions.filter(service => service !== selectedService);

            await updateDoc(docRef, {
                serviceOptions: updatedOptions
            });

            fetchServiceOptions(); // Refrescar los datos
            setIsDeleteModalOpen(false); // Cerrar el modal
            setToastMessage('Servicio eliminado con éxito.');
            setToastVariant('success');
        } catch (error) {
            console.error("Error al eliminar el servicio:", error);
            setToastMessage('Servicio no se pudo eliminar.');
            setToastVariant('danger');
        }
        setShowToast(true);
    };

    const [cityOptions, setCityOptions] = useState([]);
    const [isCityModalOpen, setIsCityModalOpen] = useState(false);
    const [newCity, setNewCity] = useState("");
    const [isEditCityModalOpen, setIsEditCityModalOpen] = useState(false);
    const [isDeleteCityModalOpen, setIsDeleteCityModalOpen] = useState(false);
    const [selectedCity, setSelectedCity] = useState(null);
    const [formDataCity, setFormDataCity] = useState({
        city: "",
    });
    const fetchCityOptions = async () => {
        try {
            const optionsCollection = collection(db, "OptionsSelect");
            const optionsSnapshot = await getDocs(optionsCollection);

            const optionsList = optionsSnapshot.docs.map(doc => {
                const data = doc.data();
                return data.cityOptions || []; // Asegúrate de que sea un array
            });

            // Aplanar el array de arrays (si hay varios documentos)
            const allOptions = optionsList.flat();
            setCityOptions(allOptions);
            console.log(allOptions)
        } catch (error) {
            console.error('Error al obtener las options:', error);
            setToastMessage('Error al obtener las opciones.');
            setToastVariant('danger');
            setShowToast(true);
        }
    };
    const handleAddCity = async () => {
        const formattedCity = capitalize(newCity);

        if (formattedCity.trim() === "") {
            console.log("Por favor, ingresa un nombre válido para la ciudad.");
            setToastMessage('Ingrese un nombre válido.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        if (cityOptions.some(c => c.toLowerCase() === formattedCity.toLowerCase())) {
            setToastMessage('La ciudad ya existe.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        try {
            const optionsDoc = (await getDocs(collection(db, "OptionsSelect"))).docs[0];
            const docRef = doc(db, "OptionsSelect", optionsDoc.id);

            await updateDoc(docRef, {
                cityOptions: arrayUnion(formattedCity)
            });

            fetchCityOptions();
            setIsCityModalOpen(false);
            setNewCity("");
            setToastMessage('Ciudad agregado con éxito.');
            setToastVariant('success');
            setShowToast(true);
        } catch (error) {
            console.error("Error al agregar la ciudad:", error);
            setToastMessage('Error al agregar la ciudad.');
            setToastVariant('danger');
            setShowToast(true);
        }
    };
    // Abrir modal y cargar los datos del servicio seleccionado
    const handleEditCity = (city) => {
        setSelectedCity(city);
        setFormDataCity({ cityName: city });
        setIsEditCityModalOpen(true);
    };
    const handleUpdateCity = async () => {
        const formattedCity = capitalize(formDataCity.cityName);

        if (!formattedCity.trim()) {
            console.warn("El nombre de la ciudad no puede estar vacío.");
            setToastMessage('Ingrese un nombre válido');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        const isDuplicateCity = cityOptions.some(
            c => c.toLowerCase() === formattedCity.toLowerCase() && c !== selectedCity
        );
        if (isDuplicateCity) {
            setToastMessage('Ya existe una ciudad con ese nombre.');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        try {
            const cityInUse = await isCityInUse(selectedCity);

            if (cityInUse) {
                setToastMessage('Esta ciudad ya está en uso y no puede ser editada.');
                setToastVariant('danger');
                setShowToast(true);
                return;
            }

            const optionsDoc = (await getDocs(collection(db, "OptionsSelect"))).docs[0];
            const docRef = doc(db, "OptionsSelect", optionsDoc.id);

            const updatedOptions = cityOptions.map(city =>
                city === selectedCity ? formattedCity : city
            );

            await updateDoc(docRef, {
                cityOptions: updatedOptions
            });

            fetchCityOptions(); // Refrescar los datos
            setIsEditCityModalOpen(false); // Cerrar el modal
            setToastMessage('Ciudad actualizada con éxito.');
            setToastVariant('success');
        } catch (error) {
            console.error("Error al actualizar la ciudad:", error);
            setToastMessage('No se pudo actualizar la ciudad.');
            setToastVariant('danger');
        }

        setShowToast(true);
    };

    const handleInputChangeCity = (e) => {
        setFormDataCity({ ...formDataCity, [e.target.id]: e.target.value });
    };


    // Confirmar la eliminación del servicio
    const confirmDeleteCity = async () => {
        try {
            const optionsDoc = (await getDocs(collection(db, "OptionsSelect"))).docs[0];
            const docRef = doc(db, "OptionsSelect", optionsDoc.id);

            // Filtrar el servicio a eliminar
            const updatedOptions = cityOptions.filter(city => city !== selectedCity);

            await updateDoc(docRef, {
                cityOptions: updatedOptions
            });

            fetchCityOptions(); // Refrescar los datos
            setIsDeleteCityModalOpen(false); // Cerrar el modal
            setToastMessage('Ciudad eliminada con éxito.');
            setToastVariant('success');
            setShowToast(true);
        } catch (error) {
            console.error("Error al eliminar la ciudad:", error);
            setToastMessage('Error al eliminar la ciudad.');
            setToastVariant('danger');
            setShowToast(true);
        }
    };
    useEffect(() => {
        fetchServiceOptions();
        fetchCityOptions();
    }, []);
    const filteredCityOptions = cityOptions.filter(city =>
        city.toLowerCase().includes(searchCityTerm.toLowerCase())
    );

    const filteredServiceOptions = serviceOptions.filter(service =>
        service.toLowerCase().includes(searchServiceTerm.toLowerCase())
    );

    return (
        <>
            <Row>
                <Col sm="12">
                    <Card>
                        <Card.Header className="d-flex justify-content-between">
                            <div className="header-title">
                                <h4 className="card-title">Servicios</h4>
                                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                    Este módulo permite gestionar los servicios que ofrece.
                                </p>
                            </div>

                            <Button variant="info" onClick={() => setIsModalOpen(true)} class="btn btn-primary" aria-label="Add Client"> <FaPlus /> Nuevo servicio </Button>

                        </Card.Header>
                        <div className="px-4 pt-3">
                            <div className="input-group mb-3">
                                <span className="input-group-text" id="search-service-input">
                                    <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                                        <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                    </svg>
                                </span>
                                <input
                                    type="search"
                                    value={searchServiceTerm}
                                    onChange={(e) => setSearchServiceTerm(e.target.value)}
                                    className="form-control"
                                    placeholder="Buscar servicio"
                                />
                            </div>
                        </div>

                        <Card.Body className="px-0">
                            <div className="d-flex justify-content-center">
                                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto', width: '100%', maxWidth: '800px' }}>
                                    <table className="table table-striped table-bordered text-center" id="basic-table">
                                        <thead>
                                            <tr className="ligth">
                                                <th>N°</th>
                                                <th>Nombre</th>
                                                <th style={{ minWidth: '100px' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredServiceOptions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center" style={{ padding: '8px' }}>
                                                        No se encontraron Servicios
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredServiceOptions.map((option, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{option}</td>
                                                        <td>
                                                            <Button
                                                                variant="link"
                                                                onClick={() => handleEditService(option)}
                                                                aria-label="Edit"
                                                                title="Editar"
                                                            >
                                                                <FaEdit />
                                                            </Button>
                                                            <Button
                                                                variant="link"
                                                                onClick={() => handleDeleteService(option)}
                                                                aria-label="Delete"
                                                                title="Eliminar"
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>

                                    </table>
                                </div>
                            </div>
                        </Card.Body>

                    </Card>
                </Col>
            </Row>


            <Modal show={isModalOpen} onHide={() => setIsModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">Nuevo</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            id="newService"
                            placeholder="Ingresa el nombre del nuevo servicio"
                            value={newService}
                            maxLength={22}
                            onChange={(e) => setNewService(e.target.value)}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button variant="success" onClick={handleAddService}>
                        Guardar
                    </Button>
                </Modal.Footer>

            </Modal>

            {/* Modal para editar un servicio */}
            <Modal show={isEditModalOpen} onHide={() => setIsEditModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center" >Editar</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="form-group">
                            <label>Nombre del Servicio</label>
                            <input
                                type="text"
                                id="serviceName"
                                value={formData.serviceName}
                                onChange={handleInputChange}
                                maxLength={22}
                                className="form-control"
                            />
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button variant="success" onClick={handleUpdateService}>
                        Actualizar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal para confirmar eliminación */}
            <Modal show={isDeleteModalOpen} onHide={() => setIsDeleteModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedService && (
                        <>
                            <p>¿Estás seguro de que deseas eliminar el siguiente servicio?</p>
                            <ul>
                                <li><strong>Servicio:</strong> {selectedService}</li>
                            </ul>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="justify-content-center">

                    <Button variant="danger" onClick={confirmDelete}>
                        Confirmar Eliminación
                    </Button>
                </Modal.Footer>
            </Modal>


            <Row>
                <Col sm="12">
                    <Card>
                        <Card.Header className="d-flex justify-content-between">
                            <div className="header-title">
                                <h4 className="card-title">Ciudades
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                                        Este módulo permite gestionar las ciudades donde trabajan.
                                    </p>
                                </h4>
                            </div>
                            <Button variant="info" onClick={() => setIsCityModalOpen(true)} class="btn btn-primary" aria-label="Add Client"> <FaPlus /> Nueva Ciudad </Button>

                        </Card.Header>
                        <div className="px-4 pt-3">
                            <div className="input-group mb-3">
                                <span className="input-group-text" id="search-city-input">
                                    <svg width="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="11.7669" cy="11.7666" r="8.98856" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></circle>
                                        <path d="M18.0186 18.4851L21.5426 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                    </svg>
                                </span>
                                <input
                                    type="search"
                                    value={searchCityTerm}
                                    onChange={(e) => setSearchCityTerm(e.target.value)}
                                    className="form-control"
                                    placeholder="Buscar ciudad"
                                />
                            </div>
                        </div>

                        <Card.Body className="px-0">
                            <div className="d-flex justify-content-center">
                                <div className="table-responsive" style={{ maxHeight: '500px', overflowY: 'auto', width: '100%', maxWidth: '800px' }}>
                                    <table className="table table-striped table-bordered text-center" id="basic-table">
                                        <thead>
                                            <tr className="ligth">
                                                <th>N°</th>
                                                <th>Nombre</th>
                                                <th style={{ minWidth: '100px' }}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCityOptions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="8" className="text-center" style={{ padding: '8px' }}>
                                                        No se encontraron Ciudades
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredCityOptions.map((option, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{option}</td>
                                                        <td>
                                                            <Button
                                                                variant="link"
                                                                onClick={() => handleEditCity(option)}
                                                                aria-label="Edit"
                                                                title="Editar"
                                                            >
                                                                <FaEdit />
                                                            </Button>
                                                            <Button
                                                                variant="link"
                                                                onClick={() => handleDeleteCity(option)}
                                                                aria-label="Delete"
                                                                title="Eliminar"
                                                            >
                                                                <FaTrash />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>

                                    </table>
                                </div>
                            </div>
                        </Card.Body>

                    </Card>
                </Col>
            </Row>

            {/* Modal usando React-Bootstrap */}
            <Modal show={isCityModalOpen} onHide={() => setIsCityModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">
                        Nuevo
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body >
                    <Form.Group className="mb-3 ">
                        <Form.Control
                            type="text"
                            id="newCity"
                            placeholder="Ingresa el nombre de la ciudad"
                            value={newCity}
                            maxLength={22}
                            onChange={(e) => setNewCity(e.target.value)}
                        />
                    </Form.Group>

                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button variant="success" onClick={handleAddCity}>
                        Guardar
                    </Button>
                </Modal.Footer>

            </Modal>

            {/* Modal para editar una ciudad */}
            <Modal show={isEditCityModalOpen} onHide={() => setIsEditCityModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">Editar</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form>
                        <div className="form-group">
                            <label>Nombre de la Ciudad</label>
                            <input
                                type="text"
                                id="cityName"
                                value={formDataCity.cityName}
                                onChange={handleInputChangeCity}
                                maxLength={22}
                                className="form-control"
                            />
                        </div>
                    </form>
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button variant="success" onClick={handleUpdateCity}>
                        Actualizar
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal para confirmar eliminación */}
            <Modal show={isDeleteCityModalOpen} onHide={() => setIsDeleteCityModalOpen(false)}>
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">Confirmar Eliminación</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedCity && (
                        <>
                            <p>¿Estás seguro de que deseas eliminar la siguiente ciudad?</p>
                            <ul>
                                <li><strong>Ciudad:</strong> {selectedCity}</li>
                            </ul>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer className="justify-content-center">
                    <Button variant="danger" onClick={confirmDeleteCity}>
                        Confirmar Eliminación
                    </Button>
                </Modal.Footer>
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
        </>
    );
};

export default Service