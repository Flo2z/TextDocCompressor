async function compressFiles() {
    const files = document.getElementById('file-input').files;
    const outputContainer = document.getElementById('output-container');
    const downloadButton = document.getElementById('download-all');

    if (files.length === 0) {
        alert('Пожалуйста, выберите одно или несколько файлов для сжатия.');
        return;
    }

    outputContainer.innerHTML = '';
    downloadButton.style.display = 'none';
    const compressedFiles = [];

    for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (file.type.startsWith('image/')) {
            await compressImage(file, compressedFiles, outputContainer);
        } else if (file.type === 'application/pdf') {
            await compressPdf(file, compressedFiles);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            await compressDocx(file, compressedFiles);
        }
    }

    if (compressedFiles.length > 0) {
        downloadButton.style.display = 'block';
        downloadButton.onclick = function() {
            downloadCompressedFiles(compressedFiles);
        };
    }
}

async function compressImage(file, compressedFiles, outputContainer) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = async function(event) {
            const img = new Image();
            img.src = event.target.result;
            img.onload = async function() {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);

                let quality = 0.9;
                let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                let blob = await fetch(compressedDataUrl).then(res => res.blob());

                while (blob.size > 2 * 1024 * 1024 && quality > 0.1) {
                    quality -= 0.1;
                    compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                    blob = await fetch(compressedDataUrl).then(res => res.blob());
                }

                const compressedFile = new File([blob], file.name, { type: blob.type });
                compressedFiles.push(compressedFile);

                const compressedImg = new Image();
                compressedImg.src = compressedDataUrl;
                outputContainer.appendChild(compressedImg);

                resolve();
            };
        };
        reader.readAsDataURL(file);
    });
}

async function compressPdf(file, compressedFiles) {
    const pdfBytes = await file.arrayBuffer();
    const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);

    const newPdfDoc = await PDFLib.PDFDocument.create();
    const [firstPage] = await newPdfDoc.copyPages(pdfDoc, [0]);
    newPdfDoc.addPage(firstPage);

    const compressedPdfBytes = await newPdfDoc.save({ useObjectStreams: false });
    let blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });

    if (blob.size > 2 * 1024 * 1024) {
        blob = new Blob([compressedPdfBytes.slice(0, 2 * 1024 * 1024)], { type: 'application/pdf' });
    }

    const compressedFile = new File([blob], file.name, { type: blob.type });
    compressedFiles.push(compressedFile);
}

async function compressDocx(file, compressedFiles) {
    const arrayBuffer = await file.arrayBuffer();
    const { value: text } = await mammoth.extractRawText({ arrayBuffer });

    const blob = new Blob([text], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });

    if (blob.size > 2 * 1024 * 1024) {
    }

    const compressedFile = new File([blob], file.name, { type: blob.type });
    compressedFiles.push(compressedFile);
}
function downloadCompressedFiles(files) {
    files.forEach(file => {
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}