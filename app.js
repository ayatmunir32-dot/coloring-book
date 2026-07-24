// Coloring Book Application
class ColoringBook {
    constructor() {
        this.currentColor = '#FF6B6B';
        this.history = [];
        this.historyIndex = -1;
        this.zoomLevel = 100;
        this.colorFills = new Map(); // Store fill colors for each element

        this.initializeElements();
        this.createSampleColoringPage();
        this.setupEventListeners();
        this.loadProgress();
        this.saveToHistory();
    }

    initializeElements() {
        this.canvas = document.getElementById('canvas');
        this.canvasWrapper = document.getElementById('canvasWrapper');
        this.colorPalette = document.getElementById('colorPalette');
        this.customColorInput = document.getElementById('customColor');
        this.undoBtn = document.getElementById('undoBtn');
        this.redoBtn = document.getElementById('redoBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.zoomSlider = document.getElementById('zoomSlider');
        this.zoomLevelDisplay = document.getElementById('zoomLevel');
        this.saveBtn = document.getElementById('saveBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.loadBtn = document.getElementById('loadBtn');
        this.statusMessage = document.getElementById('statusMessage');
    }

    setupEventListeners() {
        // Color palette selection
        this.colorPalette.addEventListener('click', (e) => {
            const colorOption = e.target.closest('.color-option');
            if (colorOption) {
                this.selectColor(colorOption.dataset.color);
            }
        });

        // Custom color input
        this.customColorInput.addEventListener('change', (e) => {
            this.selectColor(e.target.value);
        });

        // Canvas clicking
        this.canvas.addEventListener('click', (e) => {
            const element = e.target.closest('[data-colorable="true"]');
            if (element) {
                this.fillElement(element);
            }
        });

        // Undo/Redo
        this.undoBtn.addEventListener('click', () => this.undo());
        this.redoBtn.addEventListener('click', () => this.redo());
        this.clearBtn.addEventListener('click', () => this.clearAll());

        // Zoom
        this.zoomSlider.addEventListener('input', (e) => {
            this.setZoom(parseInt(e.target.value));
        });

        // Export/Save
        this.saveBtn.addEventListener('click', () => this.saveProgress());
        this.exportBtn.addEventListener('click', () => this.exportAsPNG());
        this.loadBtn.addEventListener('click', () => this.loadProgress());

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

    createSampleColoringPage() {
        // Clear existing content
        this.canvas.innerHTML = '';

        // Create a sample coloring page with various shapes
        const svgNS = 'http://www.w3.org/2000/svg';

        // Simple flower design with petals and stem
        // Flower petals
        const petals = [
            { cx: 400, cy: 150, r: 60 },
            { cx: 480, cy: 200, r: 60 },
            { cx: 480, cy: 280, r: 60 },
            { cx: 400, cy: 330, r: 60 },
            { cx: 320, cy: 280, r: 60 },
            { cx: 320, cy: 200, r: 60 },
        ];

        petals.forEach((petal, idx) => {
            const circle = document.createElementNS(svgNS, 'circle');
            circle.setAttribute('cx', petal.cx);
            circle.setAttribute('cy', petal.cy);
            circle.setAttribute('r', petal.r);
            circle.setAttribute('fill', '#FFFFFF');
            circle.setAttribute('stroke', '#333');
            circle.setAttribute('stroke-width', '2');
            circle.setAttribute('data-colorable', 'true');
            circle.setAttribute('data-id', `petal-${idx}`);
            this.canvas.appendChild(circle);
        });

        // Flower center
        const center = document.createElementNS(svgNS, 'circle');
        center.setAttribute('cx', 400);
        center.setAttribute('cy', 240);
        center.setAttribute('r', 40);
        center.setAttribute('fill', '#FFFFFF');
        center.setAttribute('stroke', '#333');
        center.setAttribute('stroke-width', '2');
        center.setAttribute('data-colorable', 'true');
        center.setAttribute('data-id', 'center');
        this.canvas.appendChild(center);

        // Stem
        const stem = document.createElementNS(svgNS, 'rect');
        stem.setAttribute('x', 390);
        stem.setAttribute('y', 280);
        stem.setAttribute('width', 20);
        stem.setAttribute('height', 150);
        stem.setAttribute('fill', '#FFFFFF');
        stem.setAttribute('stroke', '#333');
        stem.setAttribute('stroke-width', '2');
        stem.setAttribute('data-colorable', 'true');
        stem.setAttribute('data-id', 'stem');
        this.canvas.appendChild(stem);

        // Leaves
        const leaves = [
            {
                points: '380,320 350,350 370,360',
                id: 'leaf-1'
            },
            {
                points: '420,320 450,350 430,360',
                id: 'leaf-2'
            }
        ];

        leaves.forEach(leaf => {
            const polygon = document.createElementNS(svgNS, 'polygon');
            polygon.setAttribute('points', leaf.points);
            polygon.setAttribute('fill', '#FFFFFF');
            polygon.setAttribute('stroke', '#333');
            polygon.setAttribute('stroke-width', '2');
            polygon.setAttribute('data-colorable', 'true');
            polygon.setAttribute('data-id', leaf.id);
            this.canvas.appendChild(polygon);
        });

        // Butterfly wings
        const butterfly = [
            // Top left wing
            {
                cx: 600,
                cy: 150,
                rx: 50,
                ry: 70,
                id: 'butterfly-tlw'
            },
            // Top right wing
            {
                cx: 700,
                cy: 150,
                rx: 50,
                ry: 70,
                id: 'butterfly-trw'
            },
            // Bottom left wing
            {
                cx: 590,
                cy: 280,
                rx: 40,
                ry: 60,
                id: 'butterfly-blw'
            },
            // Bottom right wing
            {
                cx: 710,
                cy: 280,
                rx: 40,
                ry: 60,
                id: 'butterfly-brw'
            }
        ];

        butterfly.forEach(wing => {
            const ellipse = document.createElementNS(svgNS, 'ellipse');
            ellipse.setAttribute('cx', wing.cx);
            ellipse.setAttribute('cy', wing.cy);
            ellipse.setAttribute('rx', wing.rx);
            ellipse.setAttribute('ry', wing.ry);
            ellipse.setAttribute('fill', '#FFFFFF');
            ellipse.setAttribute('stroke', '#333');
            ellipse.setAttribute('stroke-width', '2');
            ellipse.setAttribute('data-colorable', 'true');
            ellipse.setAttribute('data-id', wing.id);
            this.canvas.appendChild(ellipse);
        });

        // Butterfly body
        const body = document.createElementNS(svgNS, 'circle');
        body.setAttribute('cx', 650);
        body.setAttribute('cy', 220);
        body.setAttribute('r', 15);
        body.setAttribute('fill', '#FFFFFF');
        body.setAttribute('stroke', '#333');
        body.setAttribute('stroke-width', '2');
        body.setAttribute('data-colorable', 'true');
        body.setAttribute('data-id', 'butterfly-body');
        this.canvas.appendChild(body);

        // Sun
        const sunCircle = document.createElementNS(svgNS, 'circle');
        sunCircle.setAttribute('cx', 150);
        sunCircle.setAttribute('cy', 100);
        sunCircle.setAttribute('r', 40);
        sunCircle.setAttribute('fill', '#FFFFFF');
        sunCircle.setAttribute('stroke', '#333');
        sunCircle.setAttribute('stroke-width', '2');
        sunCircle.setAttribute('data-colorable', 'true');
        sunCircle.setAttribute('data-id', 'sun');
        this.canvas.appendChild(sunCircle);

        // Sun rays
        for (let i = 0; i < 8; i++) {
            const angle = (i * 45) * Math.PI / 180;
            const x1 = 150 + 40 * Math.cos(angle);
            const y1 = 100 + 40 * Math.sin(angle);
            const x2 = 150 + 70 * Math.cos(angle);
            const y2 = 100 + 70 * Math.sin(angle);

            const line = document.createElementNS(svgNS, 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#333');
            line.setAttribute('stroke-width', '2');
            this.canvas.appendChild(line);
        }

        // Cloud
        const cloudGroup = [
            { cx: 250, cy: 80, r: 25 },
            { cx: 280, cy: 70, r: 30 },
            { cx: 310, cy: 80, r: 25 }
        ];

        cloudGroup.forEach((circle, idx) => {
            const cloudPart = document.createElementNS(svgNS, 'circle');
            cloudPart.setAttribute('cx', circle.cx);
            cloudPart.setAttribute('cy', circle.cy);
            cloudPart.setAttribute('r', circle.r);
            cloudPart.setAttribute('fill', '#FFFFFF');
            cloudPart.setAttribute('stroke', '#333');
            cloudPart.setAttribute('stroke-width', '2');
            cloudPart.setAttribute('data-colorable', 'true');
            cloudPart.setAttribute('data-id', `cloud-${idx}`);
            this.canvas.appendChild(cloudPart);
        });
    }

    selectColor(color) {
        this.currentColor = color;
        
        // Update visual indication
        document.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        const selected = document.querySelector(`[data-color="${color}"]`);
        if (selected) {
            selected.classList.add('selected');
        }

        this.showStatus(`Color selected: ${color}`);
    }

    fillElement(element) {
        const elementId = element.getAttribute('data-id');
        
        // Store the current state before changing
        this.saveToHistory();
        
        // Apply the color
        element.setAttribute('fill', this.currentColor);
        this.colorFills.set(elementId, this.currentColor);
        
        this.showStatus(`Filled: ${elementId}`);
    }

    clearAll() {
        if (confirm('Are you sure you want to clear all colors?')) {
            this.saveToHistory();
            document.querySelectorAll('[data-colorable="true"]').forEach(element => {
                element.setAttribute('fill', '#FFFFFF');
            });
            this.colorFills.clear();
            this.showStatus('All colors cleared!');
        }
    }

    setZoom(zoom) {
        this.zoomLevel = zoom;
        this.zoomLevelDisplay.textContent = `${zoom}%`;
        
        const scaleValue = zoom / 100;
        this.canvasWrapper.style.transform = `scale(${scaleValue})`;
        this.canvasWrapper.style.transformOrigin = 'top center';
    }

    saveToHistory() {
        // Remove any redo history if we're making a new change
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Save current state
        const state = this.getState();
        this.history.push(state);
        this.historyIndex++;
        
        this.updateHistoryButtons();
    }

    getState() {
        const state = new Map();
        document.querySelectorAll('[data-colorable="true"]').forEach(element => {
            const id = element.getAttribute('data-id');
            const color = element.getAttribute('fill');
            state.set(id, color);
        });
        return state;
    }

    setState(state) {
        document.querySelectorAll('[data-colorable="true"]').forEach(element => {
            const id = element.getAttribute('data-id');
            const color = state.get(id) || '#FFFFFF';
            element.setAttribute('fill', color);
        });
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.setState(this.history[this.historyIndex]);
            this.showStatus('Undo!');
            this.updateHistoryButtons();
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.setState(this.history[this.historyIndex]);
            this.showStatus('Redo!');
            this.updateHistoryButtons();
        }
    }

    updateHistoryButtons() {
        this.undoBtn.disabled = this.historyIndex <= 0;
        this.redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    saveProgress() {
        const state = this.getState();
        const stateArray = Array.from(state.entries());
        localStorage.setItem('coloringBookProgress', JSON.stringify(stateArray));
        this.showStatus('✓ Progress saved locally!');
    }

    loadProgress() {
        const saved = localStorage.getItem('coloringBookProgress');
        if (saved) {
            try {
                const stateArray = JSON.parse(saved);
                const state = new Map(stateArray);
                this.setState(state);
                this.saveToHistory();
                this.showStatus('✓ Progress loaded!');
            } catch (e) {
                this.showStatus('Error loading progress', true);
            }
        } else {
            this.showStatus('No saved progress found');
        }
    }

    async exportAsPNG() {
        try {
            this.showStatus('Exporting PNG...');
            
            // Get SVG data
            const svgData = new XMLSerializer().serializeToString(this.canvas);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(svgBlob);
            
            // Create canvas and convert to PNG
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Download
                const pngUrl = canvas.toDataURL('image/png');
                const downloadLink = document.createElement('a');
                downloadLink.href = pngUrl;
                downloadLink.download = `coloring-book-${new Date().toISOString().split('T')[0]}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
                URL.revokeObjectURL(url);
                
                this.showStatus('✓ PNG exported successfully!');
            };
            img.src = url;
        } catch (error) {
            this.showStatus('Error exporting PNG', true);
            console.error(error);
        }
    }

    showStatus(message, isError = false) {
        this.statusMessage.textContent = message;
        this.statusMessage.style.color = isError ? '#e53e3e' : '#2d3748';
        
        // Clear after 3 seconds
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
