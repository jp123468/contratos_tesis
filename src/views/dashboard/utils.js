export const agregarTextoJustificado = (doc, text, x, y, maxWidth, lineHeight) => {
    const lines = doc.splitTextToSize(text, maxWidth);
    let yOffset = y;

    lines.forEach((line, index) => {
        const words = line.trim().split(/\s+/); // Dividimos las palabras por espacios
        const totalTextWidth = words.reduce((acc, word) => acc + doc.getTextWidth(word), 0);
        const remainingSpace = maxWidth - totalTextWidth; // Espacio sobrante para justificar

        const numberOfSpaces = words.length - 1; // Número de espacios originales

        // Solo justificar si no es la última línea y si hay más de una palabra
        if (index !== lines.length - 1 && numberOfSpaces > 0) {
            const extraSpacePerWord = remainingSpace / numberOfSpaces; // Espacio adicional entre las palabras

            let xOffset = x;
            words.forEach((word, i) => {
                doc.text(word, xOffset, yOffset); // Escribimos la palabra

                if (i < words.length - 1) {
                    const spaceWidth = doc.getTextWidth(' '); // Ancho del espacio original
                    xOffset += doc.getTextWidth(word) + spaceWidth + extraSpacePerWord; // Añadir la palabra y el espacio justificado
                }
            });
        } else {
            // Para la última línea o si hay una sola palabra, solo alinear a la izquierda
            doc.text(line, x, yOffset);
        }

        yOffset += lineHeight; // Avanzar en la línea siguiente
    });

    return yOffset; // Devolver la posición Y al final
};
