import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import logo from '../../assets/images/logopdf.png';
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import React, { useState } from "react";

//DAVID
function agregarTextoJustificado(docPDF, texto, x, y, maxWidth, lineHeight) {
    const palabras = texto.split(' ');  // Dividir el texto en palabras
    let linea = '';
    let lineas = [];

    // Construir las líneas que no exceden el ancho máximo
    palabras.forEach((palabra) => {
        const testLinea = linea + palabra + ' ';
        const testWidth = docPDF.getTextWidth(testLinea);
        if (testWidth > maxWidth) {
            lineas.push(linea.trim());  // Añadir línea completa sin la palabra que desbordaría
            linea = palabra + ' ';  // Comenzar una nueva línea con la palabra actual
        } else {
            linea = testLinea;  // Añadir la palabra actual a la línea
        }
    });

    // Añadir la última línea
    if (linea.length > 0) {
        lineas.push(linea.trim());
    }

    // Ahora que tenemos todas las líneas, las imprimimos justificadas
    lineas.forEach((lineaTexto, index) => {
        const palabrasEnLinea = lineaTexto.split(' ');
        if (index === lineas.length - 1 || palabrasEnLinea.length === 1) {
            // La última línea o si la línea tiene una sola palabra: Alinear a la izquierda
            docPDF.text(x, y, lineaTexto);
        } else {
            // Justificar la línea
            const espacioTotal = maxWidth - docPDF.getTextWidth(lineaTexto.replace(/\s+/g, ''));
            const espacioEntrePalabras = espacioTotal / (palabrasEnLinea.length - 1);
            let xPos = x;

            palabrasEnLinea.forEach((palabra, idx) => {
                docPDF.text(xPos, y, palabra);
                if (idx < palabrasEnLinea.length - 1) {
                    xPos += docPDF.getTextWidth(palabra) + espacioEntrePalabras;
                }
            });
        }
        y += lineHeight;  // Moverse a la siguiente línea
    });

    return y;  // Retornar la nueva posición vertical
}

//FIN

const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const calculateAge = (birthdate) => {
    if (!birthdate) return 'N/A';

    let birthDate;

    // Caso 1: Firestore Timestamp
    if (typeof birthdate === 'object' && birthdate.seconds) {
        birthDate = new Date(birthdate.seconds * 1000);
    }
    // Caso 2: dd/mm/yyyy
    else if (typeof birthdate === 'string' && birthdate.includes('/')) {
        const [day, month, year] = birthdate.split('/');
        birthDate = new Date(`${year}-${month}-${day}`);
    }
    // Caso 3: yyyy-mm-dd
    else if (typeof birthdate === 'string' && birthdate.includes('-')) {
        birthDate = new Date(birthdate);
    } else {
        return 'N/A';
    }

    if (isNaN(birthDate.getTime())) {
        console.warn('Fecha inválida:', birthdate);
        return 'N/A';
    }

    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return `${age} años`;
};


const PDFGenerator = async (contract) => {


    const db = getFirestore();
    const docPDF = new jsPDF();

    const agregarLogo = (docPDF) => {
        const logoWidth = 50;  // Ancho del logo
        const logoHeight = 20;  // Altura del logo
        const xPosition = 10;  // Posición en X para la esquina izquierda
        const yPosition = 10;  // Posición en Y para la parte superior
        docPDF.addImage(logo, 'PNG', xPosition, yPosition, logoWidth, logoHeight);  // Agrega el logo en la parte superior izquierda
    };


    agregarLogo(docPDF);

    // Título del contrato centrado
    docPDF.setFontSize(16);
    const title = 'CONTRATO CIVIL DE PRESTACIÓN DE SERVICIOS';
    const titleWidth = docPDF.getTextWidth(title);
    const titleX = (docPDF.internal.pageSize.getWidth() - titleWidth) / 2;
    docPDF.text(title, titleX, 40);

    // Código de contrato y fecha
    const contractCodeaprov = contract.contractCodeaprov || 'STG19|94';
    const today = new Date();
    const formattedDate = `${today.getDate()} de ${monthNames[today.getMonth()]} de ${today.getFullYear()}`;
    docPDF.text(`Contrato N°: ${contractCodeaprov}`, 150, 50);
    docPDF.text(`Fecha: ${formattedDate}`, 10, 50);

    // Obtener la primera cláusula
    const docRefPrimera = doc(db, 'ContractsTemplates', 'Primera');
    const docSnapPrimera = await getDoc(docRefPrimera);
    let primeraClausula = docSnapPrimera.exists() ? docSnapPrimera.data().contractBody || '' : '';
    const ciudad =
        typeof contract.ciudad === 'object' && contract.ciudad !== null
            ? contract.ciudad.label || 'N/A'
            : 'N/A';
    const dia = today.getDate();
    const mes = monthNames[today.getMonth()];
    primeraClausula = primeraClausula.replace('{{ciudad}}', ciudad).replace('{{dia}}', dia).replace('{{mes}}', mes);

    docPDF.setFontSize(12);
    docPDF.text(primeraClausula, 10, 60, { maxWidth: 190 });


    let startingY = 82; // Valor inicial fijo
    docPDF.text('DATOS DEL ADQUIRENTE', 10, startingY);


    const clientData = [
        {
            label: 'Titular',
            name: `${contract.client?.name || 'N/A'} ${contract.client?.lastname || ''}`,
            idNumber: contract.client?.idnumber || 'N/A',
            birthdate: calculateAge(contract.client?.birthdate),

            services: contract.services?.map(service => service.label).join(', ') || 'N/A'
        }

    ];

    const headlinesData = contract.headlines?.map((headline, index) => {
        return {
            label: `Beneficiario ${index + 1}`,
            name: `${headline.name || 'N/A'} ${headline.lastname || ''}`,
            idNumber: headline.idNumber || 'N/A',
            birthdate: calculateAge(headline.birthdate),
            services: Array.isArray(contract.services) && contract.services.length > 0
                ? contract.services.map(service => service.label || 'N/A').join(', ')
                : 'N/A'
        };
    }) || [];



    const combinedData = [...clientData, ...headlinesData];
    const tableData = combinedData.map(row => [row.label, row.name, row.idNumber, row.birthdate, row.services]);

    // Agregar la tabla
    docPDF.autoTable({
        head: [['Rol', 'Nombres y Apellidos', 'Cédula', 'Edad', 'Servicios']],
        body: tableData,
        startY: startingY + 3,
        margin: { horizontal: 10 },
        styles: { fontSize: 12 },
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [230, 230, 230] }
    });

    // Obtener la cláusula de restricciones
    const docRefRes = doc(db, 'ContractsTemplates', 'Restricciones');
    const docSnapRes = await getDoc(docRefRes);
    let restClausula = docSnapRes.exists() ? docSnapRes.data().contractBody || '' : '';

    // Posicionar la cláusula de restricciones
    const restrictionsY = docPDF.autoTable.previous.finalY + 5; // Iniciar justo después de la tabla
    docPDF.setFontSize(12);
    docPDF.text(restClausula, 10, restrictionsY, { maxWidth: 190 });
    // Agregar costos de prestación de servicios  
    const costoText = [
        "Costo de prestación de Servicios por beneficiario",
        "a) Servicios de encomienda \t $285,00",
        "b) 6 cuotas mensuales \t\t $234,00",
        "c) Servicios preceptor \t\t $397,00"
    ];

    // Calcular la posición para el texto de costos
    const costoStartY = restrictionsY + 10; // Reducir el espacio después de las restricciones
    const rightMargin = 15; // Margen derecho

    // Calcular la posición X para alinear a la derecha
    const maxLineWidth = Math.max(...costoText.map(line => docPDF.getTextWidth(line))); // Ancho máximo de las líneas
    const xPosition = docPDF.internal.pageSize.getWidth() - maxLineWidth - rightMargin; // Calcular X

    // Alinear el texto de costos a la derecha
    costoText.forEach((line, index) => {
        const lineY = costoStartY + (index * 7); // Reducir el espacio entre líneas
        docPDF.text(line, xPosition, lineY); // Usar posición X calculada
    });


    // Obtener la posición final de la última línea de costoText
    const finalCostoY = costoStartY + (costoText.length * 6);

    const observationsStartY = finalCostoY;
    const tableWidth = 190; // Ancho total de la tabla
    const separationX = 100; // Posición X para la línea vertical de separación (mitad de la tabla)
    const tableHeight = 50; // Altura de las celdas combinadas
    const observations = contract.observations || 'N/A';

    // Crear la tabla para Observaciones y Ofrecimientos y Costos (dos celdas combinadas)
    // Dibuja la celda combinada de Observaciones y Ofrecimientos (izquierda)
    docPDF.rect(10, observationsStartY, separationX - 10, tableHeight); // Dibuja el borde de la celda
    docPDF.setFontSize(12);
    docPDF.text('Observaciones y Ofrecimientos:', 12, observationsStartY + 10); // Texto de Observaciones
    docPDF.setFontSize(10); // Opcional: letra más pequeña si hay mucho texto
    docPDF.text(`${observations}`, 12, observationsStartY + 16, {
        maxWidth: separationX - 20 // Resta margen lateral para no salirse del cuadro
    });
    // Dibuja la celda combinada de Costos (derecha)
    docPDF.rect(separationX, observationsStartY, tableWidth - separationX, tableHeight); // Dibuja el borde de la celda
    docPDF.setFontSize(12);

    // Agregar los costos dentro de la celda de Costos
    const costStartY = observationsStartY + 10; // Posición para la lista de costos
    const costs = [
        { label: 'A) COSTO COMERCIAL', amount: '$2086.00' },
        { label: 'B) Subsidio Familiar', amount: '' },
        { label: 'C) Convenio Institucional', amount: '' },
        { label: 'D) Costo Promocional', amount: '' },
    ];

    // Añadir cada costo dentro de la celda de Costos
    costs.forEach((cost, index) => {
        const costY = costStartY + (index * 10); // Separación entre cada línea
        docPDF.text(`${cost.label} ${cost.amount}`, separationX + 5, costY);
    });

    // Valores
    const valorPactadoHoy = contract.valorPactadoHoy || 'N/A';

    // Firma y recibí de (sección combinada en la parte inferior)
    const firmaStartY = observationsStartY + tableHeight; // Posición para la sección de la firma
    const firmaHeight = 40; // Altura de la sección de la firma

    // Definir variables de titular y contrato
    const titularNombre = `${contract.client?.name || 'N/A'} ${contract.client?.lastname || 'N/A'}`.trim();
    const titularCedula = contract.client?.idnumber || 'N/A'; // ID del titular
    const paymentMethod = contract.paymentMethod?.label || 'N/A'; // Método de pago

    // Dibujar cuadro para la firma
    docPDF.rect(10, firmaStartY, separationX - 10, firmaHeight); // Celda para la firma (izquierda)
    docPDF.setFontSize(10); // Tamaño de letra más pequeño
    docPDF.text(`Titular: ${titularNombre}`, 12, firmaStartY + 10);
    docPDF.setFontSize(12); // Opcional: volver al tamaño original para las siguientes líneas

    let firmas = null;

    try {
        const contratoDoc = await getDoc(doc(db, "contracts", contract.id));
        if (contratoDoc.exists()) {
            const data = contratoDoc.data();
            firmas = data?.signatureUrl || null;
        }
    } catch (error) {
        console.error("Error al obtener la firma del contrato:", error);
    }



    // Función para agregar la firma al PDF
    async function addFirmaCliente(docPDF, yPos, firmas) {
        try {
            // Validar que sea una imagen en formato base64
            if (!firmas || typeof firmas !== 'string' || !firmas.startsWith('data:image')) {
                throw new Error("La firma no está en formato Base64 válido.");
            }
            // Ajusta las coordenadas y el tamaño aquí
            const xPos = 33; // Nueva posición en X
            const newYPos = yPos + 11; // Incrementar 20 unidades en Y
            const newWidth = 30; // Nuevo ancho
            const newHeight = 13; // Nueva altura

            docPDF.addImage(firmas, 'PNG', xPos, newYPos, newWidth, newHeight); // Ajusta las coordenadas y el tamaño
        } catch (error) {
            console.error('Error al agregar la firma al PDF:', error);
        }
    }

    // Agregar la firma del cliente si existe
    if (typeof firmas === 'string' && firmas.indexOf("data:image") === 0) {
        await addFirmaCliente(docPDF, firmaStartY, firmas);
    } else {
        docPDF.text("FIRMA DEL CLIENTE NO DISPONIBLE", 24, firmaStartY + 20);
    }

    docPDF.text('Firma: ___________________', 12, firmaStartY + 25);
    docPDF.text(`Cédula: ${titularCedula}`, 12, firmaStartY + 35);

    // Dibujar cuadro para recibí de
    docPDF.rect(separationX, firmaStartY, tableWidth - separationX, firmaHeight); // Celda para Recibí de (derecha
    docPDF.setFontSize(10); // Tamaño de letra más pequeño
    docPDF.text(`Recibí de: ${contract.client?.name} ${contract.client?.lastname}`, separationX + 2, firmaStartY + 10);
    docPDF.setFontSize(12); // Opcional: volver al tamaño original para las siguientes líneas
    docPDF.text(`Cantidad de: ${valorPactadoHoy} dólares`, separationX + 2, firmaStartY + 20);
    docPDF.text(`Metodo de pago:  ${paymentMethod}`, separationX + 2, firmaStartY + 30);


    // Agregar una nueva página para comenzar desde la segunda cláusula
    docPDF.addPage();
    // Agregar el logo 
    agregarLogo(docPDF);
    // Definimos el espaciado entre párrafos
    const espaciado = 1;
    // Espaciado entre líneas y altura máxima de la página
    const maxAlturaPagina = docPDF.internal.pageSize.getHeight(); // Espacio útil en la página

    // Obtener la segunda cláusula
    const docSegundaRes = doc(db, 'ContractsTemplates', 'Segunda');
    const docSnapSegunda = await getDoc(docSegundaRes);
    let SegundaClausula = docSnapSegunda.exists() ? docSnapSegunda.data().contractBody || '' : '';
    // Definir las dimensiones de la página y los márgenes
    const pageWidth = 210;  // Ancho de una página A4 en mm
    const margin = 10;      // Margen de 10 mm en ambos lados
    const maxWidth = pageWidth - 2 * margin;  // Ancho máximo permitido (210 mm - 20 mm)

    const lineHeight = 7;   // Altura de línea
    let posicionY = 30;     // Posición vertical inicial del texto
    docPDF.setFontSize(12); // Establecer tamaño de fuente


    posicionY = agregarTextoJustificado(docPDF, SegundaClausula, 10, posicionY, maxWidth, lineHeight);


    // Función para verificar si hay suficiente espacio antes de agregar más contenido
    function verificarYAgregarPagina(posicionY, docPDF) {
        if (posicionY + 80 > maxAlturaPagina) {
            docPDF.addPage();
            posicionY = 30; // Reiniciar la posición en la nueva página
            agregarLogo(docPDF);
            docPDF.text('', 10, posicionY - 10);

        }
        return posicionY;
    }

    // Obtener la tercera cláusula
    const docTerceraRes = doc(db, 'ContractsTemplates', 'Tercera');
    const docSnapTercera = await getDoc(docTerceraRes);
    let TerceraClausula = docSnapTercera.exists() ? docSnapTercera.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF);
    posicionY = agregarTextoJustificado(docPDF, TerceraClausula, 10, posicionY, maxWidth, lineHeight);


    // Función para dividir el texto en partes si excede el espacio disponible
    function dividirTextoPorPaginas(docPDF, texto, maxWidth, lineHeight, posicionY, maxAlturaPagina, lineasExtra) {
        const palabras = texto.split(' ');
        let linea = '';
        let textoPagina1 = '';
        let textoPagina2 = '';
        let lineasContadas = 0; // Contador de líneas

        // Dividir el texto en líneas para verificar si cabe en la página
        for (let i = 0; i < palabras.length; i++) {
            let nuevaLinea = linea + palabras[i] + ' ';

            // Calcular el ancho de la línea actual
            const anchoLinea = docPDF.getTextWidth(nuevaLinea);

            // Si la línea excede el ancho permitido o la posición supera el alto de la página
            if (anchoLinea > maxWidth || posicionY + lineHeight > maxAlturaPagina) {
                // Si ya hemos llegado a las líneas extra, evitamos imprimir más texto
                if (lineasContadas >= lineasExtra) {
                    textoPagina2 = palabras.slice(i).join(' ');
                    break;
                }

                textoPagina1 += linea + '\n';
                posicionY += lineHeight;
                linea = palabras[i] + ' ';
                lineasContadas++;
            } else {
                linea = nuevaLinea;
            }
        }

        // Agregar cualquier texto restante a la primera página
        if (linea.trim() !== '') {
            textoPagina1 += linea;
        }

        return { textoPagina1, textoPagina2 };
    }

    // Obtener la cuarta cláusula
    const docCuartaRes = doc(db, 'ContractsTemplates', 'Cuarta');
    const docSnapCuarta = await getDoc(docCuartaRes);
    let CuartaClausula = docSnapCuarta.exists() ? docSnapCuarta.data().contractBody || '' : '';

    // Definir el número de líneas de anticipación para el corte (3 líneas antes)
    const lineasExtra = 3;

    // Dividir el texto de la cláusula en dos partes si es necesario
    let { textoPagina1, textoPagina2 } = dividirTextoPorPaginas(docPDF, CuartaClausula, maxWidth, lineHeight, posicionY, maxAlturaPagina, lineasExtra);

    // Agregar el texto de la primera página
    posicionY = agregarTextoJustificado(docPDF, textoPagina1, 10, posicionY, maxWidth, lineHeight);

    // Verificar si existe texto para la segunda página
    if (textoPagina2) {
        docPDF.addPage();  // Agregar una nueva página
        agregarLogo(docPDF);  // Agregar el logo en la segunda página
        posicionY = 30;  // Reiniciar la posición Y debajo del logo (ajusta 30 según el tamaño del logo)

        // Agregar el texto de la segunda página
        posicionY = agregarTextoJustificado(docPDF, textoPagina2, 10, posicionY, maxWidth, lineHeight);
    }




    // Obtener la quinta cláusula
    const docQuintaRes = doc(db, 'ContractsTemplates', 'Quinta');
    const docSnapQuinta = await getDoc(docQuintaRes);
    let QuintaClausula = docSnapQuinta.exists() ? docSnapQuinta.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF);
    posicionY = agregarTextoJustificado(docPDF, QuintaClausula, 10, posicionY, maxWidth, lineHeight);

    // Obtener la sexta cláusula
    const docRefSexta = doc(db, 'ContractsTemplates', 'Sexta');
    const docSnapSexta = await getDoc(docRefSexta);
    let SextaClausula = docSnapSexta.exists() ? docSnapSexta.data().contractBody || '' : '';
    const precio = contract.valorPactadoHoy;
    SextaClausula = SextaClausula.replace('{{precio}}', precio);
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF);
    posicionY = agregarTextoJustificado(docPDF, SextaClausula, 10, posicionY, maxWidth, lineHeight);

    // Obtener la séptima cláusula
    const docseptimaRes = doc(db, 'ContractsTemplates', 'Septima');
    const docSnapseptima = await getDoc(docseptimaRes);
    let septimaClausula = docSnapseptima.exists() ? docSnapseptima.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF);
    posicionY = agregarTextoJustificado(docPDF, septimaClausula, 10, posicionY, maxWidth, lineHeight);

    // Obtener la octava cláusula
    const dococtavaRes = doc(db, 'ContractsTemplates', 'Octava');
    const docSnapoctava = await getDoc(dococtavaRes);
    let octavaClausula = docSnapoctava.exists() ? docSnapoctava.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF)
    posicionY = agregarTextoJustificado(docPDF, octavaClausula, 10, posicionY, maxWidth, lineHeight);


    // Obtener la novena cláusula
    const docnovenaRes = doc(db, 'ContractsTemplates', 'Novena');
    const docSnapnovena = await getDoc(docnovenaRes);
    let novenaClausula = docSnapnovena.exists() ? docSnapnovena.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF)
    posicionY = agregarTextoJustificado(docPDF, novenaClausula, 10, posicionY, maxWidth, lineHeight);


    // Obtener la décima cláusula
    const docDecimaRes = doc(db, 'ContractsTemplates', 'Decima');
    const docSnapDecima = await getDoc(docDecimaRes);
    let decimaClausula = docSnapDecima.exists() ? docSnapDecima.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF)
    posicionY = agregarTextoJustificado(docPDF, decimaClausula, 10, posicionY, maxWidth, lineHeight);


    // Obtener la décima primera cláusula
    const docdecimaPRes = doc(db, 'ContractsTemplates', 'Decimo_primer');
    const docSnapdecimaP = await getDoc(docdecimaPRes);
    let decimaPClausula = docSnapdecimaP.exists() ? docSnapdecimaP.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF)
    posicionY = agregarTextoJustificado(docPDF, decimaPClausula, 10, posicionY, maxWidth, lineHeight);

    // Obtener la décima segunda cláusula
    const docdecimaSRes = doc(db, 'ContractsTemplates', 'Decimo_segundo');
    const docSnapdecimaS = await getDoc(docdecimaSRes);
    let decimaSClausula = docSnapdecimaS.exists() ? docSnapdecimaS.data().contractBody || '' : '';
    posicionY += espaciado;
    posicionY = verificarYAgregarPagina(posicionY, docPDF)
    posicionY = agregarTextoJustificado(docPDF, decimaSClausula, 10, posicionY, maxWidth, lineHeight);

    // Establecer la posición inicial para la firma
    const firmaFinish = posicionY + 10; // Un pequeño espaciado después de la última cláusula

    // Referencia a Firestore para obtener la firma
    const firmaDocRef = doc(db, 'ContractsTemplates', 'FIRMA'); // Documento FIRMA en la colección ContractsTemplates
    const docSFirmaStroi = await getDoc(firmaDocRef);
    const FirmaStroit = docSFirmaStroi.exists() ? docSFirmaStroi.data().firma : 'N/A';

    // Función para agregar la firma al PDF
    async function addFirmaToPDF(docPDF, yPos, firmaBase64) {
        try {
            // Validar que sea una imagen en formato base64
            if (!firmaBase64 || !firmaBase64.startsWith("data:image")) {
                throw new Error("La firma no está en formato Base64 válido.");
            }

            // Ajusta las coordenadas y el tamaño aquí
            const xPos = 75;         // Nueva posición en X
            const newYPos = yPos - 8; // Nueva posición en Y
            const newWidth = 50;     // Ancho de la imagen
            const newHeight = 20;    // Alto de la imagen

            // Agregar la firma al PDF directamente
            docPDF.addImage(firmaBase64, 'PNG', xPos, newYPos, newWidth, newHeight);
        } catch (error) {
            console.error('Error al agregar la firma al PDF:', error);
        }
    }



    //pdf
    // Función para agregar la firma al PDF
    async function addFirmaCliente2(docPDF, yPos, firmas) {
        try {
            // Validar que sea una imagen en formato base64
            if (!firmas || typeof firmas !== 'string' || !firmas.startsWith('data:image')) {
                throw new Error("La firma no está en formato Base64 válido.");
            }
            // Ajusta las coordenadas y el tamaño aquí
            const xPos = 38; // Nueva posición en X
            const newYPos = yPos + 40; // Incrementar 20 unidades en Y
            const newWidth = 30; // Nuevo ancho
            const newHeight = 13; // Nueva altura
            console.log("Valor de firmas:", firmas);

            docPDF.addImage(firmas, 'PNG', xPos, newYPos, newWidth, newHeight); // Ajusta las coordenadas y el tamaño
        } catch (error) {
            console.error('Error al agregar la firma al PDF:', error);
        }
    }

    docPDF.text(`NOMBRE DEL TITULAR: ${titularNombre}`, 12, firmaFinish);

    // Agregar la firma del cliente si existe
    if (typeof firmas === 'string' && firmas.indexOf("data:image") === 0) {
        await addFirmaCliente2(docPDF, firmaStartY - 25, firmas);
    } else {
        docPDF.text("FIRMA DEL CLIENTE NO DISPONIBLE", 28, firmaFinish + 20); // ligeramente arriba

    }

    docPDF.text('FIRMA: ___________________', 12, firmaFinish + 20);
    docPDF.text(`CÉDULA DE IDENTIDAD: ${titularCedula}`, 12, firmaFinish + 30);

    // Aquí es donde llamas la función para agregar la imagen de la firma desde Firestore
    //await addFirmaToPDF(docPDF, firmaFinish,urlFirmaCliente);
    // Obtener la URL de la firma desde Firestore

    if (FirmaStroit !== 'N/A') {
        // Agregar la imagen de la firma al PDF
        await addFirmaToPDF(docPDF, firmaFinish + 40, FirmaStroit); // Posiciona la firma en el PDF
    } else {
        console.error("La URL de la firma no es válida.");
    }
    // Texto adicional después de la firma
    docPDF.text(' ___________________', 75, firmaFinish + 50);
    docPDF.text('STROIT CORP S.A.S', 80, firmaFinish + 60);


    // Asegurarse de que todo el contenido cabe en la página
    if (posicionY + 10 > docPDF.internal.pageSize.getHeight()) {
        docPDF.addPage();
        posicionY = 10;  // Reiniciar la posición Y en la nueva página
        docPDF.text(10, posicionY); // Agregar un texto opcional en la nueva página
    }

    docPDF.save(`contrato_${contract.contractCodeaprov || 'default'}.pdf`);

    // Genera el PDF y obtén el Blob
    const pdfBlob = docPDF.output('blob'); // Obtén el Blob del PDF
    return new Blob([pdfBlob], { type: 'application/pdf' }); // Devuelve el Blob con el tipo MIME correcto

}

export default PDFGenerator;