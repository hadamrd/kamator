import L from 'leaflet';
import './styles/resourceLegend.css'; // Ensure you have some basic CSS

const resourceIcons = import.meta.glob('/src/assets/dofusMap/resourceSprite/*.png');

export class ResourceLegend extends L.Control {

    constructor(options = {}) {
        super(options);
        this.resources = options.resources; // Expecting a dictionary of resources
    }

    onAdd(map) {
        this._map = map;
        this._container = L.DomUtil.create('div', 'resource-legend');
        this.draw(this.resources);
        this._container.addEventListener('mouseover', () => {
            this._container.style.overflowY = 'auto';  // Enable scrolling on hover
        });

        this._container.addEventListener('mouseout', () => {
            this._container.style.overflowY = 'hidden';  // Disable scrolling when not hovered
        });

        // Prevent map zoom when scrolling over the legend
        this._container.addEventListener('wheel', event => {
            event.preventDefault(); // Prevent scrolling the page or zooming the map
            event.stopPropagation(); // Stop the event from bubbling up to the map
            this._container.scrollTop += event.deltaY; // Manually handle scrolling
        });

        return this._container;
    }

    draw(resources) {
        this.resources = resources;
        let html = '<div class="legend-title">Selected Resources</div>';
        if (resources != null) {
            resources.forEach(resource => {
                const iconUrl = resourceIcons(`./${resource.id}.png`);
                html += `<div class="legend-item">
                            <img src="${iconUrl}" alt="${resource.name}" class="legend-icon">
                            <span class="legend-text">${resource.name}</span>
                        </div>`;
            });
        }
        this.adjustLegendColumns();
        this._container.innerHTML = html;
    }

    hide() {
        this._container.style.display = 'none';
    }

    show() {
        this._container.style.display = 'block';
    }

    adjustLegendColumns() {
        if (this._container.scrollHeight > 300) { // Check if the content height exceeds 150px
            this._container.style.gridTemplateColumns = 'repeat(2, 1fr)'; // Switch to two columns
        } else {
            this._container.style.gridTemplateColumns = '1fr'; // Switch back to one column
        }
    }
}
