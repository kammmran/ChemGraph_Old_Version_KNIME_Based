document.addEventListener('DOMContentLoaded', () => {
    const components = document.querySelectorAll('.component');
    const workspace = document.querySelector('.workspace');
    const propertiesPanel = document.querySelector('.properties-panel');
    let componentData = {};
    let zIndexCounter = 1;
    let selectedPoint = null;
    const arrows = new Set();
    const connections = new Map(); // Store connections between points

    const catalysts = ['H2SO4', 'NaOH', 'Zeolite', 'Platinum', 'Palladium'];
    let selectedArrow = null;

    // Load CSV data
    fetch('/static/data/components.csv')
        .then(response => response.text())
        .then(csv => {
            const lines = csv.split('\n');
            const headers = lines[0].split(',');
            
            for(let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',');
                const id = values[0];
                componentData[id] = {
                    name: values[1],
                    temperature: values[2],
                    pressure: values[3],
                    rawMaterials: values[4].replace(/"/g, '').split(';'),
                    outputMaterials: values[5].replace(/"/g, '').split(';')
                };
            }
        });

    components.forEach(component => {
        component.addEventListener('dragstart', dragStart);
        const img = component.querySelector('img');
        if (img) {
            img.addEventListener('dragstart', (e) => {
                // Instead of stopping propagation, handle the drag from image
                dragStart(e);
            });
        }
    });

    workspace.addEventListener('dragover', dragOver);
    workspace.addEventListener('drop', drop);

    function dragStart(e) {
        // Get the component whether dragging started from image or component
        const component = e.target.closest('.component');
        const imgElement = component.querySelector('img');
        const componentId = component.id;
        
        e.dataTransfer.setData('application/json', JSON.stringify({
            id: componentId,
            name: component.querySelector('span').textContent,
            imgSrc: imgElement.src,
            originalWidth: imgElement.width,
            originalHeight: imgElement.height
        }));
    }

    function dragOver(e) {
        e.preventDefault();
    }

    function drop(e) {
        e.preventDefault();
        const data = JSON.parse(e.dataTransfer.getData('application/json'));
        
        const node = document.createElement('div');
        node.classList.add('workspace-component');
        node.style.position = 'absolute';
        node.style.left = `${e.offsetX}px`;
        node.style.top = `${e.offsetY}px`;
        node.draggable = true;
        node.dataset.componentId = data.id;  // Store component ID
        
        const img = document.createElement('img');
        img.src = data.imgSrc;
        img.width = data.originalWidth;
        img.height = data.originalHeight;
        
        const span = document.createElement('span');
        span.textContent = data.name;
        
        node.appendChild(img);
        node.appendChild(span);
        workspace.appendChild(node);

        node.style.zIndex = zIndexCounter++;
        addConnectionPoints(node, data.id);

        // Add movement functionality to the workspace component
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;

        node.addEventListener('dragstart', (e) => {
            // Only allow drag if no connection point is selected
            if (selectedPoint) {
                e.preventDefault();
                return;
            }
            isDragging = true;
            initialX = e.clientX - node.offsetLeft;
            initialY = e.clientY - node.offsetTop;
            
            // Add selection when starting to drag
            document.querySelectorAll('.workspace-component').forEach(comp => {
                comp.classList.remove('selected');
            });
            node.classList.add('selected');
        });

        node.addEventListener('dragend', (e) => {
            if (isDragging) {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
                node.style.left = `${currentX}px`;
                node.style.top = `${currentY}px`;
                isDragging = false;
                // Maintain selection after dropping
                node.classList.add('selected');
                updateAllArrows(); // Update arrows after movement
            }
        });

        // Add click handler for selection
        node.addEventListener('click', (e) => {
            // Remove selection from all other components
            document.querySelectorAll('.workspace-component').forEach(comp => {
                comp.classList.remove('selected');
            });
            // Add selection to clicked component
            node.classList.add('selected');
            showProperties(node.dataset.componentId);
            e.stopPropagation();
        });

        node.addEventListener('mousedown', () => {
            node.style.zIndex = zIndexCounter++;
        });
    }

    function addConnectionPoints(node, componentId) {
        if (componentId.startsWith('sugar') || componentId.startsWith('ligno') || componentId.startsWith('waste')) {
            // Feedstock components only get right connection point
            const rightPoint = document.createElement('div');
            rightPoint.className = 'connection-point right';
            rightPoint.addEventListener('click', (e) => handleConnectionPoint(e, node));
            node.appendChild(rightPoint);
        } else if (componentId.startsWith('shell') || componentId.startsWith('plate') || 
                   componentId.startsWith('spiral') || componentId.startsWith('air')) {
            // Heat exchangers get connection points in the middle of left and right sides
            const leftPoint = document.createElement('div');
            leftPoint.className = 'connection-point left middle';
            
            const rightPoint = document.createElement('div');
            rightPoint.className = 'connection-point right middle';
            
            [leftPoint, rightPoint].forEach(point => {
                point.addEventListener('click', (e) => handleConnectionPoint(e, node));
                node.appendChild(point);
            });
        } else if (componentId.startsWith('pump') || componentId === 'reactor1') {
            // Other components get both left and right points at default positions
            const leftPoint = document.createElement('div');
            leftPoint.className = 'connection-point left';
            
            const rightPoint = document.createElement('div');
            rightPoint.className = 'connection-point right';
            
            [leftPoint, rightPoint].forEach(point => {
                point.addEventListener('click', (e) => handleConnectionPoint(e, node));
                node.appendChild(point);
            });
        }
    }

    const connectionPoints = new Map(); // Track connected points

    function handleConnectionPoint(e, node) {
        e.stopPropagation();
        const point = e.target;

        if (!selectedPoint) {
            selectedPoint = point;
            point.style.backgroundColor = '#e74c3c';
        } else if (selectedPoint !== point) {
            // Check if either point is already connected
            if (isPointConnected(selectedPoint) || isPointConnected(point)) {
                selectedPoint.style.backgroundColor = '#3498db';
                selectedPoint = null;
                return;
            }
            
            drawArrow(selectedPoint, point);
            // Track the connection
            connectionPoints.set(selectedPoint, point);
            connectionPoints.set(point, selectedPoint);
            
            selectedPoint.style.backgroundColor = '#3498db';
            selectedPoint = null;
        }
    }

    function isPointConnected(point) {
        return connectionPoints.has(point);
    }

    function drawArrow(start, end) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.classList.add('arrow-line');
        
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.classList.add('arrow-text');
        text.textContent = 'Select Catalyst';
        text.addEventListener('click', (e) => {
            e.stopPropagation();
            showCatalystProperties(group);
        });
        
        group.appendChild(line);
        group.appendChild(text);
        
        connections.set(group, { start, end, line, text });
        
        updateArrowPosition(group);
        workspace.querySelector('svg').appendChild(group);
    }

    function updateArrowPosition(group) {
        const connection = connections.get(group);
        const startRect = connection.start.getBoundingClientRect();
        const endRect = connection.end.getBoundingClientRect();
        const workspaceRect = workspace.getBoundingClientRect();
        
        const x1 = startRect.left - workspaceRect.left + connection.start.offsetWidth/2;
        const y1 = startRect.top - workspaceRect.top + connection.start.offsetHeight/2;
        const x2 = endRect.left - workspaceRect.left + connection.end.offsetWidth/2;
        const y2 = endRect.top - workspaceRect.top + connection.end.offsetHeight/2;
        
        // Update line position
        connection.line.setAttribute('x1', x1);
        connection.line.setAttribute('y1', y1);
        connection.line.setAttribute('x2', x2);
        connection.line.setAttribute('y2', y2);
        
        // Update text position (middle of the line)
        const textX = (x1 + x2) / 2;
        const textY = (y1 + y2) / 2;
        connection.text.setAttribute('x', textX);
        connection.text.setAttribute('y', textY);
        connection.text.setAttribute('text-anchor', 'middle');
        connection.text.setAttribute('dy', '-5');
    }

    function updateAllArrows() {
        connections.forEach((value, arrow) => {
            updateArrowPosition(arrow);
        });
    }

    function showProperties(componentId) {
        const data = componentData[componentId];
        const propertiesForm = document.getElementById('propertiesForm');
        propertiesForm.innerHTML = `
            <div>
                <label>Temperature (°C):</label>
                <input type="number" value="${data.temperature}" />
            </div>
            <div>
                <label>Pressure (bar):</label>
                <input type="number" value="${data.pressure}" />
            </div>
            <div>
                <label>Raw Materials:</label>
                <textarea readonly>${data.rawMaterials.join(', ')}</textarea>
            </div>
            <div>
                <label>Output Materials:</label>
                <textarea readonly>${data.outputMaterials.join(', ')}</textarea>
            </div>
        `;
        propertiesPanel.classList.add('visible');
    }

    function showCatalystProperties(arrow) {
        selectedArrow = arrow;
        const propertiesForm = document.getElementById('propertiesForm');
        propertiesForm.innerHTML = `
            <div>
                <label>Select Catalyst:</label>
                <select id="catalystSelect" class="catalyst-select">
                    <option value="">Choose a catalyst</option>
                    ${catalysts.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
        `;

        const select = propertiesForm.querySelector('#catalystSelect');
        select.addEventListener('change', (e) => {
            const connection = connections.get(selectedArrow);
            connection.text.textContent = e.target.value || 'Select Catalyst';
        });

        propertiesPanel.classList.add('visible');
    }

    function hideProperties() {
        propertiesPanel.classList.remove('visible');
    }

    // Click on workspace to deselect all
    workspace.addEventListener('click', () => {
        document.querySelectorAll('.workspace-component').forEach(comp => {
            comp.classList.remove('selected');
        });
        hideProperties();
        if (selectedPoint) {
            selectedPoint.style.backgroundColor = '#3498db';
            selectedPoint = null;
        }
        selectedArrow = null;
    });

    // Add delete keyboard handler
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Delete') {
            const selectedComponent = workspace.querySelector('.workspace-component.selected');
            if (selectedComponent) {
                // Remove connection tracking for deleted component's points
                selectedComponent.querySelectorAll('.connection-point').forEach(point => {
                    const connectedPoint = connectionPoints.get(point);
                    if (connectedPoint) {
                        connectionPoints.delete(connectedPoint);
                        connectionPoints.delete(point);
                    }
                });
                
                // Remove arrows and connections
                connections.forEach((connection, arrow) => {
                    if (selectedComponent.contains(connection.start) || 
                        selectedComponent.contains(connection.end)) {
                        arrow.remove();
                        connections.delete(arrow);
                    }
                });
                
                selectedComponent.remove();
                hideProperties();
            }
        }
    });

    const componentTypes = {
        feedstock: {  // Add feedstock to componentTypes
            sugar: [
                { id: 'sugar1', name: 'Glucose', img: 'glucose.png' },
                { id: 'sugar2', name: 'Sucrose', img: 'sucrose.png' },
                { id: 'sugar3', name: 'Starch', img: 'starch.png' }
            ],
            ligno: [
                { id: 'ligno1', name: 'Cellulose', img: 'cellulose.png' },
                { id: 'ligno2', name: 'Hemicellulose', img: 'hemicellulose.png' },
                { id: 'ligno3', name: 'Lignin', img: 'lignin.png' }
            ],
            waste: [
                { id: 'waste1', name: 'Plastic Waste', img: 'plastic.png' },
                { id: 'waste2', name: 'Food Waste', img: 'food.png' },
                { id: 'waste3', name: 'Chemical Waste', img: 'chemical.png' }
            ]
        },
        // Existing feedstock types...
        reactor: {
            batch: [
                { id: 'batch1', name: 'Batch Reactor', img: 'batch.png', temperature: '80-150', pressure: '1-10' },
                { id: 'batch2', name: 'Jacketed Batch', img: 'jacketed.png', temperature: '60-120', pressure: '1-5' }
            ],
            cstr: [
                { id: 'cstr1', name: 'CSTR', img: 'cstr.png', temperature: '70-200', pressure: '1-20' }
            ],
            pfr: [
                { id: 'pfr1', name: 'Tubular PFR', img: 'pfr.png', temperature: '100-300', pressure: '5-50' }
            ],
            fbr: [
                { id: 'fbr1', name: 'Fluidized Bed', img: 'fbr.png', temperature: '200-900', pressure: '1-70' }
            ]
        },
        exchanger: {
            shell: [
                { id: 'shell1', name: 'Shell & Tube', img: 'shell.png', temperature: '20-500', pressure: '1-300' }
            ],
            plate: [
                { id: 'plate1', name: 'Plate HE', img: 'plate.png', temperature: '20-200', pressure: '1-25' }
            ],
            spiral: [
                { id: 'spiral1', name: 'Spiral HE', img: 'spiral.png', temperature: '20-400', pressure: '1-100' }
            ],
            air: [
                { id: 'air1', name: 'Air Cooled', img: 'air.png', temperature: '40-200', pressure: '1-50' }
            ]
        },
        pump: {
            centrifugal: [
                { id: 'pump1', name: 'Centrifugal', img: 'centrifugal.png', pressure: '1-50', flow: '1-1000' }
            ],
            positive: [
                { id: 'pump2', name: 'Reciprocating', img: 'reciprocating.png', pressure: '10-1000', flow: '0.1-100' }
            ],
            gear: [
                { id: 'pump3', name: 'Gear Pump', img: 'gear_pump.png', pressure: '1-120', flow: '0.1-50' }
            ],
            screw: [
                { id: 'pump4', name: 'Screw Pump', img: 'screw_pump.png', pressure: '1-100', flow: '1-200' }
            ]
        },
        separator: {
            distillation: [
                { id: 'dist1', name: 'Distillation Column', img: 'distillation.png', temperature: '50-150', pressure: '1-3' },
                { id: 'dist2', name: 'Vacuum Distillation', img: 'vacuum_dist.png', temperature: '40-100', pressure: '0.1-0.5' }
            ],
            filter: [
                { id: 'filter1', name: 'Pressure Filter', img: 'press_filter.png', pressure: '2-10', flow: '1-50' },
                { id: 'filter2', name: 'Vacuum Filter', img: 'vac_filter.png', pressure: '0.1-0.9', flow: '1-30' }
            ],
            centrifuge: [
                { id: 'cent1', name: 'Decanter Centrifuge', img: 'decanter.png', rpm: '3000-4500', capacity: '1-10' }
            ],
            membrane: [
                { id: 'memb1', name: 'Ultrafiltration', img: 'uf.png', pressure: '2-10', pore_size: '0.01-0.1' }
            ]
        },
        preprocess: {
            grinder: [
                { id: 'grind1', name: 'Hammer Mill', img: 'hammer.png', capacity: '0.5-5', power: '10-50' }
            ],
            dryer: [
                { id: 'dry1', name: 'Rotary Dryer', img: 'rotary.png', temperature: '80-200', capacity: '1-10' }
            ],
            screener: [
                { id: 'screen1', name: 'Vibrating Screen', img: 'vibscreen.png', mesh: '10-100', capacity: '1-5' }
            ],
            steamer: [
                { id: 'steam1', name: 'Steam Reactor', img: 'steam.png', temperature: '100-180', pressure: '5-15' }
            ]
        },
        storage: {
            tank: [
                { id: 'tank1', name: 'Storage Tank', img: 'tank.png', volume: '10-100', pressure: '1-3' }
            ],
            silo: [
                { id: 'silo1', name: 'Biomass Silo', img: 'silo.png', volume: '50-500', material: 'Solid' }
            ],
            bin: [
                { id: 'bin1', name: 'Waste Bin', img: 'bin.png', volume: '5-50', material: 'Waste' }
            ],
            hopper: [
                { id: 'hopper1', name: 'Feed Hopper', img: 'hopper.png', volume: '1-10', material: 'Feed' }
            ]
        }
    };

    // Add event listeners for all component type selectors
    ['reactor', 'exchanger', 'pump', 'feedstock', 'separator', 'preprocess', 'storage'].forEach(type => {
        const selector = document.getElementById(`${type}Type`);
        const container = document.getElementById(`${type}Components`);
        
        selector.addEventListener('change', (e) => {
            const selectedType = e.target.value;
            container.innerHTML = '';
            
            if (selectedType) {
                container.classList.add('active');
                
                if (componentTypes[type] && componentTypes[type][selectedType]) {
                    componentTypes[type][selectedType].forEach(item => {
                        const component = document.createElement('div');
                        component.className = 'component';
                        component.draggable = true;
                        component.id = item.id;
                        
                        component.innerHTML = `
                            <img src="/static/images/${item.img}" 
                                 alt="${item.name}" 
                                 width="180" 
                                 height="100" 
                                 draggable="true">
                            <span>${item.name}</span>
                        `;
                        
                        component.addEventListener('dragstart', dragStart);
                        container.appendChild(component);
                    });
                }
            } else {
                container.classList.remove('active');
            }
        });
    });
});