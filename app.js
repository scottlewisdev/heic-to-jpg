document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const imageGallery = document.getElementById('imageGallery');
    const downloadAllBtn = document.getElementById('downloadAll');
    const conversionStatus = document.querySelector('.conversion-status');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');

    let convertedImages = [];

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    // Handle file drop
    dropZone.addEventListener('drop', (e) => {
        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    });

    // Handle file input change
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    });

    async function handleFiles(files) {
        const heicFiles = files.filter(file => 
            file.name.toLowerCase().endsWith('.heic'));

        if (heicFiles.length === 0) {
            alert('Please select HEIC files only.');
            return;
        }

        convertedImages = [];
        imageGallery.innerHTML = '';
        conversionStatus.style.display = 'block';
        downloadAllBtn.style.display = 'none';

        for (let i = 0; i < heicFiles.length; i++) {
            const file = heicFiles[i];
            statusText.textContent = `Converting ${i + 1} of ${heicFiles.length}`;
            progressBar.style.width = `${((i + 1) / heicFiles.length) * 100}%`;

            try {
                const jpgBlob = await convertHeicToJpg(file);
                const jpgUrl = URL.createObjectURL(jpgBlob);
                convertedImages.push({
                    name: file.name.replace(/\.heic$/i, '.jpg'),
                    originalName: file.name,
                    blob: jpgBlob
                });
                displayImage(jpgUrl, file.name);
            } catch (error) {
                console.error('Error converting file:', error);
            }
        }

        if (convertedImages.length > 0) {
            downloadAllBtn.style.display = 'block';
        }
        conversionStatus.style.display = 'none';
    }

    async function convertHeicToJpg(file) {
        const arrayBuffer = await file.arrayBuffer();
        const blob = await heic2any({
            blob: new Blob([arrayBuffer]),
            toType: 'image/jpeg',
            quality: 0.8
        });
        return blob;
    }

    function displayImage(url, filename) {
        const div = document.createElement('div');
        div.className = 'image-item';

        const img = document.createElement('img');
        img.src = url;
        img.className = 'image-preview';
        img.alt = filename;

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'download-btn';
        downloadBtn.textContent = 'Download';
        downloadBtn.onclick = () => downloadImage(filename);

        div.appendChild(img);
        div.appendChild(downloadBtn);
        imageGallery.appendChild(div);
    }

    function downloadImage(filename) {
        try {
            const image = convertedImages.find(img => 
                img.originalName.toLowerCase() === filename.toLowerCase()
            );
            
            if (!image) {
                console.error('Image not found:', originalName);
                console.log('Available images:', convertedImages.map(img => img.name));
                return;
            }

            const link = document.createElement('a');
            link.href = URL.createObjectURL(image.blob);
            link.download = image.name;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL object
            URL.revokeObjectURL(link.href);
        } catch (error) {
            console.error('Error downloading image:', error);
        }
    }

    downloadAllBtn.addEventListener('click', async () => {
        if (convertedImages.length === 0) return;

        const zip = new JSZip();
        convertedImages.forEach(image => {
            const jpgFilename = image.name.replace(/\.heic$/i, '.jpg');
            zip.file(jpgFilename, image.blob);
        });

        const zipBlob = await zip.generateAsync({type: 'blob'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = 'converted_images.zip';
        link.click();
    });
});