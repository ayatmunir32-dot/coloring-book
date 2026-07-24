// Advanced Coloring Book Application with Drawing and Flood Fill
class ColoringBook {
    constructor() {
        this.currentPageIndex = 0; // 0 = Front Cover, 1 = Title, 2 = Copyright, 3-23 = Pages 1-21, 24 = Back Cover
        this.totalPages = 25;
        this.colorableStartIndex = 3; // Pages 1-21 start at index 3
        this.colorableEndIndex = 23; // Pages 1-21 end at index 23
        this.totalColoringPages = 21;
        
        this.currentColor = '#FF6B6B';
        this.brushSize = 5;
        this.currentTool = 'draw'; // 'draw', 'fill', 'eraser'
        
        // History management
        this.history = [];
        this.historyIndex = -1;
        this.maxHistoryStates = 50;
        
        // Canvas management
        this.zoomLevel = 100;
        this.pageData = new Map(); // Store drawing data for each page (only for colorable pages)
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadPage(this.currentPageIndex);
        this.loadProgress();
    }

    initializeElements() {
        this.drawingCanvas = document.getElementById('drawingCanvas');
        this.pageImage = document.getElementById('pageImage');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        this.ctx = this.drawingCanvas.getContext('2d', { willReadFrequently: true });
        
        // UI Elements
        this.colorPalette = document.getElementById('colorPalette');
        this.customColorInput = document.getElementById('customColor');
        this.drawBtn = document.getElementById('drawBtn');
        this.floodFillBtn = document.getElementById('floodFillBtn');
        this.eraserBtn = document.getElementById('eraserBtn');
        this.brushSizeSlider = document.getElementById('brushSize');
        this.brushSizeDisplay = document.getElementById('brushSizeDisplay');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.zoomSlider = document.getElementById('zoomSlider');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        this.saveBtn = document.getElementById('saveBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.prevPageBtn = document.getElementById('prevPageBtn');
        this.nextPageBtn = document.getElementById('nextPageBtn');
        this.pageIndicator = document.getElementById('pageIndicator');
        this.statusMessage = document.getElementById('statusMessage');
    }

    setupEventListeners() {
        // Color selection
        this.colorPalette.addEventListener('click', (e) => {
            const colorOption = e.target.closest('.color-option');
            if (colorOption) {
                this.selectColor(colorOption.dataset.color);
            }
        });

        this.customColorInput.addEventListener('change', (e) => {
            this.selectColor(e.target.value);
        });

        // Tool selection
        this.drawBtn.addEventListener('click', () => this.selectTool('draw'));
        this.floodFillBtn.addEventListener('click', () => this.selectTool('fill'));
        this.eraserBtn.addEventListener('click', () => this.selectTool('eraser'));

        // Brush size
        this.brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            this.brushSizeDisplay.textContent = `${this.brushSize}px`;
        });

        // Canvas drawing
        this.drawingCanvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.drawingCanvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.drawingCanvas.addEventListener('mouseup', () => this.handleCanvasMouseUp());
        this.drawingCanvas.addEventListener('mouseout', () => this.handleCanvasMouseUp());
        
        // Touch support
        this.drawingCanvas.addEventListener('touchstart', (e) => this.handleCanvasMouseDown(e));
        this.drawingCanvas.addEventListener('touchmove', (e) => this.handleCanvasMouseMove(e));
        this.drawingCanvas.addEventListener('touchend', () => this.handleCanvasMouseUp());

        // Controls
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());
        this.clearBtn.addEventListener('click', () => this.clearPage());

        // Zoom
        this.zoomSlider.addEventListener('input', (e) => {
            this.setZoom(parseInt(e.target.value));
        });

        // Save/Export
        this.saveBtn.addEventListener('click', () => this.saveProgress());
        this.exportBtn.addEventListener('click', () => this.exportPageAsPNG());
        this.loadBtn.addEventListener('click', () => this.loadProgress());

        // Page navigation
        this.prevPageBtn.addEventListener('click', () => this.previousPage());
        this.nextPageBtn.addEventListener('click', () => this.nextPage());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    this.undo();
                } else if (e.key === 'y') {
                    e.preventDefault();
                    this.redo();
                }
            }
        });
    }

    getPageFilename(pageIndex) {
        // Map page index to filename
        // 0 = Front Cover, 1 = Title, 2 = Copyright, 3-23 = Pages 1-21, 24 = Back Cover
        if (pageIndex === 0) return 'Front Cover.png';
        if (pageIndex === 1) return 'Title page.png';
        if (pageIndex === 2) return 'Copyright page.png';
        if (pageIndex >= 3 && pageIndex <= 23) {
            const pageNum = pageIndex - 2; // Pages 1-21
            return `Page ${pageNum}.png`;
        }
        if (pageIndex === 24) return 'Back Cover.png';
        return '';
    }

    isColorablePage() {
        return this.currentPageIndex >= this.colorableStartIndex && 
               this.currentPageIndex <= this.colorableEndIndex;
    }

    getPageDisplayName(pageIndex) {
        if (pageIndex === 0) return 'Front Cover';
        if (pageIndex === 1) return 'Title Page';
        if (pageIndex === 2) return 'Copyright Page';
        if (pageIndex >= 3 && pageIndex <= 23) {
            const pageNum = pageIndex - 2;
            return `Page ${pageNum}`;
        }
        if (pageIndex === 24) return 'Back Cover';
        return 'Unknown';
    }

    loadPage(pageIndex) {
        // Save current page before loading new one
        if (this.isColorablePage() && this.currentPageIndex !== pageIndex) {
            this.savePageData();
        }

        this.currentPageIndex = pageIndex;
        const filename = this.getPageFilename(pageIndex);
        const displayName = this.getPageDisplayName(pageIndex);
        
        this.pageImage.src = filename;
        this.pageImage.onload = () => {
            this.resizeCanvas();
            if (this.isColorablePage()) {
                this.restorePageData();
            } else {
                this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
                this.drawingCanvas.style.display = 'none';
            }
            this.updatePageIndicator();
            this.updateNavigationButtons();
            this.updateToolsAvailability();
            this.showStatus(`Loaded: ${displayName}`);
        };

        this.pageImage.onerror = () => {
            this.showStatus(`Error loading ${displayName}`, true);
            console.error(`Failed to load: ${filename}`);
        };
    }

    resizeCanvas() {
        const rect = this.pageImage.getBoundingClientRect();
        const wrapper = this.canvasWrapper;
        
        this.drawingCanvas.width = this.pageImage.naturalWidth;
        this.drawingCanvas.height = this.pageImage.naturalHeight;
        
        // Position canvas absolutely over image
        this.drawingCanvas.style.width = this.pageImage.offsetWidth + 'px';
        this.drawingCanvas.style.height = this.pageImage.offsetHeight + 'px';
        
        // Show canvas for colorable pages
        if (this.isColorablePage()) {
            this.drawingCanvas.style.display = 'block';
        }
        
        // Adjust zoom if needed
        this.setZoom(this.zoomLevel);
    }

    savePageData() {
        if (this.isColorablePage()) {
            const imageData = this.ctx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            this.pageData.set(this.currentPageIndex, imageData);
        }
    }

    restorePageData() {
        if (this.isColorablePage()) {
            const savedData = this.pageData.get(this.currentPageIndex);
            if (savedData) {
                this.ctx.putImageData(savedData, 0, 0);
            } else {
                this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            }
            this.saveToHistory();
        }
    }

    selectColor(color) {
        this.currentColor = color;
        
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        const selected = document.querySelector(`[data-color="${color}"]`);
        if (selected) {
            selected.classList.add('selected');
        }

        this.showStatus(`Color: ${color}`);
    }

    selectTool(tool) {
        if (!this.isColorablePage()) {
            this.showStatus('Tools not available on this page', true);
            return;
        }

        this.currentTool = tool;
        this.drawBtn.classList.remove('active');
        this.floodFillBtn.classList.remove('active');
        this.eraserBtn.classList.remove('active');

        if (tool === 'draw') {
            this.drawBtn.classList.add('active');
            this.drawingCanvas.style.cursor = 'crosshair';
            this.showStatus('Draw mode active');
        } else if (tool === 'fill') {
            this.floodFillBtn.classList.add('active');
            this.drawingCanvas.style.cursor = 'pointer';
            this.showStatus('Flood fill mode active');
        } else if (tool === 'eraser') {
            this.eraserBtn.classList.add('active');
            this.drawingCanvas.style.cursor = 'cell';
            this.showStatus('Eraser mode active');
        }
    }

    updateToolsAvailability() {
        const isColorable = this.isColorablePage();
        this.drawBtn.disabled = !isColorable;
        this.floodFillBtn.disabled = !isColorable;
        this.eraserBtn.disabled = !isColorable;
        this.clearBtn.disabled = !isColorable;
        this.undoBtn.disabled = !isColorable;
        this.redoBtn.disabled = !isColorable;
    }

    handleCanvasMouseDown(e) {
        if (!this.isColorablePage()) return;

        if (this.currentTool === 'fill') {
            const pos = this.getCanvasPosition(e);
            this.floodFill(pos.x, pos.y);
        } else if (this.currentTool === 'draw' || this.currentTool === 'eraser') {
            this.isDrawing = true;
            this.saveToHistory();
            const pos = this.getCanvasPosition(e);
            this.draw(pos.x, pos.y);
        }
    }

    handleCanvasMouseMove(e) {
        if (!this.isDrawing || !this.isColorablePage() || (this.currentTool !== 'draw' && this.currentTool !== 'eraser')) {
            return;
        }

        const pos = this.getCanvasPosition(e);
        this.draw(pos.x, pos.y);
    }

    handleCanvasMouseUp() {
        this.isDrawing = false;
    }

    getCanvasPosition(e) {
        const rect = this.drawingCanvas.getBoundingClientRect();
        let clientX, clientY;

        if (e.touches) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = this.drawingCanvas.width / rect.width;
        const scaleY = this.drawingCanvas.height / rect.height;

        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    draw(x, y) {
        const color = this.currentTool === 'eraser' ? '#FFFFFF' : this.currentColor;
        
        this.ctx.beginPath();
        this.ctx.arc(x, y, this.brushSize / 2, 0, Math.PI * 2);
        this.ctx.fillStyle = color;
        this.ctx.fill();
        this.ctx.closePath();
    }

    floodFill(x, y) {
        this.saveToHistory();
        
        const imageData = this.ctx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        const data = imageData.data;
        const width = imageData.width;
        const height = imageData.height;

        // Get target color
        const index = (Math.floor(y) * width + Math.floor(x)) * 4;
        const targetColor = [data[index], data[index + 1], data[index + 2], data[index + 3]];

        // Get fill color
        const fillColor = this.hexToRgb(this.currentColor);

        // Check if colors are the same
        if (this.colorsEqual(targetColor, [fillColor.r, fillColor.g, fillColor.b, 255])) {
            return;
        }

        // Flood fill algorithm
        const stack = [[Math.floor(x), Math.floor(y)]];
        const visited = new Set();

        while (stack.length > 0) {
            const [px, py] = stack.pop();
            const key = `${px},${py}`;

            if (visited.has(key) || px < 0 || px >= width || py < 0 || py >= height) {
                continue;
            }

            visited.add(key);

            const idx = (py * width + px) * 4;
            const currentColor = [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];

            if (!this.colorsEqual(currentColor, targetColor)) {
                continue;
            }

            // Fill the pixel
            data[idx] = fillColor.r;
            data[idx + 1] = fillColor.g;
            data[idx + 2] = fillColor.b;
            data[idx + 3] = 255;

            // Add neighbors
            stack.push([px + 1, py]);
            stack.push([px - 1, py]);
            stack.push([px, py + 1]);
            stack.push([px, py - 1]);
        }

        this.ctx.putImageData(imageData, 0, 0);
        this.showStatus('Area filled!');
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    }

    colorsEqual(color1, color2) {
        return color1[0] === color2[0] && 
               color1[1] === color2[1] && 
               color1[2] === color2[2];
    }

    setZoom(zoom) {
        this.zoomLevel = zoom;
        this.zoomLevelDisplay.textContent = `${zoom}%`;
        
        const scaleValue = zoom / 100;
        this.canvasWrapper.style.transform = `scale(${scaleValue})`;
        this.canvasWrapper.style.transformOrigin = 'top center';
    }

    clearPage() {
        if (!this.isColorablePage()) {
            this.showStatus('Cannot clear non-colorable pages', true);
            return;
        }

        if (confirm('Clear all drawings on this page?')) {
            this.saveToHistory();
            this.ctx.clearRect(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
            this.showStatus('Page cleared!');
        }
    }

    saveToHistory() {
        if (!this.isColorablePage()) return;

        this.history = this.history.slice(0, this.historyIndex + 1);
        const imageData = this.ctx.getImageData(0, 0, this.drawingCanvas.width, this.drawingCanvas.height);
        this.history.push(imageData);
        this.historyIndex++;

        if (this.history.length > this.maxHistoryStates) {
            this.history.shift();
            this.historyIndex--;
        }

        this.updateHistoryButtons();
    }

    undo() {
        if (!this.isColorablePage() || this.historyIndex <= 0) return;

        this.historyIndex--;
        this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        this.updateHistoryButtons();
        this.showStatus('Undo!');
    }

    redo() {
        if (!this.isColorablePage() || this.historyIndex >= this.history.length - 1) return;

        this.historyIndex++;
        this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        this.updateHistoryButtons();
        this.showStatus('Redo!');
    }

    updateHistoryButtons() {
        const canUndo = this.isColorablePage() && this.historyIndex > 0;
        const canRedo = this.isColorablePage() && this.historyIndex < this.history.length - 1;
        
        this.undoBtn.disabled = !canUndo;
        this.redoBtn.disabled = !canRedo;
    }

    previousPage() {
        if (this.currentPageIndex > 0) {
            this.loadPage(this.currentPageIndex - 1);
        }
    }

    nextPage() {
        if (this.currentPageIndex < this.totalPages - 1) {
            this.loadPage(this.currentPageIndex + 1);
        }
    }

    updatePageIndicator() {
        const displayName = this.getPageDisplayName(this.currentPageIndex);
        if (this.isColorablePage()) {
            const coloringPageNum = this.currentPageIndex - 2;
            this.pageIndicator.textContent = `${displayName} (${coloringPageNum} of ${this.totalColoringPages})`;
        } else {
            this.pageIndicator.textContent = displayName;
        }
    }

    updateNavigationButtons() {
        this.prevPageBtn.disabled = this.currentPageIndex <= 0;
        this.nextPageBtn.disabled = this.currentPageIndex >= this.totalPages - 1;
    }

    saveProgress() {
        try {
            this.savePageData();
            const progress = {};
            
            for (let [page, imageData] of this.pageData.entries()) {
                progress[page] = imageData.data.buffer;
            }

            localStorage.setItem('coloringBookProgress', JSON.stringify({
                pages: Object.fromEntries(this.pageData),
                currentPage: this.currentPageIndex
            }));

            this.showStatus('✓ Progress saved!');
        } catch (e) {
            this.showStatus('Error saving progress', true);
        }
    }

    loadProgress() {
        try {
            const saved = localStorage.getItem('coloringBookProgress');
            if (saved) {
                const data = JSON.parse(saved);
                this.showStatus('✓ Progress loaded!');
            }
        } catch (e) {
            this.showStatus('Error loading progress', true);
        }
    }

    exportPageAsPNG() {
        if (!this.isColorablePage()) {
            this.showStatus('Cannot export non-colorable pages', true);
            return;
        }

        try {
            this.showStatus('Exporting page as PNG...');

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = this.drawingCanvas.width;
            tempCanvas.height = this.drawingCanvas.height;
            const tempCtx = tempCanvas.getContext('2d');

            // Draw the page image
            tempCtx.drawImage(this.pageImage, 0, 0);

            // Draw the canvas overlay
            tempCtx.drawImage(this.drawingCanvas, 0, 0);

            // Export as PNG
            const link = document.createElement('a');
            link.href = tempCanvas.toDataURL('image/png');
            const coloringPageNum = this.currentPageIndex - 2;
            link.download = `coloring-page-${coloringPageNum}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            this.showStatus('✓ Page exported successfully!');
        } catch (error) {
            this.showStatus('Error exporting page', true);
            console.error(error);
        }
    }

    showStatus(message, isError = false) {
        this.statusMessage.textContent = message;
        this.statusMessage.style.color = isError ? '#e53e3e' : '#2d3748';

        setTimeout(() => {
            this.statusMessage.textContent = 'Ready to color!';
            this.statusMessage.style.color = '#2d3748';
        }, 3000);
    }
}

// Initialize the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ColoringBook();
});
